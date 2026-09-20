const API_URL = 'https://freenet-backend1.vercel.app';

// تسجيل الـ Service Worker لتشغيل PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Fail:', err));
}

let currentUser = JSON.parse(localStorage.getItem('freenet_user')) || null;

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showDashboard();
    }
});

function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// 1. تسجيل الدخول
async function handleLogin(e) {
    e.preventDefault();
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const errEl = document.getElementById('loginError');
    const btn = document.getElementById('loginBtn');

    btn.disabled = true;
    btn.innerText = 'جاري التحقق...';
    errEl.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password })
        });
        const data = await res.json();

        if (data.success) {
            currentUser = data.user;
            localStorage.setItem('freenet_user', JSON.stringify(currentUser));
            showDashboard();
        } else {
            errEl.innerText = data.message || 'خطأ في رقم الهاتف أو كلمة المرور';
            errEl.classList.remove('hidden');
        }
    } catch (err) {
        errEl.innerText = 'تعذر الاتصال بالسيرفر، تحقق من الإنترنت';
        errEl.classList.remove('hidden');
    } font
    btn.disabled = false;
    btn.innerText = 'دخول إلى الحساب';
}

// 2. إنشاء حساب جديد
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const msgEl = document.getElementById('regMsg');
    const btn = document.getElementById('regBtn');

    btn.disabled = true;
    btn.innerText = 'جاري التسجيل...';
    msgEl.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, password })
        });
        const data = await res.json();
        
        if (data.success) {
            msgEl.className = 'text-xs text-center mt-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold p-2.5 rounded-xl';
            msgEl.innerText = 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.';
            msgEl.classList.remove('hidden');
            setTimeout(() => {
                closeModal('registerModal');
                document.getElementById('phoneInput').value = phone;
            }, 2000);
        } else {
            msgEl.className = 'text-xs text-center mt-3 text-red-400 bg-red-500/10 border border-red-500/20 font-semibold p-2.5 rounded-xl';
            msgEl.innerText = data.message || 'تعذر إنشاء الحساب';
            msgEl.classList.remove('hidden');
        }
    } catch (err) {
        msgEl.className = 'text-xs text-center mt-3 text-red-400 bg-red-500/10 border border-red-500/20 font-semibold p-2.5 rounded-xl';
        msgEl.innerText = 'خطأ في السيرفر، يرجى المحاولة لاحقاً';
        msgEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerText = 'تأكيد وإنشاء الحساب';
    }
}

// 3. سكريبت تغيير كلمة السر فودافون
async function handleVodafoneChange(e) {
    e.preventDefault();
    const number = document.getElementById('vfNumber').value.trim();
    const password = document.getElementById('vfOldPass').value.trim();
    const newPass = document.getElementById('vfNewPass').value.trim();
    const msgEl = document.getElementById('vfMsg');
    const btn = document.getElementById('vfSubmitBtn');

    btn.disabled = true;
    btn.innerText = 'جاري الاتصال بفودافون... ⏳';
    msgEl.classList.add('hidden');

    try {
        const res = await fetch(`${API_URL}/api/change-vodafone-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ number, password, newPass })
        });
        const data = await res.json();

        if (data.success) {
            msgEl.className = 'text-xs text-center mt-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 font-semibold p-2.5 rounded-xl';
            msgEl.innerText = data.message;
            msgEl.classList.remove('hidden');
            setTimeout(() => closeModal('forgotModal'), 3000);
        } else {
            msgEl.className = 'text-xs text-center mt-3 text-red-400 bg-red-500/10 border border-red-500/20 font-semibold p-2.5 rounded-xl';
            msgEl.innerText = data.message;
            msgEl.classList.remove('hidden');
        }
    } catch (err) {
        msgEl.className = 'text-xs text-center mt-3 text-red-400 bg-red-500/10 border border-red-500/20 font-semibold p-2.5 rounded-xl';
        msgEl.innerText = 'حدث خطأ أثناء تنفيذ سكريبت التغيير';
        msgEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.innerText = 'تشغيل أداة التغيير أونلاين 🚀';
    }
}

function showDashboard() {
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    document.getElementById('userInfo').classList.remove('hidden');
    document.getElementById('userInfo').classList.add('flex');
    
    document.getElementById('userName').innerText = currentUser.name || currentUser.phone;
    const badge = document.getElementById('userRoleBadge');
    if (currentUser.role === 'admin' || currentUser.role === 'owner') {
        badge.innerText = 'أدمن / أونر';
        badge.className = 'text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-semibold';
    } else {
        badge.innerText = 'عميل';
        badge.className = 'text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold';
    }

    loadAlerts();
    loadOwners();
    loadPackages();
}

function logout() {
    localStorage.removeItem('freenet_user');
    currentUser = null;
    location.reload();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(tabId).classList.remove('hidden');

    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        btn.className = 'flex-1 py-2.5 rounded-xl text-slate-400 hover:text-white transition';
    });
    document.getElementById(`tab-${tabId}`).className = 'flex-1 py-2.5 rounded-xl bg-emerald-600 text-white shadow transition';
}

async function loadAlerts() {
    const list = document.getElementById('alertsList');
    try {
        const res = await fetch(`${API_URL}/api/admin/renewal-alerts`);
        const alerts = await res.json();
        if (!alerts || !alerts.length) {
            list.innerHTML = `<div class="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center text-slate-400 text-xs">لا توجد اشتراكات متبقية قريبة من الانتهاء 👍</div>`;
            return;
        }
        list.innerHTML = alerts.map(item => `
            <div class="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/80 flex justify-between items-center shadow-sm">
                <div>
                    <p class="font-bold text-white text-xs">${item.users?.name || 'عميل'}</p>
                    <p class="text-[11px] text-slate-400">${item.users?.phone || ''}</p>
                </div>
                <div class="text-left">
                    <span class="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded-lg font-semibold">تجديد: ${item.next_renewal_date || 'قريباً'}</span>
                </div>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="text-red-400 text-xs text-center py-4">تعذر تحميل التنبيهات</p>`;
    }
}

async function loadOwners() {
    const list = document.getElementById('ownersList');
    try {
        const res = await fetch(`${API_URL}/api/admin/owners`);
        const owners = await res.json();
        if (!owners || !owners.length) {
            list.innerHTML = `<div class="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center text-slate-400 text-xs">لا توجد أرقام مسجلة بالأدمن حالياً</div>`;
            return;
        }
        list.innerHTML = owners.map(owner => `
            <div class="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/80 flex justify-between items-center shadow-sm">
                <div>
                    <p class="font-bold text-emerald-400 text-xs">${owner.name || 'أونر فري نت'}</p>
                    <p class="text-[11px] text-slate-300">${owner.phone}</p>
                </div>
                <a href="tel:${owner.phone}" class="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white p-2 rounded-xl border border-emerald-500/30 transition text-xs">
                    <i class="fa-solid fa-phone"></i> اتصال
                </a>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="text-red-400 text-xs text-center py-4">تعذر تحميل الأرقام</p>`;
    }
}

async function loadPackages() {
    const list = document.getElementById('packagesList');
    try {
        const res = await fetch(`${API_URL}/api/packages`);
        const pkgs = await res.json();
        if (!pkgs || !pkgs.length) {
            list.innerHTML = `<div class="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center text-slate-400 text-xs">لا توجد باقات متاحة حالياً</div>`;
            return;
        }
        list.innerHTML = pkgs.map(pkg => `
            <div class="bg-slate-800 p-3.5 rounded-2xl border border-slate-700/80 flex justify-between items-center shadow-sm">
                <div>
                    <span class="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">${pkg.provider || 'فودافون'}</span>
                    <h4 class="font-bold text-white text-xs mt-1">${pkg.name}</h4>
                </div>
                <span class="text-sm font-black text-emerald-400">${pkg.price} ج.م</span>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = `<p class="text-red-400 text-xs text-center py-4">تعذر تحميل الباقات</p>`;
    }
}
