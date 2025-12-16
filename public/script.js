// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
if (!authToken) {
    // رمز وهمي مؤقت لتجاوز مشكلة المصادقة في الواجهة الأمامية للاختبار
    // في تطبيق حقيقي، يجب الحصول على هذا الرمز بعد تسجيل الدخول
    authToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMCIsImlhdCI6MTY3ODg4NjQwMCwiZXhwIjoxNjc4ODkwMDAwfQ.dummy_signature_for_testing';
    localStorage.setItem('authToken', authToken);
}


// ==







// ============ Initialization ============
window.addEventListener('load', function() {
	    console.log('✅ Nexora loaded successfully with new UI logic');
	});


