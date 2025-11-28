# Nexora — Web (Server + Frontend)

محتوى الحزمة:
- Backend: Node.js + Express + Socket.io + MongoDB (Mongoose)
- Frontend: HTML / CSS / JS (مع Socket.IO client)
- شعار: logo.svg
- ملف إعدادات مثال: .env.example

## متطلبات تشغيل
- Node.js (v16+)
- MongoDB (تشغيل محلي أو Atlas)
- الإنترنت لتحميل الحزم عبر npm

## الإعداد السريع (محلي)
1. فكّ الضغط وتشغيل:
   ```bash
   cd nexora_web_project
   npm install
   ```
2. أنشئ ملف `.env` بالمحتوى التالي (عدل القيم):
   ```
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/nexora
   JWT_SECRET=secret_key_here
   ```
3. شغل السيرفر:
   ```bash
   npm start
   ```
4. افتح المتصفح إلى: `http://localhost:3000` وستعمل الواجهة.

## الملاحظات
- الواجهة البسيطة تستخدم Socket.IO للرسائل الخاصة. السيرفر يحفظ الرسائل في MongoDB.
- هذا مشروع مبدئي وقابل للتطوير: تحسين الأمان، التحقق من المدخلات، رفع الصور، تحميل الملفات، إشعارات، وخلافه.

تم تجهيز كل شيء — حمل الملف وجربه.
