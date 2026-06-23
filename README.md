# Motqdmon Aid News API (Backend Only)

مشروع Backend (API) باستخدام **Node.js + Express** لقراءة آخر أخبار/تحديثات **المساعدات في غزة** من موقع **المتقدمون** بشكل أوتوماتيكي باستخدام **Web Scraping**.
لا يوجد Frontend في المشروع.

## ماذا يقرأ النظام؟
- **عنوان الخبر**
- **تاريخ الخبر**
- من **أول 10 صفحات** فقط
- يتم التخزين في قاعدة بيانات SQLite مع **منع التكرار** (اعتماداً على URL فريد)

## التقنيات
- Node.js / Express
- Puppeteer (Scraping عبر متصفح Headless لضمان قراءة DOM النهائي)
- SQLite + Knex

---

## التشغيل (Step-by-step)

### 1) تثبيت الحزم
```bash
npm install
```

### 2) إعداد البيئة
انسخ ملف البيئة:
- انسخ `.env.example` إلى `.env`
- تأكد أن:
  - `BASE_URL` مضبوط
  - `MAX_PAGES=10`

### 3) إنشاء قاعدة البيانات (Migration)
```bash
npm run db:migrate
```

### 4) تشغيل السيرفر
```bash
npm run dev
```

> عند تشغيل السيرفر، إذا كانت `SCRAPE_ON_START=true` سيتم تنفيذ Scraping تلقائيًا وتخزين الأخبار الجديدة فقط.

### (اختياري) تشغيل Scraping يدويًا
```bash
npm run scrape
```

---

## API Endpoints

### Health
- `GET /health`
يرجع:
```json
{ "ok": true }
```

### 1) جلب الأخبار مع Pagination
- `GET /api/news?page=1&limit=10`

Response مثال:
```json
{
  "success": true,
  "data": [
    { "id": 1, "title": "...", "date_text": "...", "url": "...", "likes": 0, "created_at": "..." }
  ],
  "meta": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

### 2) إضافة Like على خبر
- `POST /api/news/:id/like`

---

## آلية الـ Web Scraping (Puppeteer)
- فتح صفحة المساعدات عبر **Puppeteer**
- استخراج روابط العناوين عبر سيلكتورات عامة (مثل h2/h3 + a أو rel=bookmark)
- محاولة التقاط التاريخ من نفس بلوك الخبر (time/abbr/…)، وإن لم يتوفر يتم استخدام تاريخ عام من الصفحة كـ fallback
- الانتقال للصفحات الأقدم عبر رابط **"المنشورات الأقدم / Older Posts"**
- التكرار حتى `MAX_PAGES` (المطلوب: 10)

## منع التكرار
- حقل `url` في جدول `news` معرف كـ **Unique**
- أي خبر مكرر يتم تجاهله تلقائياً

---

## هيكل المشروع
```
src/
  app.js
  server.js
  routes/news.routes.js
  controllers/news.controller.js
  services/
    scraper.service.js
    news.service.js
  db/
    knex.js
    migrate.js
  utils/
    response.js
    asyncHandler.js
```
