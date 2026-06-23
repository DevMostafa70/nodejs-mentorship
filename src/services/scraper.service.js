require("dotenv").config();
const puppeteer = require("puppeteer");
const { insertIgnoreDuplicates } = require("./news.service");

const BASE_URL = process.env.BASE_URL;

function normalizeText(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function isProbablyPostUrl(url) {
  if (!url) return false;
  const u = url.toLowerCase();
  if (u.includes("/search")) return false;
  if (u.includes("#")) return false;
  return true;
}

/**
 * ✅ Replacement for page.waitForTimeout (not available in some puppeteer versions)
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeOnePage(page) {
  await sleep(800);

  const result = await page.evaluate(() => {
    const normalize = (s) => String(s || "").replace(/\s+/g, " ").trim();

    const linkSelectors = [
      "h3.post-title a",
      "h2.post-title a",
      "a[rel='bookmark']",
      "a.entry-title-link",
      "h3 a",
      "h2 a"
    ];

    const dateSelectors = [
      "time.published",
      "abbr.published",
      "time",
      "abbr",
      ".post-timestamp",
      "span.post-date",
      "span.post-timestamp",
      "h2.date-header",
      ".date-header"
    ];

    function findClosestDateText(anchorEl) {
      let node = anchorEl;
      for (let i = 0; i < 6; i++) {
        if (!node) break;
        const container =
          node.closest?.(
            "article, .post, .post-outer, .blog-posts, .post-body, .post-content, .post-header"
          ) || node.parentElement;

        if (container) {
          for (const sel of dateSelectors) {
            const d = container.querySelector(sel);
            const t = d ? normalize(d.textContent) : "";
            if (t && t.length >= 4) return t;
          }
        }
        node = node.parentElement;
      }
      return null;
    }

    let pageDateFallback = null;
    for (const sel of dateSelectors) {
      const d = document.querySelector(sel);
      const t = d ? normalize(d.textContent) : "";
      if (t && t.length >= 4) {
        pageDateFallback = t;
        break;
      }
    }

    const found = [];
    for (const sel of linkSelectors) {
      document.querySelectorAll(sel).forEach((a) => {
        const title = normalize(a.textContent);
        const url = a.getAttribute("href");
        if (!title || !url) return;
        found.push({ title, url });
      });
      if (found.length >= 10) break;
    }

    const byUrl = new Map();
    for (const it of found) {
      if (!byUrl.has(it.url)) byUrl.set(it.url, it);
    }

    const items = Array.from(byUrl.values()).map((it) => {
      let anchor = null;
      try {
        anchor = document.querySelector(`a[href="${CSS.escape(it.url)}"]`);
      } catch (e) {}
      const localDate = anchor ? findClosestDateText(anchor) : null;
      return {
        title: it.title,
        url: it.url,
        date_text: localDate || pageDateFallback || "UNKNOWN_DATE"
      };
    });

    const next =
      document.querySelector("a.blog-pager-older-link")?.getAttribute("href") ||
      document.querySelector("a#Blog1_blog-pager-older-link")?.getAttribute("href") ||
      Array.from(document.querySelectorAll("a"))
        .find((a) => a.textContent.includes("المنشورات الأقدم"))
        ?.getAttribute("href") ||
      Array.from(document.querySelectorAll("a"))
        .find((a) => a.textContent.includes("Older Posts"))
        ?.getAttribute("href") ||
      null;

    return { items, nextUrl: next };
  });

  return result;
}

async function runScrapeOnce({ maxPages = 10 } = {}) {
  if (!BASE_URL) throw new Error("BASE_URL is missing in .env");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });

  const page = await browser.newPage();

  // ✅ Speed up navigation: block heavy resources (images/fonts/stylesheets)
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const type = req.resourceType();
    if (type === "image" || type === "stylesheet" || type === "font") {
      return req.abort();
    }
    req.continue();
  });

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari"
  );

  let url = BASE_URL;
  let pagesFetched = 0;
  let totalFound = 0;
  let totalInserted = 0;

  try {
    while (url && pagesFetched < maxPages) {
      pagesFetched++;

      // ✅ was: networkidle2 + 60s -> causes timeouts on slow networks
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 180000 });

      // ✅ small extra wait to ensure posts are rendered
      await sleep(1200);

      const { items, nextUrl } = await scrapeOnePage(page);

      const cleaned = (items || [])
        .map((x) => ({
          title: normalizeText(x.title),
          url: x.url,
          date_text: normalizeText(x.date_text || "UNKNOWN_DATE")
        }))
        .filter((x) => x.title.length >= 6)
        .filter((x) => isProbablyPostUrl(x.url));

      totalFound += cleaned.length;

      if (cleaned.length > 0) {
        const { inserted } = await insertIgnoreDuplicates(cleaned);
        totalInserted += inserted;
      }

      url = nextUrl || null;
      await sleep(700);
    }

    return { pagesFetched, totalFound, totalInserted };
  } finally {
    await browser.close();
  }
}

module.exports = { runScrapeOnce };
