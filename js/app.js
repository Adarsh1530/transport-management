/* ==========================================
   MAIN APPLICATION ROUTER & INTERACTION CONTROLLER
   ========================================== */

class AppController {
  constructor() {
    this.currentPage = 'dashboard';
    this.historyStack = [];
    this.init();
  }

  init() {
    this.bindEvents();
    this.startClock();
    this.checkSessionAndRoute();
  }

  checkSessionAndRoute() {
    const authView = document.getElementById('auth-view');
    const appLayout = document.getElementById('app-layout');

    if (window.auth.isLoggedIn()) {
      if (authView) authView.style.display = 'none';
      if (appLayout) appLayout.style.display = 'flex';
      this.setupRoleNavigation();
      this.updateHeaderUserInfo();
      this.updateNotifications();
      this.navigateTo(this.currentPage);
    } else {
      if (authView) authView.style.display = 'flex';
      if (appLayout) appLayout.style.display = 'none';
    }
  }

  resetSessionState() {
    this.currentPage = 'dashboard';
    this.historyStack = [];
    window.selectedDashboardSchoolId = 'all';
  }

  updateHeaderUserInfo() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    const userNameEl = document.getElementById('header-user-name');
    const userRoleEl = document.getElementById('header-user-role');
    const userAvatarEl = document.getElementById('header-user-avatar');

    if (userNameEl) userNameEl.innerText = user.name;
    if (userRoleEl) userRoleEl.innerText = user.role === 'School' ? user.schoolName : user.role;
    if (userAvatarEl) userAvatarEl.innerText = user.name.charAt(0).toUpperCase();
  }

  startClock() {
    const clockEl = document.getElementById('header-live-clock');
    const updateTime = () => {
      const now = new Date();
      const dateStr = new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(now);
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      if (clockEl) {
        clockEl.innerHTML = `<i class="fa-regular fa-clock"></i> ${dateStr} | ${timeStr}`;
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  updateNotifications() {
    const user = window.auth.getCurrentUser();
    if (!user) return;

    const renewals = window.db.getRenewals(user.role === 'School' ? user.schoolId : null);
    const urgentRenewals = renewals.filter(r => {
      const statusObj = getRenewalStatus(r.renewalDate);
      return statusObj.days <= 30; // Due within 30 days or expired
    });

    const badge = document.getElementById('notif-badge-count');
    const dropdownList = document.getElementById('notif-dropdown-list');

    if (badge) {
      if (urgentRenewals.length > 0) {
        badge.style.display = 'flex';
        badge.innerText = urgentRenewals.length;
      } else {
        badge.style.display = 'none';
      }
    }

    if (dropdownList) {
      if (urgentRenewals.length === 0) {
        dropdownList.innerHTML = `<div class="empty-state" style="padding: 20px;">No urgent renewal alerts.</div>`;
      } else {
        const vehicles = window.db.getVehicles();
        dropdownList.innerHTML = urgentRenewals.map(r => {
          const v = vehicles.find(veh => veh.id === r.vehicleId);
          const st = getRenewalStatus(r.renewalDate);
          return `
            <div class="dropdown-item">
              <i class="fa-solid fa-triangle-exclamation" style="color: var(--color-expense); margin-top: 2px;"></i>
              <div>
                <strong>${v ? v.busNo : 'Vehicle'} — ${r.type}</strong>
                <div style="font-size: 12px; color: var(--color-text-secondary);">${st.text} (${formatDate(r.renewalDate)})</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  navigateTo(pageId, pushHistory = true) {
    if (!window.auth.hasPermission(pageId)) {
      showToast('Access denied to this section', 'error');
      return;
    }

    if (pushHistory) {
      this.historyStack.push({ page: pageId });
    }

    this.currentPage = pageId;

    // Update active nav state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      if (item.dataset.page === pageId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    this.updateHeaderNavigation(pageId);

    // Toggle active view
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => {
      if (p.id === `${pageId}-view`) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    // Close mobile menu
    document.querySelector('.sidebar')?.classList.remove('active');

    // Trigger render logic
    switch (pageId) {
      case 'dashboard':
        if (typeof renderDashboard === 'function') renderDashboard();
        break;
      case 'schools':
        if (typeof renderSchoolsPage === 'function') renderSchoolsPage();
        break;
      case 'vehicles':
        if (typeof renderVehiclesPage === 'function') renderVehiclesPage();
        break;
      case 'drivers':
        if (typeof renderDriversPage === 'function') renderDriversPage();
        break;
      case 'routes':
        if (typeof renderRoutesPage === 'function') renderRoutesPage();
        break;
      case 'trips':
        if (typeof renderTripsPage === 'function') renderTripsPage();
        break;
      case 'income':
        if (typeof renderIncomePage === 'function') renderIncomePage();
        break;
      case 'expenses':
        if (typeof renderExpensesPage === 'function') renderExpensesPage();
        break;
      case 'renewals':
        if (typeof renderRenewalsPage === 'function') renderRenewalsPage();
        break;
      case 'reports':
        if (typeof renderReportsPage === 'function') renderReportsPage();
        break;
      case 'settings':
        this.renderSettingsPage();
        break;
    }

    if (window.motion && typeof window.motion.onPageTransition === 'function') {
      window.motion.onPageTransition(pageId);
    }
  }

  updateHeaderNavigation(pageId) {
    const breadcrumbEl = document.getElementById('header-breadcrumb');
    const pageTitleEl = document.getElementById('current-page-title');
    const backBtnEl = document.getElementById('header-back-btn');

    const pageTitles = {
      dashboard: 'DASHBOARD OVERVIEW',
      schools: 'SCHOOLS MANAGEMENT',
      vehicles: 'VEHICLE FLEET MANAGEMENT',
      drivers: 'DRIVER & STAFF DIRECTORY',
      routes: 'TRANSPORT ROUTES & STOPS',
      trips: 'TRIP SCHEDULING & DISPATCH',
      income: 'FINANCIAL INCOME & COLLECTIONS',
      expenses: 'OPERATIONAL EXPENSE TRACKING',
      renewals: 'VEHICLE COMPLIANCE & RENEWALS',
      reports: 'ANALYTICS & EXECUTIVE REPORTS',
      settings: 'SYSTEM PREFERENCES & PROFILE'
    };

    const breadcrumbNames = {
      dashboard: 'Dashboard',
      schools: 'Schools',
      vehicles: 'Vehicles',
      drivers: 'Drivers',
      routes: 'Routes',
      trips: 'Trips',
      income: 'Income',
      expenses: 'Expenses',
      renewals: 'Renewals',
      reports: 'Reports',
      settings: 'Settings'
    };

    let titleText = pageTitles[pageId] || pageId.toUpperCase();
    let breadcrumbHTML = `<span class="breadcrumb-item" onclick="app.navigateTo('dashboard')" style="cursor: pointer; color: #64748b;">Dashboard</span>`;
    let showBackBtn = true;

    if (pageId === 'dashboard') {
      const selectedSchoolId = window.selectedDashboardSchoolId;
      if (selectedSchoolId && selectedSchoolId !== 'all') {
        const schoolObj = window.db.getSchools().find(s => s.id === Number(selectedSchoolId));
        const sName = schoolObj ? schoolObj.name.toUpperCase() : 'SCHOOL DASHBOARD';
        titleText = sName;
        breadcrumbHTML += `
          <i class="fa-solid fa-chevron-right" style="font-size: 10px; color: #94a3b8;"></i>
          <span style="color: #1e293b; font-weight: 600;">${escapeHTML(sName)}</span>
        `;
        showBackBtn = true;
      } else {
        showBackBtn = false;
      }
    } else {
      const label = breadcrumbNames[pageId] || pageId;
      breadcrumbHTML += `
        <i class="fa-solid fa-chevron-right" style="font-size: 10px; color: #94a3b8;"></i>
        <span style="color: #1e293b; font-weight: 600;">${escapeHTML(label)}</span>
      `;
      showBackBtn = true;
    }

    if (pageTitleEl) pageTitleEl.innerText = titleText;
    if (breadcrumbEl) breadcrumbEl.innerHTML = breadcrumbHTML;
    if (backBtnEl) backBtnEl.style.display = showBackBtn ? 'inline-flex' : 'none';
  }

  goBack() {
    if (this.currentPage === 'dashboard' && window.selectedDashboardSchoolId && window.selectedDashboardSchoolId !== 'all') {
      window.selectDashboardSchool('all');
      return;
    }

    if (this.historyStack.length > 1) {
      this.historyStack.pop();
      const prev = this.historyStack.pop();
      if (prev && prev.page) {
        this.navigateTo(prev.page, true);
        return;
      }
    }

    if (window.selectedDashboardSchoolId !== 'all') {
      window.selectDashboardSchool('all');
    } else {
      this.navigateTo('dashboard');
    }
  }

  setupRoleNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const pageId = item.dataset.page;
      if (pageId) {
        const allowed = window.auth.hasPermission(pageId);
        item.style.display = allowed ? 'flex' : 'none';
      }
    });

    // Hide/show System menu category header based on settings permission
    const settingsAllowed = window.auth.hasPermission('settings');
    const systemCategory = document.getElementById('menu-category-system');
    if (systemCategory) {
      systemCategory.style.display = settingsAllowed ? 'block' : 'none';
    }
  }

  renderSettingsPage() {
    const user = window.auth.getCurrentUser() || { name: '', role: '', schoolName: '' };
    const container = document.getElementById('settings-view');
    if (!container) return;

    const isSuperAdmin = user.role === 'Super Admin';
    const rolePerms = window.auth.getRolePermissions();
    const adminPerms = rolePerms["Admin"] || [];
    const schoolPerms = rolePerms["School"] || [];

    const modules = [
      { id: 'dashboard', name: 'Dashboard Overview', icon: 'fa-chart-pie' },
      { id: 'schools', name: 'Schools Management', icon: 'fa-school' },
      { id: 'vehicles', name: 'Vehicle Fleet Management', icon: 'fa-bus' },
      { id: 'drivers', name: 'Driver & Staff Directory', icon: 'fa-id-card' },
      { id: 'routes', name: 'Transport Routes & Stops', icon: 'fa-route' },
      { id: 'trips', name: 'Trip Scheduling & Dispatch', icon: 'fa-clock-rotate-left' },
      { id: 'income', name: 'Financial Income & Collections', icon: 'fa-wallet' },
      { id: 'expenses', name: 'Operational Expense Tracking', icon: 'fa-receipt' },
      { id: 'renewals', name: 'Vehicle Compliance & Renewals', icon: 'fa-bell' },
      { id: 'reports', name: 'Analytics & Executive Reports', icon: 'fa-file-contract' },
      { id: 'settings', name: 'System Preferences & Settings', icon: 'fa-gear' }
    ];

    container.innerHTML = `
      <div style="max-width: 800px;">
        
        ${isSuperAdmin ? `
          <!-- Super Admin Role Privileges Matrix Card -->
          <div class="card" style="padding: 28px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-user-shield" style="color: var(--color-income);"></i> Role Access Permissions & Privileges
                </h3>
                <p style="font-size: 13px; color: var(--color-text-secondary);">Control module access permissions for Admin and School panel roles.</p>
              </div>
              <button type="button" class="btn-sm btn-secondary" onclick="app.resetRolePermissionsToDefault()">
                <i class="fa-solid fa-rotate-left"></i> Reset Defaults
              </button>
            </div>

            <form id="role-permissions-form" onsubmit="app.saveRolePermissions(event)">
              <div class="table-container" style="border: 1px solid var(--color-border); border-radius: 12px; margin-bottom: 18px;">
                <table class="custom-table" style="font-size: 13px;">
                  <thead>
                    <tr>
                      <th>Module / Feature Section</th>
                      <th style="text-align: center; width: 140px;">Admin Panel</th>
                      <th style="text-align: center; width: 140px;">School Panel</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${modules.map(m => `
                      <tr>
                        <td>
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid ${m.icon}" style="color: var(--color-income); width: 18px; text-align: center;"></i>
                            <strong>${escapeHTML(m.name)}</strong>
                          </div>
                        </td>
                        <td style="text-align: center;">
                          <input type="checkbox" name="perm_admin" value="${m.id}" ${adminPerms.includes(m.id) ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-income);">
                        </td>
                        <td style="text-align: center;">
                          <input type="checkbox" name="perm_school" value="${m.id}" ${schoolPerms.includes(m.id) ? 'checked' : ''} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-income);">
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <span style="font-size: 12px; color: var(--color-text-secondary);">
                  <i class="fa-solid fa-lock" style="margin-right: 4px;"></i> Super Admin role always retains full access to all panels.
                </span>
                <button type="submit" class="btn-primary" style="width: auto;">
                  <i class="fa-solid fa-floppy-disk"></i> Save Access Privileges
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        <div class="card" style="padding: 28px; margin-bottom: 24px;">
          <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 16px;">User Profile Settings</h3>
          <form onsubmit="app.saveProfile(event)">
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="setting-user-name" class="form-control" value="${escapeHTML(user.name || '')}">
            </div>
            <div class="form-group">
              <label>Role</label>
              <input type="text" class="form-control" value="${escapeHTML(user.role || '')}" disabled>
            </div>
            <div class="form-group">
              <label>Assigned School Scope</label>
              <input type="text" class="form-control" value="${escapeHTML(user.schoolName || '')}" disabled>
            </div>
            <button type="submit" class="btn-primary" style="width: auto;">Save Profile Changes</button>
          </form>
        </div>

        <div class="card" style="padding: 28px; border-color: #fecaca;">
          <h3 style="font-size: 17px; font-weight: 700; color: var(--color-expense); margin-bottom: 8px;">System Data Management</h3>
          <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px;">Reset prototype demo datasets back to factory seed records.</p>
          <button class="btn-danger" style="padding: 10px 18px; border-radius: 8px;" onclick="app.resetSystemData()">Reset All Demo Data</button>
        </div>
      </div>
    `;
  }

  saveRolePermissions(event) {
    event.preventDefault();
    const adminCheckboxes = document.querySelectorAll('input[name="perm_admin"]:checked');
    const schoolCheckboxes = document.querySelectorAll('input[name="perm_school"]:checked');

    const adminPerms = Array.from(adminCheckboxes).map(cb => cb.value);
    const schoolPerms = Array.from(schoolCheckboxes).map(cb => cb.value);

    window.auth.saveRolePermissions({
      "Admin": adminPerms,
      "School": schoolPerms
    });

    this.setupRoleNavigation();
    showToast('Role access privileges updated successfully!', 'success');
  }

  resetRolePermissionsToDefault() {
    if (confirm('Reset Admin & School role permissions back to factory defaults?')) {
      window.auth.resetRolePermissions();
      this.setupRoleNavigation();
      this.renderSettingsPage();
      showToast('Role permissions reset to default values', 'info');
    }
  }

  saveProfile(event) {
    event.preventDefault();
    const newName = document.getElementById('setting-user-name').value.trim();
    if (!newName) return;

    const user = window.auth.getCurrentUser();
    if (user) {
      user.name = newName;
      localStorage.setItem(window.AUTH_SESSION_KEY, JSON.stringify(user));
      this.updateHeaderUserInfo();
      showToast('Profile updated successfully', 'success');
    }
  }

  resetSystemData() {
    if (confirm('Revert all demo data back to factory defaults? All custom entries will be lost.')) {
      window.db.resetData();
      showToast('System data reset to factory seed values', 'success');
      this.navigateTo(this.currentPage);
    }
  }

  bindEvents() {
    // Navigation clicks
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('[data-page]');
      if (navItem) {
        e.preventDefault();
        const page = navItem.dataset.page;
        this.navigateTo(page);
      }

      // Notification toggle
      const notifBtn = e.target.closest('#notif-bell-btn');
      const notifDropdown = document.getElementById('notif-dropdown');
      if (notifBtn && notifDropdown) {
        notifDropdown.classList.toggle('active');
      } else if (!e.target.closest('#notif-dropdown')) {
        notifDropdown?.classList.remove('active');
      }

      // User profile dropdown toggle
      const profileMenu = e.target.closest('#user-profile-menu');
      const profileDropdown = document.getElementById('profile-dropdown');
      if (profileMenu && profileDropdown) {
        profileDropdown.classList.toggle('active');
      } else if (!e.target.closest('#profile-dropdown')) {
        profileDropdown?.classList.remove('active');
      }
    });

    // Mobile menu toggle
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('active');
    });

    // Login Form Submit
    document.getElementById('login-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('login-username').value;
      const password = document.getElementById('login-password').value;
      const role = document.getElementById('login-role').value;

      const res = window.auth.login(username, password, role);
      if (res.success) {
        this.resetSessionState();
        showToast(`Welcome back, ${res.user.name}`, 'success');
        this.checkSessionAndRoute();
      } else {
        showToast(res.message, 'error');
      }
    });

    // Forgot password link & submit
    document.getElementById('forgot-password-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      openModal('forgot-password-modal');
    });

    document.getElementById('forgot-password-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const mobile = document.getElementById('reset-mobile').value;
      const otp = document.getElementById('reset-otp').value;
      const pass = document.getElementById('reset-pass').value;

      const res = window.auth.demoResetPassword(mobile, otp, pass);
      if (res.success) {
        showToast(res.message, 'success');
        closeModal('forgot-password-modal');
      } else {
        showToast(res.message, 'error');
      }
    });
  }

  logout() {
    window.auth.logout();
    this.resetSessionState();
    showToast('Logged out successfully', 'info');
    this.checkSessionAndRoute();
  }
}

window.AppController = AppController;

// Global Demo Pill Fill Helper
function fillDemoCredentials(username, password, role) {
  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  const rSelect = document.getElementById('login-role');

  if (uInput) uInput.value = username;
  if (pInput) pInput.value = password;
  if (rSelect) rSelect.value = role;
  showToast(`Autofilled demo credentials for ${role}`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
