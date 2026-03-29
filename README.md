# Lmad Cafe — Firebase Setup Guide

## هيكل المشروع

```
lmad-firebase/
├── firebase.json          ← إعدادات Firebase
├── firestore.rules        ← قواعد الأمان
├── public/
│   └── index.html         ← صفحة الطلب (GitHub Pages)
├── functions/
│   ├── package.json
│   └── src/index.js       ← API (Loyverse + Firestore)
├── ApiClient.kt           ← تطبيق Android (انسخ للمشروع)
└── Models.kt              ← تطبيق Android (انسخ للمشروع)
```

---

## خطوات الإعداد

### ١. إنشاء مشروع Firebase

1. اذهب إلى [console.firebase.google.com](https://console.firebase.google.com)
2. انقر **Add project** → أدخل اسم: `lmad-cafe`
3. فعّل **Firestore Database** (Start in production mode)
4. فعّل **Hosting**

### ٢. تثبيت Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase init
```

اختر: **Hosting + Functions + Firestore**

### ٣. إضافة Firebase Config في index.html

بعد إنشاء المشروع، اذهب إلى **Project Settings** → **Your apps** → **Web app**
انسخ الـ config وضعه في `public/index.html`:

```javascript
const firebaseConfig = {
  apiKey:            "...",
  authDomain:        "lmad-cafe.firebaseapp.com",
  projectId:         "lmad-cafe",
  storageBucket:     "lmad-cafe.appspot.com",
  messagingSenderId: "...",
  appId:             "...",
};
```

أيضاً غيّر:
```javascript
const FIREBASE_PROJECT = "lmad-cafe";  // اسم مشروعك
```

### ٤. نشر Functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

ستحصل على رابط مثل:
```
https://us-central1-lmad-cafe.cloudfunctions.net/api
```

### ٥. نشر Hosting (GitHub Pages أو Firebase Hosting)

**خيار أ — Firebase Hosting:**
```bash
firebase deploy --only hosting
```

**خيار ب — GitHub Pages:**
- ارفع `public/index.html` كـ `index.html` في repo
- فعّل GitHub Pages من Settings

### ٦. تعديل تطبيق Android

في تطبيق الطابعة، غيّر الـ Server URL في الإعدادات إلى:
```
https://us-central1-lmad-cafe.cloudfunctions.net/api
```

انسخ ملفات `ApiClient.kt` و `Models.kt` إلى مجلد المشروع.

---

## API Endpoints

| Method | URL | الوصف |
|--------|-----|-------|
| GET | `/api/menu/categories` | جلب الفئات من Loyverse |
| GET | `/api/menu/items` | جلب المنتجات من Loyverse |
| POST | `/api/orders/create` | إنشاء طلب جديد |
| GET | `/api/orders` | كل الطلبات (للطابعة) |
| GET | `/api/orders/pending` | الطلبات غير المطبوعة |
| POST | `/api/orders/:id/printed` | تحديد كمطبوع |
| POST | `/api/orders/:id/status` | تحديث الحالة |

---

## Firestore Structure

```
orders/
  {auto-id}/
    orderNumber:   "WEB-ABC123"
    customerName:  "محمد"
    customerPhone: "79891624"
    orderType:     "table" | "car"
    tableNum:      5
    carDesc:       null
    notes:         "طاولة 5 | محمد | 79891624"
    status:        "new" | "preparing" | "ready" | "completed"
    printed:       "no" | "yes"
    totalAmount:   4.500
    items:         [{variantId, itemName, variantName, quantity, price}]
    loyverseReceiptId: "R-1234"
    createdAt:     Timestamp
    updatedAt:     Timestamp
```
