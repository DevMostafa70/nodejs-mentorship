require('dotenv').config();
const app = require('./app');
const { runScrapeOnce } = require('./services/scraper.service');
const logger = require('./config/logger');
const { scrapeLimiter } = require('./config/rateLimit');

const PORT = Number(process.env.PORT || 3000);

// دالة للسكراب مع حماية
async function performScrape() {
  const maxPages = Number(process.env.MAX_PAGES || 10);
  try {
    const result = await runScrapeOnce({ maxPages });
    logger.info('Scrape completed successfully', result);
    return result;
  } catch (error) {
    logger.error('Scrape failed:', error);
    throw error;
  }
}

app.listen(PORT, async () => {
  logger.info(`✅ Server running on http://localhost:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);

  // سكراب عند بدء التشغيل (إذا كان مفعل)
  const scrapeOnStart = String(process.env.SCRAPE_ON_START || 'true').toLowerCase() === 'true';
  if (scrapeOnStart) {
    try {
      const result = await performScrape();
      logger.info(`✅ Initial scrape: ${result.totalInserted} new articles inserted`);
    } catch (error) {
      logger.warn('⚠️ Initial scrape failed:', error.message);
    }
  }
});