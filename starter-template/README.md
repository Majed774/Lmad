# قالب موقع جديد (نسخة من Lmad)

هذا المجلد يحتوي على كل ما تحتاجه لبدء موقع جديد مطابق لموقع **Lmad**
(React + Vite، ورفع المنيو إلى Loyverse).

## محتويات المجلد

| الملف / المجلد | الوصف |
|---|---|
| `src/` | كود الموقع (`App.jsx`، `main.jsx`، ملفات CSS والصور) |
| `public/` | الأيقونات وملفات الـ favicon |
| `index.html` | الصفحة الرئيسية |
| `package.json` و `package-lock.json` | المكتبات المطلوبة بنفس الإصدارات |
| `vite.config.js` و `eslint.config.js` | إعدادات البناء والفحص |
| `upload.mjs` | سكربت رفع المنيو إلى Loyverse من سطر الأوامر |
| `.github/workflows/upload-menu.yml` | GitHub Action لتشغيل السكربت يدويًا |
| `.env.example` | مثال لملف المتغيرات (التوكن) |

## خطوات البدء في مستودع جديد

1. أنشئ مستودعًا جديدًا على GitHub (مثلًا `my-new-site`).
2. انسخ **محتويات** هذا المجلد (بما فيها الملفات المخفية `.github` و `.gitignore` و `.env.example`) إلى جذر المستودع الجديد.
3. ثبّت المكتبات:
   ```bash
   npm install
   ```
4. أنشئ ملف `.env.local` من المثال وضع فيه توكن Loyverse الخاص بك:
   ```bash
   cp .env.example .env.local
   ```
5. شغّل الموقع محليًا:
   ```bash
   npm run dev
   ```
6. للبناء للنشر:
   ```bash
   npm run build
   ```

## التوكن (مهم)

- التوكن **لم يعد مكتوبًا داخل الكود**؛ يُقرأ من المتغيرات:
  - الموقع: `VITE_LOYVERSE_TOKEN` من ملف `.env.local` (لا يُرفع إلى GitHub).
  - السكربت `upload.mjs`: `LOYVERSE_TOKEN`، مثال:
    ```bash
    LOYVERSE_TOKEN=xxxx node upload.mjs
    ```
  - الـ GitHub Action: أضف Secret باسم `LOYVERSE_TOKEN` من
    **Settings → Secrets and variables → Actions** في المستودع الجديد.
- ملاحظة: أي متغير يبدأ بـ `VITE_` يدخل في ملفات الموقع النهائية ويمكن لزوار الموقع رؤيته،
  فلا تنشر الموقع للعامة وفيه التوكن.

## ما الذي تغيّره للموقع الجديد

- الاسم: `name` في `package.json` و `<title>` في `index.html` (حاليًا `my-new-site`).
- المنيو: الكائن `MENU` في `src/App.jsx` و `upload.mjs`.
- الشكل: `src/App.css` و `src/index.css`.
