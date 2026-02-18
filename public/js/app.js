// public/js/app.js — eLoan SPA

let currentUser = null;

// ── UTILS ────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = (n) => 'M ' + parseFloat(n).toLocaleString('en-LS', { minimumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : '—';
const badge = (status) => `<span class="badge badge-${status}">${status}</span>`;
function showAlert(msg, type = 'error') {
    return `<div class="alert alert-${type}">${msg}</div>`;
}
function initials(name) {
    return (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── RENDER SHELL ─────────────────────────────
function renderShell(pageTitle, navItems, contentHtml) {
    const userNavItems = [
        { id: 'home', icon: '⌂', label: 'Dashboard' },
        { id: 'apply', icon: '✦', label: 'Apply for Loan' },
        { id: 'my-loans', icon: '◈', label: 'My Loans' },
        { id: 'emi-calc', icon: '◎', label: 'EMI Calculator' },
        { id: 'change-pw', icon: '⚿', label: 'Change Password' },
    ];
    const adminNavItems = [
        { id: 'admin-dashboard', icon: '⌂', label: 'Dashboard' },
        { id: 'admin-loans', icon: '◈', label: 'All Loans' },
        { id: 'admin-customers', icon: '◉', label: 'Customers' },
        { id: 'admin-loan-types', icon: '✦', label: 'Loan Types' },
        { id: 'admin-payments', icon: '◎', label: 'Payments' },
        { id: 'change-pw', icon: '⚿', label: 'Change Password' },
    ];
    const items = currentUser?.role === 'admin' ? adminNavItems : userNavItems;
    $('#app').innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <h1>eLoan</h1>
          <span>Management System</span>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section-label">${currentUser?.role === 'admin' ? 'Admin' : 'Customer'} Menu</div>
          ${items.map(i => `<div class="nav-item${i.id === navItems ? ' active' : ''}" data-nav="${i.id}">
            <span class="icon">${i.icon}</span>${i.label}</div>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user-name">${currentUser?.full_name}</div>
          <div>${currentUser?.email}</div>
          <br>
          <span class="btn btn-ghost btn-sm" id="logout-btn">Sign Out</span>
        </div>
      </aside>
      <div class="main-content">
        <div class="topbar">
          <span class="topbar-title">${pageTitle}</span>
          <div class="topbar-right">
            <div class="user-badge">
              <div class="user-avatar">${initials(currentUser?.full_name)}</div>
              ${currentUser?.full_name}
            </div>
          </div>
        </div>
        <div class="page-content fade-in" id="page-content">${contentHtml}</div>
      </div>
    </div>`;

    $$('.nav-item').forEach(el => {
        el.addEventListener('click', () => navigate(el.dataset.nav));
    });
    $('#logout-btn').addEventListener('click', logout);
}

// ── ROUTER ───────────────────────────────────
async function navigate(page) {
    if (!currentUser) { renderLogin(); return; }
    const isAdmin = currentUser.role === 'admin';
    if (isAdmin) {
        switch(page) {
            case 'admin-dashboard': return renderAdminDashboard();
            case 'admin-loans': return renderAdminLoans();
            case 'admin-customers': return renderCustomers();
            case 'admin-loan-types': return renderLoanTypes();
            case 'admin-payments': return renderAdminPayments();
            case 'change-pw': return renderChangePw();
            default: return renderAdminDashboard();
        }
    } else {
        switch(page) {
            case 'home': return renderCustomerDashboard();
            case 'apply': return renderApplyLoan();
            case 'my-loans': return renderMyLoans();
            case 'emi-calc': return renderEmiCalc();
            case 'change-pw': return renderChangePw();
            default: return renderCustomerDashboard();
        }
    }
}

// ── AUTH ─────────────────────────────────────
function renderLogin() {
    $('#app').innerHTML = `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo"><h1>eLoan</h1><p>Management System</p></div>
        <h2 class="auth-title">Welcome Back</h2>
        <p class="auth-sub">Sign in to your account</p>
        <div id="auth-msg"></div>
        <div class="form-group"><label class="form-label">Email Address</label>
          <input class="form-control" id="login-email" type="email" placeholder="you@example.com"></div>
        <div class="form-group"><label class="form-label">Password</label>
          <input class="form-control" id="login-pw" type="password" placeholder="••••••••"></div>
        <button class="btn btn-primary btn-lg" style="width:100%" id="login-btn">Sign In</button>
        <div class="auth-switch">Don't have an account? <a id="go-register">Register here</a></div>
      </div>
    </div>`;
    $('#login-btn').addEventListener('click', doLogin);
    $('#login-email').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
    $('#login-pw').addEventListener('keydown', e => e.key === 'Enter' && doLogin());
    $('#go-register').addEventListener('click', renderRegister);
}

async function doLogin() {
    const email = $('#login-email').value.trim();
    const password = $('#login-pw').value;
    const msg = $('#auth-msg');
    if (!email || !password) { msg.innerHTML = showAlert('Please enter email and password.'); return; }
    try {
        const res = await API.post('/api/auth/login', { email, password });
        currentUser = res.user;
        navigate(currentUser.role === 'admin' ? 'admin-dashboard' : 'home');
    } catch(e) { msg.innerHTML = showAlert(e.message); }
}

function renderRegister() {
    $('#app').innerHTML = `
    <div class="auth-page">
      <div class="auth-box">
        <div class="auth-logo"><h1>eLoan</h1><p>Management System</p></div>
        <h2 class="auth-title">Create Account</h2>
        <p class="auth-sub">Register as a new customer</p>
        <div id="auth-msg"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Full Name</label>
            <input class="form-control" id="r-name" placeholder="John Doe"></div>
          <div class="form-group"><label class="form-label">Phone</label>
            <input class="form-control" id="r-phone" placeholder="+266 XXXX XXXX"></div>
        </div>
        <div class="form-group"><label class="form-label">Email Address</label>
          <input class="form-control" id="r-email" type="email" placeholder="you@example.com"></div>
        <div class="form-group"><label class="form-label">Address</label>
          <input class="form-control" id="r-addr" placeholder="Your address"></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Password</label>
            <input class="form-control" id="r-pw" type="password" placeholder="••••••••"></div>
          <div class="form-group"><label class="form-label">Confirm Password</label>
            <input class="form-control" id="r-pw2" type="password" placeholder="••••••••"></div>
        </div>
        <button class="btn btn-primary btn-lg" style="width:100%" id="reg-btn">Create Account</button>
        <div class="auth-switch">Already have an account? <a id="go-login">Sign in</a></div>
      </div>
    </div>`;
    $('#reg-btn').addEventListener('click', doRegister);
    $('#go-login').addEventListener('click', renderLogin);
}

async function doRegister() {
    const full_name = $('#r-name').value.trim();
    const email = $('#r-email').value.trim();
    const phone = $('#r-phone').value.trim();
    const address = $('#r-addr').value.trim();
    const password = $('#r-pw').value;
    const pw2 = $('#r-pw2').value;
    const msg = $('#auth-msg');
    if (!full_name || !email || !password) { msg.innerHTML = showAlert('Name, email and password are required.'); return; }
    if (password !== pw2) { msg.innerHTML = showAlert('Passwords do not match.'); return; }
    if (password.length < 6) { msg.innerHTML = showAlert('Password must be at least 6 characters.'); return; }
    try {
        await API.post('/api/auth/register', { full_name, email, phone, address, password });
        msg.innerHTML = showAlert('Registration successful! Please sign in.', 'success');
        setTimeout(renderLogin, 1500);
    } catch(e) { msg.innerHTML = showAlert(e.message); }
}

async function logout() {
    await API.post('/api/auth/logout');
    currentUser = null;
    renderLogin();
}

// ── CUSTOMER DASHBOARD ────────────────────────
async function renderCustomerDashboard() {
    renderShell('Dashboard', 'home', '<div class="loading">Loading...</div>');
    try {
        const loans = await API.get('/api/loans/my');
        const total = loans.reduce((s, l) => s + parseFloat(l.amount), 0);
        const active = loans.filter(l => l.status === 'disbursed' || l.status === 'approved').length;
        const pending = loans.filter(l => l.status === 'pending').length;
        const html = `
        <div class="page-header"><h2>Good day, ${currentUser.full_name.split(' ')[0]}</h2><p>Here's your loan overview.</p></div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Total Loans</div><div class="stat-value">${loans.length}</div><div class="stat-sub">All applications</div></div>
          <div class="stat-card"><div class="stat-label">Active Loans</div><div class="stat-value">${active}</div><div class="stat-sub">Approved / Disbursed</div></div>
          <div class="stat-card"><div class="stat-label">Pending</div><div class="stat-value">${pending}</div><div class="stat-sub">Awaiting review</div></div>
          <div class="stat-card"><div class="stat-label">Total Borrowed</div><div class="stat-value text-gold" style="font-size:22px">${fmt(total)}</div><div class="stat-sub">Lifetime</div></div>
        </div>
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Applications</span>
            <button class="btn btn-primary btn-sm" onclick="navigate('apply')">+ New Loan</button>
          </div>
          <div class="card-body" style="padding:0">
            ${loans.length === 0 ? '<div class="empty-state"><div class="icon">◈</div><p>No loan applications yet.<br><a class="text-gold" style="cursor:pointer" onclick="navigate(\'apply\')">Apply for your first loan</a></p></div>' : `
            <div class="table-wrap"><table>
              <thead><tr><th>Loan Type</th><th>Amount</th><th>Tenure</th><th>Monthly EMI</th><th>Status</th><th>Applied</th></tr></thead>
              <tbody>${loans.slice(0,5).map(l => `<tr>
                <td class="fw-600">${l.loan_type_name}</td>
                <td>${fmt(l.amount)}</td>
                <td>${l.tenure_months} months</td>
                <td>${fmt(l.monthly_emi)}</td>
                <td>${badge(l.status)}</td>
                <td class="text-muted">${fmtDate(l.applied_at)}</td>
              </tr>`).join('')}</tbody>
            </table></div>`}
          </div>
        </div>`;
        $('#page-content').innerHTML = html;
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── APPLY LOAN ────────────────────────────────
async function renderApplyLoan() {
    renderShell('Apply for Loan', 'apply', '<div class="loading">Loading loan types...</div>');
    try {
        const types = await API.get('/api/loans/types');
        $('#page-content').innerHTML = `
        <div class="page-header"><h2>Apply for a Loan</h2><p>Fill in the form below to submit your loan application.</p></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:960px">
          <div class="card">
            <div class="card-header"><span class="card-title">Loan Application</span></div>
            <div class="card-body">
              <div id="apply-msg"></div>
              <div class="form-group"><label class="form-label">Loan Type</label>
                <select class="form-control" id="loan-type">
                  <option value="">— Select Loan Type —</option>
                  ${types.map(t => `<option value="${t.id}" data-rate="${t.interest_rate}" data-max="${t.max_amount}" data-maxten="${t.max_tenure_months}">${t.name} — ${t.interest_rate}% p.a.</option>`).join('')}
                </select></div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Loan Amount (M)</label>
                  <input class="form-control" id="loan-amount" type="number" min="1000" placeholder="e.g. 50000">
                  <div class="form-hint" id="max-hint"></div></div>
                <div class="form-group"><label class="form-label">Tenure (Months)</label>
                  <input class="form-control" id="loan-tenure" type="number" min="1" placeholder="e.g. 24">
                  <div class="form-hint" id="max-tenure-hint"></div></div>
              </div>
              <div class="form-group"><label class="form-label">Purpose</label>
                <textarea class="form-control" id="loan-purpose" placeholder="Briefly describe the purpose of this loan..."></textarea></div>
              <button class="btn btn-primary" style="width:100%;margin-top:4px" id="apply-btn">Submit Application</button>
            </div>
          </div>
          <div>
            <div class="card mb-3">
              <div class="card-header"><span class="card-title">EMI Preview</span></div>
              <div class="card-body">
                <div id="emi-preview"><div class="empty-state" style="padding:20px"><p>Select loan type and enter amount to see EMI estimate.</p></div></div>
              </div>
            </div>
            <div class="card">
              <div class="card-header"><span class="card-title">Available Loan Types</span></div>
              <div class="card-body" style="padding:0">
                <div class="table-wrap"><table>
                  <thead><tr><th>Type</th><th>Rate</th><th>Max Amount</th></tr></thead>
                  <tbody>${types.map(t => `<tr><td>${t.name}</td><td>${t.interest_rate}%</td><td>${fmt(t.max_amount)}</td></tr>`).join('')}</tbody>
                </table></div>
              </div>
            </div>
          </div>
        </div>`;

        function updateEmi() {
            const sel = $('#loan-type');
            const opt = sel.options[sel.selectedIndex];
            const amount = parseFloat($('#loan-amount').value);
            const tenure = parseInt($('#loan-tenure').value);
            if (opt.value && opt.dataset.rate) {
                $('#max-hint').textContent = `Max: ${fmt(opt.dataset.max)}`;
                $('#max-tenure-hint').textContent = `Max: ${opt.dataset.maxten} months`;
            }
            if (!amount || !tenure || !opt.value) return;
            const r = parseFloat(opt.dataset.rate) / 100 / 12;
            const emi = (amount * r * Math.pow(1+r, tenure)) / (Math.pow(1+r, tenure) - 1);
            $('#emi-preview').innerHTML = `
              <div style="display:grid;gap:12px">
                <div><div class="form-label">Monthly EMI</div><div style="font-family:var(--font-display);font-size:32px;font-weight:700;color:var(--gold)">${fmt(emi)}</div></div>
                <div class="form-row">
                  <div><div class="form-label">Total Payment</div><div class="fw-600">${fmt(emi * tenure)}</div></div>
                  <div><div class="form-label">Total Interest</div><div class="fw-600 text-danger">${fmt((emi * tenure) - amount)}</div></div>
                </div>
              </div>`;
        }

        $('#loan-type').addEventListener('change', updateEmi);
        $('#loan-amount').addEventListener('input', updateEmi);
        $('#loan-tenure').addEventListener('input', updateEmi);

        $('#apply-btn').addEventListener('click', async () => {
            const msg = $('#apply-msg');
            const loan_type_id = $('#loan-type').value;
            const amount = $('#loan-amount').value;
            const tenure_months = $('#loan-tenure').value;
            const purpose = $('#loan-purpose').value.trim();
            if (!loan_type_id || !amount || !tenure_months) { msg.innerHTML = showAlert('Please fill all required fields.'); return; }
            try {
                const res = await API.post('/api/loans/apply', { loan_type_id, amount: parseFloat(amount), tenure_months: parseInt(tenure_months), purpose });
                msg.innerHTML = showAlert(`Application submitted! Your monthly EMI will be ${fmt(res.monthly_emi)}.`, 'success');
                $('#apply-btn').disabled = true;
                setTimeout(() => navigate('my-loans'), 2000);
            } catch(e) { msg.innerHTML = showAlert(e.message); }
        });
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── MY LOANS ──────────────────────────────────
async function renderMyLoans() {
    renderShell('My Loans', 'my-loans', '<div class="loading">Loading...</div>');
    try {
        const loans = await API.get('/api/loans/my');
        let html = `<div class="page-header"><h2>My Loan Applications</h2><p>Track the status of all your loan applications.</p></div>
        <div class="card"><div class="card-body" style="padding:0">`;
        if (!loans.length) html += `<div class="empty-state"><div class="icon">◈</div><p>No applications found. <a class="text-gold" style="cursor:pointer" onclick="navigate('apply')">Apply now</a></p></div>`;
        else html += `<div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Tenure</th><th>EMI</th><th>Rate</th><th>Status</th><th>Applied</th><th></th></tr></thead>
          <tbody>${loans.map(l => `<tr>
            <td class="text-muted">#${l.id}</td>
            <td class="fw-600">${l.loan_type_name}</td>
            <td>${fmt(l.amount)}</td>
            <td>${l.tenure_months} mo</td>
            <td>${fmt(l.monthly_emi)}</td>
            <td>${l.interest_rate}%</td>
            <td>${badge(l.status)}</td>
            <td class="text-muted">${fmtDate(l.applied_at)}</td>
            <td>${l.status === 'disbursed' ? `<button class="btn btn-ghost btn-sm" onclick="viewPayments(${l.id})">Schedule</button>` : ''}</td>
          </tr>`).join('')}</tbody>
        </table></div>`;
        html += `</div></div><div id="payments-section"></div>`;
        $('#page-content').innerHTML = html;
        window.viewPayments = async (id) => {
            const pmts = await API.get(`/api/loans/${id}/payments`);
            const sec = $('#payments-section');
            sec.innerHTML = `<div class="card mt-3">
              <div class="card-header"><span class="card-title">EMI Payment Schedule — Loan #${id}</span></div>
              <div class="card-body" style="padding:0">
                <div class="table-wrap"><table>
                  <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th></tr></thead>
                  <tbody>${pmts.map((p, i) => `<tr><td>${i+1}</td><td>${fmtDate(p.payment_date)}</td><td>${fmt(p.amount)}</td><td>${badge(p.status)}</td></tr>`).join('')}</tbody>
                </table></div>
              </div></div>`;
            sec.scrollIntoView({ behavior: 'smooth' });
        };
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── EMI CALCULATOR ────────────────────────────
async function renderEmiCalc() {
    renderShell('EMI Calculator', 'emi-calc', '');
    const types = await API.get('/api/loans/types');
    $('#page-content').innerHTML = `
    <div class="page-header"><h2>EMI Calculator</h2><p>Estimate your monthly installment before applying.</p></div>
    <div style="max-width:600px">
      <div class="card">
        <div class="card-header"><span class="card-title">Calculate EMI</span></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Quick Select Loan Type</label>
            <select class="form-control" id="calc-type">
              <option value="">— or enter rate manually —</option>
              ${types.map(t => `<option value="${t.interest_rate}">${t.name} (${t.interest_rate}%)</option>`).join('')}
            </select></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Loan Amount (M)</label>
              <input class="form-control" id="calc-amount" type="number" placeholder="e.g. 100000"></div>
            <div class="form-group"><label class="form-label">Interest Rate (% p.a.)</label>
              <input class="form-control" id="calc-rate" type="number" step="0.01" placeholder="e.g. 12.5"></div>
          </div>
          <div class="form-group"><label class="form-label">Tenure (Months)</label>
            <input class="form-control" id="calc-tenure" type="number" placeholder="e.g. 36"></div>
          <button class="btn btn-primary" style="width:100%" id="calc-btn">Calculate</button>
          <div class="emi-result" id="emi-result">
            <h3>Calculation Result</h3>
            <div class="emi-grid">
              <div class="emi-item"><label>Monthly EMI</label><span id="r-emi">—</span></div>
              <div class="emi-item"><label>Total Payment</label><span id="r-total">—</span></div>
              <div class="emi-item"><label>Total Interest</label><span id="r-interest">—</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>`;

    $('#calc-type').addEventListener('change', function() {
        if (this.value) $('#calc-rate').value = this.value;
    });
    $('#calc-btn').addEventListener('click', () => {
        const principal = parseFloat($('#calc-amount').value);
        const rate = parseFloat($('#calc-rate').value);
        const tenure = parseInt($('#calc-tenure').value);
        if (!principal || !rate || !tenure) return;
        const r = rate / 100 / 12;
        const emi = (principal * r * Math.pow(1+r, tenure)) / (Math.pow(1+r, tenure) - 1);
        $('#r-emi').textContent = 'M ' + emi.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        $('#r-total').textContent = 'M ' + (emi*tenure).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        $('#r-interest').textContent = 'M ' + ((emi*tenure)-principal).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        $('#emi-result').classList.add('show');
    });
}

// ── CHANGE PASSWORD ───────────────────────────
function renderChangePw() {
    const nav = currentUser.role === 'admin' ? 'change-pw' : 'change-pw';
    renderShell('Change Password', nav, '');
    $('#page-content').innerHTML = `
    <div class="page-header"><h2>Change Password</h2><p>Keep your account secure with a strong password.</p></div>
    <div style="max-width:440px"><div class="card">
      <div class="card-body">
        <div id="pw-msg"></div>
        <div class="form-group"><label class="form-label">Current Password</label><input class="form-control" id="old-pw" type="password"></div>
        <div class="form-group"><label class="form-label">New Password</label><input class="form-control" id="new-pw" type="password"></div>
        <div class="form-group"><label class="form-label">Confirm New Password</label><input class="form-control" id="new-pw2" type="password"></div>
        <button class="btn btn-primary" style="width:100%" id="pw-btn">Update Password</button>
      </div>
    </div></div>`;
    $('#pw-btn').addEventListener('click', async () => {
        const old_password = $('#old-pw').value;
        const new_password = $('#new-pw').value;
        const c = $('#new-pw2').value;
        const msg = $('#pw-msg');
        if (!old_password || !new_password) { msg.innerHTML = showAlert('All fields required.'); return; }
        if (new_password !== c) { msg.innerHTML = showAlert('New passwords do not match.'); return; }
        if (new_password.length < 6) { msg.innerHTML = showAlert('Password must be at least 6 characters.'); return; }
        try {
            await API.post('/api/auth/change-password', { old_password, new_password });
            msg.innerHTML = showAlert('Password updated successfully.', 'success');
            $('#old-pw').value = $('#new-pw').value = $('#new-pw2').value = '';
        } catch(e) { msg.innerHTML = showAlert(e.message); }
    });
}

// ── ADMIN DASHBOARD ───────────────────────────
async function renderAdminDashboard() {
    renderShell('Admin Dashboard', 'admin-dashboard', '<div class="loading">Loading...</div>');
    try {
        const stats = await API.get('/api/loans/stats');
        $('#page-content').innerHTML = `
        <div class="page-header"><h2>Admin Overview</h2><p>Manage all loan operations from here.</p></div>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Total Loans</div><div class="stat-value">${stats.total_loans}</div><div class="stat-sub">All applications</div></div>
          <div class="stat-card"><div class="stat-label">Pending Review</div><div class="stat-value text-gold">${stats.pending}</div><div class="stat-sub">Awaiting action</div></div>
          <div class="stat-card"><div class="stat-label">Approved</div><div class="stat-value text-success">${stats.approved}</div><div class="stat-sub">Active loans</div></div>
          <div class="stat-card"><div class="stat-label">Customers</div><div class="stat-value">${stats.customers}</div><div class="stat-sub">Registered users</div></div>
          <div class="stat-card"><div class="stat-label">Total Disbursed</div><div class="stat-value text-gold" style="font-size:20px">${fmt(stats.total_amount)}</div><div class="stat-sub">Loan portfolio</div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title">Quick Actions</span></div>
          <div class="card-body" style="display:flex;gap:12px;flex-wrap:wrap">
            <button class="btn btn-primary" onclick="navigate('admin-loans')">📋 Review Loan Applications</button>
            <button class="btn btn-secondary" onclick="navigate('admin-customers')">👥 View Customers</button>
            <button class="btn btn-ghost" onclick="navigate('admin-loan-types')">⚙️ Manage Loan Types</button>
            <button class="btn btn-ghost" onclick="navigate('admin-payments')">💳 Payment Records</button>
          </div>
        </div>`;
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── ADMIN: ALL LOANS ──────────────────────────
async function renderAdminLoans() {
    renderShell('Loan Applications', 'admin-loans', '<div class="loading">Loading...</div>');
    try {
        const loans = await API.get('/api/loans/all');
        const statuses = ['pending','approved','rejected','disbursed','closed'];
        let html = `<div class="page-header"><h2>All Loan Applications</h2><p>Review and manage customer loan requests.</p></div>
        <div class="card"><div class="card-body" style="padding:0">
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Customer</th><th>Type</th><th>Amount</th><th>Tenure</th><th>EMI</th><th>Status</th><th>Applied</th><th>Actions</th></tr></thead>
          <tbody>${loans.map(l => `<tr id="loan-row-${l.id}">
            <td class="text-muted">#${l.id}</td>
            <td><div class="fw-600">${l.full_name}</div><div class="text-muted" style="font-size:11px">${l.email}</div></td>
            <td>${l.loan_type_name}</td>
            <td>${fmt(l.amount)}</td>
            <td>${l.tenure_months} mo</td>
            <td>${fmt(l.monthly_emi)}</td>
            <td id="status-${l.id}">${badge(l.status)}</td>
            <td class="text-muted">${fmtDate(l.applied_at)}</td>
            <td>
              <select class="form-control" style="font-size:12px;padding:4px 8px;width:120px" id="sel-${l.id}">
                ${statuses.map(s => `<option value="${s}"${s===l.status?' selected':''}>${s}</option>`).join('')}
              </select>
              <button class="btn btn-primary btn-sm mt-1" onclick="updateLoanStatus(${l.id})">Update</button>
              ${l.status==='disbursed'?`<button class="btn btn-ghost btn-sm mt-1" onclick="adminViewPayments(${l.id})">Payments</button>`:''}
            </td>
          </tr>`).join('')}</tbody>
        </table></div></div></div>
        <div id="admin-payments-section"></div>`;
        $('#page-content').innerHTML = html;

        window.updateLoanStatus = async (id) => {
            const status = $(`#sel-${id}`).value;
            try {
                await API.put(`/api/loans/${id}/status`, { status });
                $(`#status-${id}`).innerHTML = badge(status);
                alert(`Loan #${id} status updated to "${status}"`);
            } catch(e) { alert(e.message); }
        };
        window.adminViewPayments = async (id) => {
            const pmts = await API.get(`/api/loans/${id}/payments`);
            const sec = $('#admin-payments-section');
            sec.innerHTML = `<div class="card mt-3">
              <div class="card-header"><span class="card-title">Payment Schedule — Loan #${id}</span></div>
              <div class="card-body" style="padding:0">
                <div class="table-wrap"><table>
                  <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody id="pmt-body-${id}">${pmts.map((p, i) => `<tr id="pmt-${p.id}">
                    <td>${i+1}</td><td>${fmtDate(p.payment_date)}</td><td>${fmt(p.amount)}</td>
                    <td id="pmt-status-${p.id}">${badge(p.status)}</td>
                    <td>${p.status!=='paid'?`<button class="btn btn-success btn-sm" onclick="markPaid(${p.id})">Mark Paid</button>`:''}</td>
                  </tr>`).join('')}</tbody>
                </table></div>
              </div></div>`;
            sec.scrollIntoView({ behavior: 'smooth' });
        };
        window.markPaid = async (id) => {
            await API.put(`/api/loans/payments/${id}/pay`);
            $(`#pmt-status-${id}`).innerHTML = badge('paid');
            $(`#pmt-${id}`).querySelector('button')?.remove();
        };
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── ADMIN: CUSTOMERS ──────────────────────────
async function renderCustomers() {
    renderShell('Customers', 'admin-customers', '<div class="loading">Loading...</div>');
    try {
        const customers = await API.get('/api/loans/customers');
        let html = `<div class="page-header"><h2>Customer Master</h2><p>All registered customers.</p></div>
        <div class="card"><div class="card-body" style="padding:0">
        <div class="table-wrap"><table>
          <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Registered</th></tr></thead>
          <tbody>${customers.map(c => `<tr>
            <td class="text-muted">#${c.id}</td>
            <td class="fw-600">${c.full_name}</td>
            <td>${c.email}</td>
            <td>${c.phone || '—'}</td>
            <td>${c.address || '—'}</td>
            <td class="text-muted">${fmtDate(c.created_at)}</td>
          </tr>`).join('')}</tbody>
        </table></div></div></div>`;
        $('#page-content').innerHTML = html;
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── ADMIN: LOAN TYPES ─────────────────────────
async function renderLoanTypes() {
    renderShell('Loan Types', 'admin-loan-types', '<div class="loading">Loading...</div>');
    try {
        const types = await API.get('/api/loans/types');
        $('#page-content').innerHTML = `
        <div class="page-header"><h2>Loan Type Master</h2><p>Manage available loan products.</p></div>
        <div style="display:grid;grid-template-columns:1fr 1.5fr;gap:24px">
          <div class="card">
            <div class="card-header"><span class="card-title">Add Loan Type</span></div>
            <div class="card-body">
              <div id="lt-msg"></div>
              <div class="form-group"><label class="form-label">Name</label><input class="form-control" id="lt-name" placeholder="e.g. Gold Loan"></div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Interest Rate (%)</label><input class="form-control" id="lt-rate" type="number" step="0.01" placeholder="12.5"></div>
                <div class="form-group"><label class="form-label">Max Tenure (months)</label><input class="form-control" id="lt-ten" type="number" placeholder="60"></div>
              </div>
              <div class="form-group"><label class="form-label">Max Amount (M)</label><input class="form-control" id="lt-max" type="number" placeholder="500000"></div>
              <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="lt-desc"></textarea></div>
              <button class="btn btn-primary" style="width:100%" id="lt-btn">Add Loan Type</button>
            </div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title">Existing Types</span></div>
            <div class="card-body" style="padding:0">
              <div class="table-wrap"><table>
                <thead><tr><th>Name</th><th>Rate</th><th>Max Amount</th><th>Max Tenure</th></tr></thead>
                <tbody>${types.map(t => `<tr>
                  <td class="fw-600">${t.name}</td>
                  <td>${t.interest_rate}%</td>
                  <td>${fmt(t.max_amount)}</td>
                  <td>${t.max_tenure_months} mo</td>
                </tr>`).join('')}</tbody>
              </table></div>
            </div>
          </div>
        </div>`;
        $('#lt-btn').addEventListener('click', async () => {
            const name = $('#lt-name').value.trim();
            const interest_rate = $('#lt-rate').value;
            const max_tenure_months = $('#lt-ten').value;
            const max_amount = $('#lt-max').value;
            const description = $('#lt-desc').value.trim();
            const msg = $('#lt-msg');
            if (!name || !interest_rate || !max_tenure_months || !max_amount) { msg.innerHTML = showAlert('All fields required.'); return; }
            try {
                await API.post('/api/loans/types', { name, interest_rate, max_amount, max_tenure_months, description });
                msg.innerHTML = showAlert('Loan type added successfully!', 'success');
                setTimeout(() => renderLoanTypes(), 1000);
            } catch(e) { msg.innerHTML = showAlert(e.message); }
        });
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── ADMIN: PAYMENTS ───────────────────────────
async function renderAdminPayments() {
    renderShell('Payments', 'admin-payments', '<div class="loading">Loading...</div>');
    try {
        const loans = await API.get('/api/loans/all');
        const disbursed = loans.filter(l => l.status === 'disbursed');
        $('#page-content').innerHTML = `
        <div class="page-header"><h2>Receive Payment</h2><p>Select a disbursed loan to view and record payments.</p></div>
        <div class="card mb-3">
          <div class="card-header"><span class="card-title">Disbursed Loans</span></div>
          <div class="card-body" style="padding:0">
            <div class="table-wrap"><table>
              <thead><tr><th>Loan #</th><th>Customer</th><th>Type</th><th>Amount</th><th>EMI</th><th>Action</th></tr></thead>
              <tbody>${disbursed.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:24px">No disbursed loans.</td></tr>' :
                disbursed.map(l => `<tr>
                  <td>#${l.id}</td>
                  <td>${l.full_name}</td>
                  <td>${l.loan_type_name}</td>
                  <td>${fmt(l.amount)}</td>
                  <td>${fmt(l.monthly_emi)}</td>
                  <td><button class="btn btn-primary btn-sm" onclick="loadLoanPayments(${l.id})">View Schedule</button></td>
                </tr>`).join('')}
              </tbody>
            </table></div>
          </div>
        </div>
        <div id="pmts-area"></div>`;

        window.loadLoanPayments = async (id) => {
            const pmts = await API.get(`/api/loans/${id}/payments`);
            $('#pmts-area').innerHTML = `<div class="card">
              <div class="card-header"><span class="card-title">Payment Schedule — Loan #${id}</span></div>
              <div class="card-body" style="padding:0">
                <div class="table-wrap"><table>
                  <thead><tr><th>#</th><th>Due Date</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>${pmts.map((p, i) => `<tr id="p-row-${p.id}">
                    <td>${i+1}</td><td>${fmtDate(p.payment_date)}</td><td>${fmt(p.amount)}</td>
                    <td id="ps-${p.id}">${badge(p.status)}</td>
                    <td>${p.status !== 'paid' ? `<button class="btn btn-success btn-sm" onclick="receivePayment(${p.id})">Receive Payment</button>` : '<span class="text-success">✓ Paid</span>'}</td>
                  </tr>`).join('')}</tbody>
                </table></div>
              </div></div>`;
        };
        window.receivePayment = async (id) => {
            if (!confirm('Confirm payment received?')) return;
            await API.put(`/api/loans/payments/${id}/pay`);
            $(`#ps-${id}`).innerHTML = badge('paid');
            $(`#p-row-${id}`).querySelector('button').outerHTML = '<span class="text-success">✓ Paid</span>';
        };
    } catch(e) { $('#page-content').innerHTML = showAlert(e.message); }
}

// ── INIT ──────────────────────────────────────
async function init() {
    try {
        const res = await API.get('/api/auth/me');
        currentUser = res.user;
        navigate(currentUser.role === 'admin' ? 'admin-dashboard' : 'home');
    } catch {
        renderLogin();
    }
}

init();
