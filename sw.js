const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Connection
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Root Endpoint
app.get('/', (req, res) => {
    res.send('FreeNet STORE API Server is Running 🚀');
});

// 1. تسجيل الدخول (Login)
app.post('/api/login', async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال رقم الهاتف وكلمة المرور' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('phone', phone)
            .eq('password', password)
            .single();

        if (error || !data) {
            return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
        }

        res.json({ success: true, user: data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 2. إنشاء حساب جديد (Register)
app.post('/api/register', async (req, res) => {
    const { name, phone, password } = req.body;
    if (!phone || !password) {
        return res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
    }

    try {
        const { data, error } = await supabase
            .from('users')
            .insert([{ name: name || 'عميل جديد', phone, password, role: 'client' }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({ success: false, message: 'رقم الهاتف مسجل بالفعل أو حدث خطأ' });
        }

        res.json({ success: true, user: data });
    } catch (err) {
        res.status(500).json({ success: false, message: 'خطأ في السيرفر' });
    }
});

// 3. جلب الباقات المتاحة (Packages)
app.get('/api/packages', async (req, res) => {
    try {
        const { data, error } = await supabase.from('packages').select('*');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ message: 'تعذر جلب الباقات' });
    }
});

// 4. جلب أرقام حسابات الأونر (Owners Directory)
app.get('/api/admin/owners', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, phone, role')
            .eq('role', 'owner');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ message: 'تعذر جلب الأونرز' });
    }
});

// 5. تنبيهات التجديد (Renewal Alerts - 28 days)
app.get('/api/admin/renewal-alerts', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*, users(name, phone)');
        if (error) throw error;
        res.json(data || []);
    } catch (err) {
        res.status(500).json({ message: 'تعذر جلب التنبيهات' });
    }
});

// 6. سكريبت تغيير كلمة مرور فودافون أونلاين
app.post('/api/change-vodafone-password', async (req, res) => {
    const { number, password, newPass } = req.body;

    if (!number || !password || !newPass) {
        return res.status(400).json({ success: false, message: 'يرجى إدخال جميع البيانات المطلوبة' });
    }

    try {
        // تسجيل الدخول في فودافون للحصول على Token
        const tokenUrl = 'https://mobile.vodafone.com.eg/auth/realms/vf-realm/protocol/openid-connect/token';
        const tokenParams = new URLSearchParams({
            username: number,
            password: password,
            grant_type: 'password',
            client_secret: '95fd95fb-7489-4958-8ae6-d31a525cd20a',
            client_id: 'ana-vodafone-app'
        });

        const tokenRes = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/plain, */*',
                'silentLogin': 'true',
                'x-agent-operatingsystem': '13',
                'clientId': 'AnaVodafoneAndroid',
                'Accept-Language': 'en',
                'x-agent-device': 'Xiaomi M2102J20SG',
                'x-agent-version': '2025.11.1',
                'x-agent-build': '1063',
                'digitalId': '244BQYOGFM0IM',
                'device-id': 'b83aab2d8fa633da',
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'okhttp/4.12.0'
            },
            body: tokenParams
        });

        if (!tokenRes.ok) {
            return res.status(401).json({ success: false, message: 'فشل تسجيل الدخول بحساب فودافون. تأكد من صحة رقم الموبايل وكلمة المرور الحالية.' });
        }

        const tokenData = await tokenRes.json();
        const token = tokenData.access_token;

        // تغيير كلمة المرور في سيرفرات فودافون
        const changeUrl = 'https://web.vodafone.com.eg/services/dxl/sam/serviceAccountManagement/v1/serviceAccount';
        const payload = {
            "@type": "userPrefsUpdate",
            "customerAccount": {
                "authentication": {
                    "password": password,
                    "newPassword": newPass
                }
            },
            "resources": [
                {
                    "resourceType": "MSISDN",
                    "IDs": [{ "value": number }]
                }
            ]
        };

        const changeRes = await fetch(changeUrl, {
            method: 'PATCH',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept-Language': 'AR',
                'msisdn': number,
                'clientId': 'WebsiteConsumer',
                'Origin': 'https://web.vodafone.com.eg',
                'Referer': 'https://web.vodafone.com.eg/spa/profile'
            },
            body: JSON.stringify(payload)
        });

        const changeData = await changeRes.json();

        if (changeData.reason === 'Repeated Password') {
            return res.json({ success: false, message: 'كلمة المرور الجديدة مستخدمة من قبل. اختر كلمة مرور مختلفة.' });
        } else if (changeData.state === 'updated' || changeRes.ok) {
            return res.json({ success: true, message: 'تم تغيير كلمة مرور فودافون بنجاح!' });
        } else {
            return res.json({ success: false, message: changeData.message || 'حدثت مشكلة أثناء تحديث كلمة المرور.' });
        }

    } catch (err) {
        return res.status(500).json({ success: false, message: 'تعذر الاتصال بسيرفر فودافون حالياً.' });
    }
});

// Start Local Server / Export for Vercel
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
        
