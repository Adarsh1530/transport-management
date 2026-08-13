/* ==========================================
   MAIN APPLICATION ROUTER & INTERACTION CONTROLLER
   ========================================== */

class AppController {
  constructor() {
    this.currentPage = 'dashboard';
    this.historyStack = [];
    this.isNotifsCleared = false;
    this.isNotifsUnread = true;
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
      if (authView) {
        authView.style.display = 'none';
        authView.classList.remove('active');
      }
      if (appLayout) {
        appLayout.style.display = 'flex';
      }

      try {
        this.setupRoleNavigation();
        this.updateHeaderUserInfo();
        this.updateNotifications();
        this.navigateTo(this.currentPage || 'dashboard');
      } catch (err) {
        console.error('Error during dashboard routing:', err);
        if (appLayout) appLayout.style.display = 'flex';
        if (authView) authView.style.display = 'none';
      }
    } else {
      if (authView) {
        authView.style.display = 'flex';
      }
      if (appLayout) {
        appLayout.style.display = 'none';
      }
    }
  }

  resetSessionState() {
    this.currentPage = 'dashboard';
    this.historyStack = [];
    window.selectedDashboardSchoolId = 'all';
    this.isNotifsCleared = false;
    this.isNotifsUnread = true;
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
    const toggleBtn = document.getElementById('notif-read-toggle-btn');

    if (toggleBtn) {
      toggleBtn.innerText = this.isNotifsUnread ? 'Mark as Read' : 'Mark as Unread';
    }

    if (badge) {
      if (!this.isNotifsCleared && this.isNotifsUnread && urgentRenewals.length > 0) {
        badge.style.display = 'flex';
        badge.innerText = urgentRenewals.length;
      } else {
        badge.style.display = 'none';
      }
    }

    if (dropdownList) {
      if (this.isNotifsCleared || urgentRenewals.length === 0) {
        dropdownList.innerHTML = `<div class="empty-state" style="padding: 20px; text-align: center; color: var(--color-text-secondary); font-size: 13px;">No renewal alerts available.</div>`;
      } else {
        const vehicles = window.db.getVehicles();
        dropdownList.innerHTML = urgentRenewals.map(r => {
          const v = vehicles.find(veh => veh.id === r.vehicleId);
          const st = getRenewalStatus(r.renewalDate);
          return `
            <div class="dropdown-item" onclick="app.openRenewalFromNotification(${r.id})" style="cursor: pointer; transition: background 0.15s ease;" title="Click to edit ${escapeHTML(r.type)} renewal date">
              <i class="fa-solid fa-triangle-exclamation" style="color: var(--color-expense); margin-top: 2px;"></i>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <strong style="color: var(--color-dark); font-size: 13px;">${v ? escapeHTML(v.busNo) : 'Vehicle'} — ${escapeHTML(r.type)}</strong>
                  <i class="fa-solid fa-pen-to-square" style="font-size: 11px; color: var(--color-income); opacity: 0.8;" title="Edit Renewal Date"></i>
                </div>
                <div style="font-size: 12px; color: var(--color-text-secondary); margin-top: 2px;">${st.text} (${formatDate(r.renewalDate)})</div>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  }

  openRenewalFromNotification(renewalId) {
    const notifDropdown = document.getElementById('notif-dropdown');
    if (notifDropdown) notifDropdown.classList.remove('active');

    this.navigateTo('renewals');

    setTimeout(() => {
      if (typeof window.openEditRenewalModal === 'function') {
        window.openEditRenewalModal(renewalId);
      }
    }, 120);
  }

  clearAllNotifications() {
    this.isNotifsCleared = true;
    this.updateNotifications();
    showToast('Renewal notifications cleared', 'info');
  }

  toggleNotificationsReadState() {
    if (this.isNotifsCleared) {
      this.isNotifsCleared = false;
    }
    this.isNotifsUnread = !this.isNotifsUnread;
    this.updateNotifications();
    showToast(this.isNotifsUnread ? 'Notifications marked as unread' : 'Notifications marked as read', 'info');
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
      case 'attendants':
        if (typeof renderAttendantsPage === 'function') renderAttendantsPage();
        break;
      case 'routes':
        if (typeof renderRoutesPage === 'function') renderRoutesPage();
        break;
      case 'school-entry':
        if (typeof renderSchoolEntryPage === 'function') renderSchoolEntryPage();
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
      vehicles: 'VEHICLE MANAGEMENT',
      drivers: 'DRIVER DIRECTORY',
      attendants: 'ATTENDANT DIRECTORY',
      routes: 'TRANSPORT ROUTES',
      'school-entry': 'SCHOOL ENTRY & OPERATIONS',
      income: 'FINANCIAL INCOME',
      expenses: 'OPERATIONAL EXPENSES',
      renewals: 'VEHICLE COMPLIANCE & RENEWALS',
      reports: 'ANALYTICS & EXECUTIVE REPORTS',
      settings: 'SYSTEM PREFERENCES & SETTINGS'
    };

    const breadcrumbNames = {
      dashboard: 'Dashboard',
      schools: 'Schools',
      vehicles: 'Vehicles',
      drivers: 'Drivers',
      attendants: 'Attendants',
      routes: 'Routes',
      'school-entry': 'School Entry',
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

    const schoolEntryAllowed = window.auth.hasPermission('school-entry');
    const schoolEntryCategory = document.getElementById('menu-category-school-entry');
    if (schoolEntryCategory) {
      schoolEntryCategory.style.display = schoolEntryAllowed ? 'block' : 'none';
    }

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

    const categories = window.db.getCategories();
    const rtos = window.db.getRtos();

    const canCategories = isSuperAdmin || window.auth.hasPermission('settings_categories');
    const canExpenseVis = isSuperAdmin || window.auth.hasPermission('settings_expense_visibility');
    const canRto = isSuperAdmin || window.auth.hasPermission('settings_rto');
    const canRolePerms = isSuperAdmin || window.auth.hasPermission('settings_role_permissions');
    const canUserProfile = isSuperAdmin || window.auth.hasPermission('settings_user_profile');
    const canCreateUser = isSuperAdmin || window.auth.hasPermission('settings_create_user');
    const canReportBuilder = isSuperAdmin || window.auth.hasPermission('settings_report_builder');
    const canResetData = isSuperAdmin || window.auth.hasPermission('settings_reset_data');

    const modules = [
      { id: 'dashboard', name: 'Dashboard Overview', icon: 'fa-chart-pie' },
      { id: 'schools', name: 'Schools Management', icon: 'fa-school' },
      { id: 'vehicles', name: 'Vehicle Management', icon: 'fa-bus' },
      { id: 'drivers', name: 'Driver & Staff Directory', icon: 'fa-id-card' },
      { id: 'attendants', name: 'Attendant Directory', icon: 'fa-users' },
      { id: 'routes', name: 'Transport Routes & Stops', icon: 'fa-route' },
      { id: 'school-entry', name: 'School Entry & Operational Data', icon: 'fa-pen-to-square' },
      { id: 'school_entry_sec1', name: '1. KM / Trip Operational & Mileage Details', icon: 'fa-gauge-high', isSub: true },
      { id: 'school_entry_sec2', name: '2. Expense Section (Part A)', icon: 'fa-receipt', isSub: true },
      { id: 'school_entry_sec3', name: '3. Income / Collection Section', icon: 'fa-wallet', isSub: true },
      { id: 'school_entry_sec4', name: '4. Part B – Admin Panel', icon: 'fa-user-shield', isSub: true },
      { id: 'income', name: 'Financial Income & Collections', icon: 'fa-wallet' },
      { id: 'expenses', name: 'Operational Expense Tracking', icon: 'fa-receipt' },
      { id: 'renewals', name: 'Vehicle Compliance & Renewals', icon: 'fa-bell' },
      { id: 'reports', name: 'Analytics & Executive Reports', icon: 'fa-file-contract' },
      { id: 'settings', name: 'System Preferences & Settings (All Features)', icon: 'fa-gear' },
      { id: 'settings_report_builder', name: 'School Bus Statement Custom Report Builder', icon: 'fa-sliders', isSub: true },
      { id: 'settings_categories', name: 'Category Creation Module', icon: 'fa-tags', isSub: true },
      { id: 'settings_rto', name: 'RTO CODE LIST (Official Master Reference)', icon: 'fa-id-card-clip', isSub: true },
      { id: 'settings_user_profile', name: 'User Profile Settings', icon: 'fa-user-gear', isSub: true },
      { id: 'settings_create_user', name: 'Create New User Manually', icon: 'fa-user-plus', isSub: true },
      { id: 'settings_role_permissions', name: 'Role Access Permissions & Privileges', icon: 'fa-user-shield', isSub: true },
      { id: 'settings_reset_data', name: 'System Data Reset Management', icon: 'fa-triangle-exclamation', isSub: true }
    ];

    const citiesList = [
      "Thiruvananthapuram", "Kollam", "Pathanamthitta", "Alappuzha", "Kottayam", "Idukki", 
      "Ernakulam", "Thrissur", "Palakkad", "Malappuram", "Kozhikode", "Wayanad", "Kannur", "Kasaragod"
    ];

    const allUsers = window.auth.getUsers();
    const schools = window.db.getSchools();

    const canManageProfiles = isSuperAdmin || user.role === 'Admin';
    const manageableUsers = isSuperAdmin 
      ? allUsers 
      : allUsers.filter(u => u.username === user.username || u.role === 'School');

    container.innerHTML = `
      <div style="max-width: 1200px;">
        
             ${canCategories ? (() => {
          const allYears = window.db.getFinancialYears();
          const activeYearObj = allYears.find(y => y.status === 'Active') || allYears[allYears.length - 1] || { year: '2026-2027', status: 'Active' };
          const selYear = window._selectedFY || activeYearObj.year;
          const currentFYObj = allYears.find(y => y.year === selYear) || { year: selYear, status: 'Inactive' };

          return `
          <!-- Active Year Management Section (Top of Category Creation) -->
          <div class="card" style="padding: 24px; margin-bottom: 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
              <div>
                <h3 style="font-size: 17px; font-weight: 800; color: #ffffff; margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-calendar-check" style="color: #38bdf8;"></i> Active Financial Year
                </h3>
                <p style="font-size: 13px; color: #94a3b8; margin: 0;">
                  Set the current active operational year for transport reports, statement audits, and financial calculations.
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
                <select id="active-year-selector" class="form-control" style="width: auto; min-width: 160px; font-weight: 700; background: #ffffff; color: #0f172a; border-radius: 8px; font-size: 14px;" onchange="changeSelectedYear(this.value)">
                  ${allYears.map(fy => '<option value="' + fy.year + '" ' + (fy.year === selYear ? 'selected' : '') + '>' + fy.year + '</option>').join('')}
                </select>

                <!-- Right Side Checkbox for Active / Inactive -->
                <label style="display: inline-flex; align-items: center; gap: 8px; background: rgba(255, 255, 255, 0.12); padding: 7px 14px; border-radius: 8px; cursor: pointer; color: #ffffff; font-size: 13.5px; font-weight: 600; border: 1px solid rgba(255, 255, 255, 0.2);">
                  <input type="checkbox" id="fy-active-toggle-check" ${currentFYObj.status === 'Active' ? 'checked' : ''} onchange="toggleActiveYearStatus(this.checked)" style="width: 17px; height: 17px; accent-color: #38bdf8; cursor: pointer;">
                  <span>Active</span>
                  ${currentFYObj.status === 'Active' ? '<span style="background: #22c55e; color: #ffffff; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 800; margin-left: 2px;">ACTIVE</span>' : '<span style="background: #64748b; color: #ffffff; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 800; margin-left: 2px;">INACTIVE</span>'}
                </label>

                <button type="button" class="btn-primary" style="width: auto; background: #0284c7; padding: 8px 18px; border-radius: 8px; font-weight: 700;" onclick="openAddFinancialYearModal()">
                  <i class="fa-solid fa-plus"></i> Add Year
                </button>
              </div>
            </div>
          </div>

          <!-- Category Creation Module Card -->
          <div class="card" style="padding: 28px; margin-bottom: 24px;">
            <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-tags" style="color: var(--color-income);"></i> Category Creation
            </h3>
            <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px;">Define mandatory Income and Expense categories for financial accounting.</p>

            <form id="category-creation-form" onsubmit="saveCategoryFromSettings(event)" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--color-border); margin-bottom: 20px;">
              <input type="hidden" id="setting-cat-id" value="">
              <div style="display: grid; grid-template-columns: 1fr 160px 220px; gap: 14px; margin-bottom: 14px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="display: flex; justify-content: space-between;">
                    <span>Category Name *</span>
                    <span id="cat-dup-warning" style="display: none; color: var(--color-expense); font-size: 12px; font-weight: 600;">Category already exists.</span>
                  </label>
                  <input type="text" id="setting-cat-name" class="form-control" required placeholder="Enter category name (e.g. Fuel, Annual Fee)" oninput="checkCategoryDuplicate(this.value)">
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label>Choose Type *</label>
                  <select id="setting-cat-type" class="form-control" required>
                    <option value="">Please select</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label>USER Privilege *</label>
                  <select id="setting-cat-privilege" class="form-control" required>
                    <option value="All" selected>Default (All)</option>
                    <option value="Admin">Admin - Part B</option>
                    <option value="School">School - Part A</option>
                    <option value="Super Admin">Super Admin Only</option>
                  </select>
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 16px;">
                <label>Description (Optional)</label>
                <input type="text" id="setting-cat-desc" class="form-control" placeholder="Brief description of this financial category">
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="btn-secondary" onclick="document.getElementById('category-creation-form').reset(); document.getElementById('setting-cat-id').value=''; document.getElementById('save-cat-btn').innerHTML='<i class=\'fa-solid fa-floppy-disk\'></i> Save Category'; checkCategoryDuplicate('');">Cancel</button>
                <button type="submit" id="save-cat-btn" class="btn-primary" style="width: auto;"><i class="fa-solid fa-floppy-disk"></i> Save Category</button>
              </div>
            </form>

            <!-- Master Categories List -->
            <div class="table-container" style="border: 1px solid var(--color-border); border-radius: 12px;">
              <table class="custom-table" style="font-size: 13px;">
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Type</th>
                    <th>User Privilege</th>
                    <th>Description</th>
                    <th style="width: 90px; text-align: center;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${categories.map(c => {
                    const privLabel = c.privilege === 'School' ? 'School - Part A' : (c.privilege === 'Admin' ? 'Admin - Part B' : (c.privilege || 'All'));
                    return '<tr><td><strong>' + escapeHTML(c.name) + '</strong></td><td><span class="badge ' + (c.type === 'INCOME' ? 'badge-paid' : 'badge-due') + '">' + c.type + '</span></td><td><span class="badge badge-neutral" style="font-size: 11px;"><i class="fa-solid fa-user-shield" style="margin-right: 4px;"></i> ' + escapeHTML(privLabel) + '</span></td><td>' + escapeHTML(c.description || 'N/A') + '</td><td style="text-align: center;"><div class="action-buttons" style="justify-content: center;"><button type="button" class="icon-btn" title="Edit Category" onclick="editCategoryFromSettings(' + c.id + ')"><i class="fa-solid fa-pen-to-square"></i></button><button type="button" class="icon-btn delete" title="Delete Category" onclick="deleteCategoryFromSettings(' + c.id + ')"><i class="fa-solid fa-trash-can"></i></button></div></td></tr>';
                  }).join('')}
                </tbody>
              </table>
            </div>
          </div>
          `;
        })() : ''}

        ${canRto ? `
          <!-- Settings — RTO CODE LIST Card (View Only Master Reference) -->
          <div class="card" style="padding: 28px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
              <div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin: 0 0 4px 0; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-id-card-clip" style="color: var(--color-income);"></i> RTO CODE LIST
                </h3>
                <p style="font-size: 13px; color: var(--color-text-secondary); margin: 0;">
                  Official view-only master list of Regional Transport Office (RTO) locations and registration codes across Kerala.
                </p>
              </div>

              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="position: relative;">
                  <input type="text" id="rto-search-filter" class="form-control" placeholder="Search RTO Office or Code..." oninput="filterRtoCodeList(this.value)" style="padding-left: 32px; font-size: 13px; width: 280px;">
                  <i class="fa-solid fa-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 13px;"></i>
                </div>
              </div>
            </div>

            <!-- Master RTO Table -->
            <div class="table-container" style="border: 1px solid var(--color-border); border-radius: 12px; max-height: 420px; overflow-y: auto;">
              <table class="custom-table" style="font-size: 13px;">
                <thead style="position: sticky; top: 0; background: #f8fafc; z-index: 2; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                  <tr>
                    <th style="width: 70px; text-align: center;">SL No</th>
                    <th>RTO Office Location</th>
                    <th>District / Region</th>
                    <th>Registration Code(s)</th>
                  </tr>
                </thead>
                <tbody id="rto-code-list-tbody">
                  ${rtos.map((r, idx) => `
                    <tr>
                      <td style="text-align: center; color: var(--color-text-secondary); font-weight: 600;">${idx + 1}</td>
                      <td><strong>${escapeHTML(r.office)}</strong></td>
                      <td>${escapeHTML(r.city)}</td>
                      <td><code style="background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-weight: 700; border: 1px solid #bfdbfe;">${escapeHTML(r.code)}</code></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        ${canRolePerms ? `
          <!-- Super Admin Role Privileges Matrix Card -->
          <div class="card" style="padding: 28px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  <i class="fa-solid fa-user-shield" style="color: var(--color-income);"></i> Privilege Settings — Feature Access Control
                </h3>
                <p style="font-size: 13px; color: var(--color-text-secondary);">Super Admin can enable or disable every module and sub-section for Admin and School users. Unchecked privileges take effect after saving.</p>
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
                      <th style="text-align: center; width: 160px;">Admin - Part B</th>
                      <th style="text-align: center; width: 160px;">School - Part A</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${modules.map(m => `
                      <tr style="${m.isSub ? 'background: #f8fafc;' : ''}">
                        <td style="${m.isSub ? 'padding-left: 32px;' : ''}">
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid ${m.icon}" style="color: ${m.isSub ? '#64748b' : 'var(--color-income)'}; width: 18px; text-align: center;"></i>
                            <span style="${m.isSub ? 'font-size: 12.5px; color: #334155; font-weight: 500;' : 'font-weight: 700;'}">${m.isSub ? '└─ ' : ''}${escapeHTML(m.name)}</span>
                          </div>
                        </td>
                        <td style="text-align: center;">
                          <input type="checkbox" name="perm_admin" value="${m.id}" ${adminPerms.includes(m.id) ? 'checked' : ''} ${m.id === 'settings' ? 'onchange="app.toggleSettingsSubPerms(\'admin\', this.checked)"' : (m.id === 'school-entry' ? 'onchange="app.toggleSchoolEntrySubPerms(\'admin\', this.checked)"' : '')} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-income);">
                        </td>
                        <td style="text-align: center;">
                          <input type="checkbox" name="perm_school" value="${m.id}" ${schoolPerms.includes(m.id) ? 'checked' : ''} ${m.id === 'settings' ? 'onchange="app.toggleSettingsSubPerms(\'school\', this.checked)"' : (m.id === 'school-entry' ? 'onchange="app.toggleSchoolEntrySubPerms(\'school\', this.checked)"' : '')} style="width: 16px; height: 16px; cursor: pointer; accent-color: var(--color-income);">
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

        ${canUserProfile ? `
          <!-- User Profile Settings Card -->
          <div class="card" style="padding: 28px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 0;">User Profile Settings</h3>
            </div>
            <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px;">
              ${canManageProfiles 
                ? 'Select any user account below to manage its profile name, system role, or assigned school scope.' 
                : 'Update your personal profile details below.'}
            </p>

            <form id="user-profile-form" onsubmit="app.saveProfile(event)">
              ${canManageProfiles ? `
                <div class="form-group" style="margin-bottom: 16px;">
                  <label style="font-weight: 600;">Select User Account *</label>
                  <select id="setting-user-select" class="form-control" onchange="app.onSelectProfileUserChange(this.value)">
                    ${manageableUsers.map(u => `<option value="${escapeHTML(u.username)}" ${u.username === user.username ? 'selected' : ''}>${escapeHTML(u.name)} (${escapeHTML(u.role)}${u.schoolName && u.schoolName !== 'All Schools' ? ' - ' + escapeHTML(u.schoolName) : ''})</option>`).join('')}
                  </select>
                </div>
              ` : `<input type="hidden" id="setting-user-select" value="${escapeHTML(user.username)}">`}

              ${canManageProfiles ? `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-weight: 600;">Full Name *</label>
                    <input type="text" id="setting-user-name" class="form-control" required value="${escapeHTML(user.name || '')}">
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-weight: 600;">Username *</label>
                    <input type="text" id="setting-user-username" class="form-control" required value="${escapeHTML(user.username || '')}">
                  </div>
                </div>
              ` : `
                <div class="form-group">
                  <label style="font-weight: 600;">Full Name *</label>
                  <input type="text" id="setting-user-name" class="form-control" required value="${escapeHTML(user.name || '')}">
                </div>
              `}

              ${canManageProfiles ? `
                <div class="form-group">
                  <label style="font-weight: 600;">Account Password *</label>
                  <input type="text" id="setting-user-password" class="form-control" required placeholder="Set account password">
                </div>
                <div class="form-group">
                  <label style="font-weight: 600;">Role *</label>
                  <select id="setting-user-role" class="form-control" onchange="app.onProfileRoleChange(this.value)">
                    ${isSuperAdmin ? `<option value="Super Admin" ${user.role === 'Super Admin' ? 'selected' : ''}>Super Admin</option>` : ''}
                    <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin - Part B</option>
                    <option value="School" ${user.role === 'School' ? 'selected' : ''}>School - Part A</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-weight: 600;">Assigned School Scope *</label>
                  <select id="setting-user-school" class="form-control">
                    <option value="all" ${!user.schoolId ? 'selected' : ''}>All Schools (Super Admin / Admin Scope)</option>
                    ${schools.map(s => `<option value="${s.id}" ${user.schoolId === s.id ? 'selected' : ''}>${escapeHTML(s.name)}${s.location ? ' (' + escapeHTML(s.location) + ')' : ''}</option>`).join('')}
                  </select>
                </div>
              ` : `
                <div class="form-group">
                  <label>Role</label>
                  <input type="text" class="form-control" value="${escapeHTML(user.role || '')}" disabled>
                </div>
                <div class="form-group">
                  <label>Assigned School Scope</label>
                  <input type="text" class="form-control" value="${escapeHTML(user.schoolName || '')}" disabled>
                </div>
              `}

              <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; flex-wrap: wrap; gap: 10px;">
                <button type="submit" class="btn-primary" style="width: auto;"><i class="fa-solid fa-floppy-disk"></i> Save Profile Changes</button>
                ${canManageProfiles ? `
                  <button type="button" id="delete-user-btn" class="btn-danger" style="width: auto; opacity: 0.5; cursor: not-allowed;" disabled onclick="app.deleteSelectedUserProfile()">
                    <i class="fa-solid fa-trash-can"></i> Delete User Profile
                  </button>
                ` : ''}
              </div>
            </form>
          </div>
        ` : ''}

        ${canCreateUser ? `
          <!-- Create New User Account Card -->
          <div class="card" style="padding: 28px; margin-bottom: 24px; border: 1px solid var(--color-border); background: #fdfdfe;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
              <h3 style="font-size: 17px; font-weight: 700; color: var(--color-dark); margin-bottom: 0; display: flex; align-items: center; gap: 8px;">
                <i class="fa-solid fa-user-plus" style="color: var(--color-income);"></i> Create New User
              </h3>
            </div>
            <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 20px;">Provision new login credentials manually for any registered school or system role.</p>

            <form id="create-user-form" onsubmit="app.createNewUserFromSettings(event)" style="background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid var(--color-border);">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-weight: 600;">Full Name *</label>
                  <input type="text" id="new-user-fullname" class="form-control" required placeholder="e.g. National Public School Admin">
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-weight: 600;">Username *</label>
                  <input type="text" id="new-user-username" class="form-control" required placeholder="e.g. school3" oninput="app.checkNewUsernameDuplicate(this.value)">
                  <small id="new-user-dup-warn" style="display: none; color: var(--color-expense); font-size: 12px; font-weight: 600; margin-top: 4px;">Username already taken.</small>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 16px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-weight: 600;">Password *</label>
                  <input type="text" id="new-user-password" class="form-control" required placeholder="Set password">
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-weight: 600;">Role *</label>
                  <select id="new-user-role" class="form-control" onchange="app.onNewUserRoleChange(this.value)">
                    <option value="School" selected>School - Part A</option>
                    <option value="Admin">Admin - Part B</option>
                    ${isSuperAdmin ? `<option value="Super Admin">Super Admin</option>` : ''}
                  </select>
                </div>

                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-weight: 600;">Assigned School Scope *</label>
                  <select id="new-user-school" class="form-control">
                    ${schools.map(s => `<option value="${s.id}">${escapeHTML(s.name)}${s.location ? ' (' + escapeHTML(s.location) + ')' : ''}</option>`).join('')}
                    <option value="all" id="new-user-school-all-opt" style="display: none;">All Schools (Super Admin / Admin Scope)</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" class="btn-secondary" onclick="document.getElementById('create-user-form').reset();">Reset</button>
                <button type="submit" id="create-user-submit-btn" class="btn-primary" style="width: auto;">
                  <i class="fa-solid fa-user-plus"></i> Create User Account
                </button>
              </div>
            </form>
          </div>
        ` : ''}

        ${canReportBuilder ? `
          <!-- Custom Report Builder Container -->
          <div id="report-builder-container"></div>
        ` : ''}

        ${canResetData ? `
          <div class="card" style="padding: 28px; border-color: #fecaca;">
            <h3 style="font-size: 17px; font-weight: 700; color: var(--color-expense); margin-bottom: 8px;">System Data Management</h3>
            <p style="font-size: 13px; color: var(--color-text-secondary); margin-bottom: 16px;">Reset prototype demo datasets back to factory seed records.</p>
            <button class="btn-danger" style="padding: 10px 18px; border-radius: 8px;" onclick="app.resetSystemData()">Reset All Demo Data</button>
          </div>
        ` : ''}
      </div>
    `;

    if (canReportBuilder && typeof renderReportBuilderView === 'function') {
      renderReportBuilderView();
    }
  }

  checkNewUsernameDuplicate(username) {
    const val = (username || '').trim().toLowerCase();
    const warn = document.getElementById('new-user-dup-warn');
    const submitBtn = document.getElementById('create-user-submit-btn');
    if (!val) {
      if (warn) warn.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    const users = window.auth.getUsers();
    const exists = users.some(u => u.username.toLowerCase() === val);
    if (warn) warn.style.display = exists ? 'block' : 'none';
    if (submitBtn) submitBtn.disabled = exists;
  }

  onNewUserRoleChange(role) {
    const schoolSelect = document.getElementById('new-user-school');
    if (!schoolSelect) return;
    const allOpt = document.getElementById('new-user-school-all-opt');

    if (role === 'Super Admin' || role === 'Admin') {
      if (allOpt) allOpt.style.display = 'block';
      schoolSelect.value = 'all';
    } else {
      if (allOpt) allOpt.style.display = 'none';
      if (schoolSelect.value === 'all') {
        const schools = window.db.getSchools();
        if (schools.length > 0) schoolSelect.value = String(schools[0].id);
      }
    }
  }

  createNewUserFromSettings(event) {
    event.preventDefault();
    const name = document.getElementById('new-user-fullname').value.trim();
    const username = document.getElementById('new-user-username').value.trim();
    const password = document.getElementById('new-user-password').value;
    const role = document.getElementById('new-user-role').value;
    const schoolVal = document.getElementById('new-user-school').value;

    if (!name || !username || !password) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (role === 'School' && schoolVal === 'all') {
      showToast('Please select a specific school for School panel accounts.', 'warning');
      return;
    }

    let schoolId = null;
    let schoolName = 'All Schools';

    if (schoolVal !== 'all') {
      schoolId = Number(schoolVal);
      const schoolObj = window.db.getSchools().find(s => s.id === schoolId);
      if (schoolObj) schoolName = schoolObj.name;
    }

    const res = window.auth.createUser({
      name,
      username,
      password,
      role,
      schoolId,
      schoolName
    });

    if (res.success) {
      showToast(`User account "${name}" (${username}) created successfully!`, 'success');
      this.renderSettingsPage();
    } else {
      showToast(res.message || 'Failed to create user account.', 'error');
    }
  }

  onSelectProfileUserChange(username) {
    const selectedUser = window.auth.getUserByUsername(username);
    if (!selectedUser) return;

    const currentUser = window.auth.getCurrentUser();

    const nameInput = document.getElementById('setting-user-name');
    const usernameInput = document.getElementById('setting-user-username');
    const passInput = document.getElementById('setting-user-password');
    const roleSelect = document.getElementById('setting-user-role');
    const schoolSelect = document.getElementById('setting-user-school');
    const delBtn = document.getElementById('delete-user-btn');

    if (nameInput) nameInput.value = selectedUser.name || '';
    if (usernameInput) usernameInput.value = selectedUser.username || '';
    if (passInput) passInput.value = selectedUser.password || '';
    if (roleSelect) roleSelect.value = selectedUser.role || 'School';
    if (schoolSelect) {
      schoolSelect.value = selectedUser.schoolId ? String(selectedUser.schoolId) : 'all';
    }

    if (delBtn && currentUser) {
      const isSelf = selectedUser.username === currentUser.username;
      delBtn.style.opacity = isSelf ? '0.5' : '1';
      delBtn.style.cursor = isSelf ? 'not-allowed' : 'pointer';
      delBtn.disabled = isSelf;
    }
  }

  onProfileRoleChange(role) {
    const schoolSelect = document.getElementById('setting-user-school');
    if (!schoolSelect) return;
    if (role === 'Super Admin' || role === 'Admin') {
      schoolSelect.value = 'all';
    } else if (role === 'School' && schoolSelect.value === 'all') {
      const schools = window.db.getSchools();
      if (schools.length > 0) schoolSelect.value = String(schools[0].id);
    }
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
    showResetDefaultModal({
      onConfirm: () => {
        window.auth.resetRolePermissions();
        this.setupRoleNavigation();
        this.renderSettingsPage();
        showToast('Role permissions reset to default values', 'info');
      }
    });
  }

  toggleSettingsSubPerms(role, isChecked) {
    const cbs = document.querySelectorAll(`input[name="perm_${role}"][value^="settings_"]`);
    cbs.forEach(cb => { cb.checked = isChecked; });
  }

  toggleSchoolEntrySubPerms(role, isChecked) {
    const cbs = document.querySelectorAll(`input[name="perm_${role}"][value^="school_entry_sec"]`);
    cbs.forEach(cb => { cb.checked = isChecked; });
  }

  saveProfile(event) {
    event.preventDefault();
    const currentUser = window.auth.getCurrentUser();
    const canManageSelected = currentUser && (currentUser.role === 'Super Admin' || currentUser.role === 'Admin');

    const userSelect = document.getElementById('setting-user-select');
    const targetUsername = userSelect ? userSelect.value : (currentUser ? currentUser.username : '');
    const newName = document.getElementById('setting-user-name').value.trim();
    if (!newName) return;

    let updateData = { name: newName };

    if (canManageSelected) {
      const usernameInput = document.getElementById('setting-user-username');
      const passInput = document.getElementById('setting-user-password');
      const roleSelect = document.getElementById('setting-user-role');
      const schoolSelect = document.getElementById('setting-user-school');

      if (usernameInput && usernameInput.value.trim()) {
        updateData.username = usernameInput.value.trim();
      }

      if (passInput && passInput.value.trim()) {
        updateData.password = passInput.value.trim();
      }

      if (roleSelect) updateData.role = roleSelect.value;
      if (schoolSelect) {
        if (schoolSelect.value === 'all') {
          updateData.schoolId = null;
          updateData.schoolName = 'All Schools';
        } else {
          const sId = Number(schoolSelect.value);
          const schoolObj = window.db.getSchools().find(s => s.id === sId);
          updateData.schoolId = sId;
          updateData.schoolName = schoolObj ? schoolObj.name : 'All Schools';
        }
      }
    }

    const res = window.auth.updateUserProfile(targetUsername, updateData);
    if (res.success) {
      this.setupRoleNavigation();
      this.updateHeaderUserInfo();
      showToast('User profile updated successfully!', 'success');
      this.renderSettingsPage();
    } else {
      showToast(res.message || 'Failed to update profile.', 'error');
    }
  }

  deleteSelectedUserProfile() {
    const userSelect = document.getElementById('setting-user-select');
    if (!userSelect) return;
    const targetUsername = userSelect.value;

    showDeleteConfirmationModal({
      itemTitle: targetUsername,
      onConfirm: () => {
        const res = window.auth.deleteUser(targetUsername);
        if (res.success) {
          showToast(`User account "${targetUsername}" deleted.`, 'success');
          this.renderSettingsPage();
        } else {
          showToast(res.message || 'Failed to delete user.', 'error');
        }
      }
    });
  }

  resetSystemData() {
    showResetAllDataModal({
      onConfirm: () => {
        window.db.resetData();
        window.auth.resetUsers();
        window.auth.resetRolePermissions();
        showToast('System data reset to factory defaults!', 'info');
        setTimeout(() => window.location.reload(), 800);
      }
    });
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const navItem = e.target.closest('[data-page]');
      if (navItem) {
        e.preventDefault();
        const page = navItem.dataset.page;
        this.navigateTo(page);
      }

      // Demo pill autofill — reads username & role from data-* attributes, password from runtime config
      const demoPill = e.target.closest('[data-demo-user]');
      if (demoPill) {
        e.preventDefault();
        fillDemoCredentials(demoPill.dataset.demoUser, demoPill.dataset.demoRole || '');
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

// Category & RTO Helpers
function checkCategoryDuplicate(nameVal) {
  const warningEl = document.getElementById('cat-dup-warning');
  const saveBtn = document.getElementById('save-cat-btn');
  const cleanName = nameVal ? nameVal.trim() : '';

  if (!cleanName) {
    if (warningEl) warningEl.style.display = 'none';
    if (saveBtn) saveBtn.disabled = false;
    return false;
  }

  const isDup = window.db.checkDuplicateCategory(cleanName);
  if (isDup) {
    if (warningEl) {
      warningEl.style.display = 'inline-block';
      warningEl.innerText = 'Category already exists.';
    }
    if (saveBtn) saveBtn.disabled = true;
    return true;
  } else {
    if (warningEl) warningEl.style.display = 'none';
    if (saveBtn) saveBtn.disabled = false;
    return false;
  }
}

function saveCategoryFromSettings(event) {
  event.preventDefault();
  const idVal = document.getElementById('setting-cat-id') ? document.getElementById('setting-cat-id').value : '';
  const name = document.getElementById('setting-cat-name').value;
  const type = document.getElementById('setting-cat-type').value;
  const privilege = document.getElementById('setting-cat-privilege') ? document.getElementById('setting-cat-privilege').value : 'All';
  const desc = document.getElementById('setting-cat-desc').value;

  if (!name || !type) {
    showToast('Category Name and Type are mandatory', 'warning');
    return;
  }

  let res;
  if (idVal) {
    res = window.db.updateCategory(idVal, name, type, privilege, desc);
  } else {
    res = window.db.saveCategory(name, type, privilege, desc);
  }

  if (res.success) {
    showToast(res.message, 'success');
    if (window.app) window.app.renderSettingsPage();
  } else {
    showToast(res.message, 'error');
  }
}

function editCategoryFromSettings(id) {
  const categories = window.db.getCategories();
  const cat = categories.find(c => c.id === Number(id));
  if (!cat) return;

  const idInput = document.getElementById('setting-cat-id');
  const nameInput = document.getElementById('setting-cat-name');
  const typeSelect = document.getElementById('setting-cat-type');
  const privSelect = document.getElementById('setting-cat-privilege');
  const descInput = document.getElementById('setting-cat-desc');
  const saveBtn = document.getElementById('save-cat-btn');

  if (idInput) idInput.value = cat.id;
  if (nameInput) nameInput.value = cat.name;
  if (typeSelect) typeSelect.value = cat.type;
  if (privSelect) privSelect.value = cat.privilege || 'All';
  if (descInput) descInput.value = cat.description || '';
  if (saveBtn) saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Update Category';

  const formCard = document.getElementById('category-creation-form');
  if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function deleteCategoryFromSettings(id) {
  const categories = window.db.getCategories();
  const cat = categories.find(c => c.id === Number(id));
  if (!cat) return;

  if (confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
    const res = window.db.deleteCategory(id);
    if (res.success) {
      showToast(res.message, 'success');
      if (window.app) window.app.renderSettingsPage();
    } else {
      showToast(res.message, 'error');
    }
  }
}

function updateRtoCodeField() {
  const citySelect = document.getElementById('setting-rto-city');
  const codeInput = document.getElementById('setting-rto-code');
  if (!citySelect || !codeInput) return;

  const cityCodeMap = {
    "Thiruvananthapuram": "KL-01",
    "Kollam": "KL-02",
    "Pathanamthitta": "KL-03",
    "Alappuzha": "KL-04",
    "Kottayam": "KL-05",
    "Idukki": "KL-06",
    "Ernakulam": "KL-07",
    "Thrissur": "KL-08",
    "Palakkad": "KL-09",
    "Malappuram": "KL-10",
    "Kozhikode": "KL-11",
    "Wayanad": "KL-12",
    "Kannur": "KL-13",
    "Kasaragod": "KL-14"
  };

  const selectedCity = citySelect.value;
  if (cityCodeMap[selectedCity]) {
    codeInput.value = cityCodeMap[selectedCity];
  }
}

function saveRtoFromSettings(event) {
  event.preventDefault();
  const city = document.getElementById('setting-rto-city').value;
  const code = document.getElementById('setting-rto-code').value;

  if (!city || !code) {
    showToast('City and RTO Code are mandatory', 'warning');
    return;
  }

  const res = window.db.saveRto(city, code);
  if (res.success) {
    showToast(res.message, 'success');
    if (window.app) window.app.renderSettingsPage();
  } else {
    showToast(res.message, 'error');
  }
}

function filterRtoCodeList(query) {
  const tbody = document.getElementById('rto-code-list-tbody');
  if (!tbody) return;

  const rtos = window.db.getRtos();
  const q = (query || '').toLowerCase().trim();

  const filtered = rtos.filter(r => 
    r.office.toLowerCase().includes(q) || 
    r.city.toLowerCase().includes(q) || 
    r.code.toLowerCase().includes(q)
  );

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">No matching RTO offices or codes found for "${escapeHTML(query)}".</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((r, idx) => `
    <tr>
      <td style="text-align: center; color: var(--color-text-secondary); font-weight: 600;">${idx + 1}</td>
      <td><strong>${escapeHTML(r.office)}</strong></td>
      <td>${escapeHTML(r.city)}</td>
      <td><code style="background: #eff6ff; color: #1d4ed8; padding: 2px 8px; border-radius: 4px; font-weight: 700; border: 1px solid #bfdbfe;">${escapeHTML(r.code)}</code></td>
    </tr>
  `).join('');
}

window.filterRtoCodeList = filterRtoCodeList;
window.checkCategoryDuplicate = checkCategoryDuplicate;
window.saveCategoryFromSettings = saveCategoryFromSettings;
window.editCategoryFromSettings = editCategoryFromSettings;
window.deleteCategoryFromSettings = deleteCategoryFromSettings;
window.updateRtoCodeField = updateRtoCodeField;
window.saveRtoFromSettings = saveRtoFromSettings;
window.AppController = AppController;

// Financial Year Management Helpers
function changeSelectedYear(year) {
  window._selectedFY = year;
  if (window.app && typeof window.app.renderSettingsPage === 'function') {
    window.app.renderSettingsPage();
  }
}

function toggleActiveYearStatus(isChecked) {
  const allYears = window.db.getFinancialYears();
  const activeYearObj = allYears.find(y => y.status === 'Active') || allYears[allYears.length - 1] || { year: '2026-2027' };
  const selYear = window._selectedFY || activeYearObj.year;

  if (isChecked) {
    window.db.setActiveYear(selYear);
    showToast(`Financial Year "${selYear}" set as ACTIVE!`, 'success');
  } else {
    window.db.saveFinancialYear(selYear, 'Inactive');
    showToast(`Financial Year "${selYear}" set to INACTIVE.`, 'info');
  }

  if (window.app && typeof window.app.renderSettingsPage === 'function') {
    window.app.renderSettingsPage();
  }
}

function openAddFinancialYearModal() {
  const body = document.getElementById('generic-modal-body');
  const title = document.getElementById('generic-modal-title');
  if (!body || !title) return;

  title.innerHTML = `<i class="fa-solid fa-calendar-plus" style="color: #0284c7; margin-right: 8px;"></i> Add New Financial Year`;

  const existingYears = window.db.getFinancialYears();
  let defaultNextYear = '2027-2028';
  if (existingYears.length > 0) {
    const lastYear = existingYears[existingYears.length - 1].year;
    const parts = lastYear.split('-');
    if (parts.length === 2) {
      const y1 = parseInt(parts[0], 10);
      const y2 = parseInt(parts[1], 10);
      if (!isNaN(y1) && !isNaN(y2)) {
        defaultNextYear = `${y1 + 1}-${y2 + 1}`;
      }
    }
  }

  body.innerHTML = `
    <form onsubmit="saveNewFinancialYear(event)">
      <div style="padding: 4px 0;">
        <div class="form-group" style="margin-bottom: 16px;">
          <label style="font-weight: 700; color: #334155; display: block; margin-bottom: 6px; font-size: 13px;">
            Financial Year Range *
          </label>
          <input type="text" id="new-fy-input" class="form-control" style="font-size: 14px; font-weight: 600;" required value="${defaultNextYear}" placeholder="Format: YYYY-YYYY (e.g. 2027-2028)">
        </div>

        <div class="form-group" style="margin-bottom: 20px;">
          <label style="display: inline-flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; font-size: 13.5px; color: #0f172a;">
            <input type="checkbox" id="new-fy-active-check" checked style="width: 18px; height: 18px; accent-color: #0284c7; cursor: pointer;">
            Set as Current Active Financial Year
          </label>
        </div>

        <div class="modal-footer" style="padding: 12px 0 0 0; margin-top: 16px; display: flex; justify-content: flex-end; gap: 10px; background: transparent; border-top: none;">
          <button type="button" class="btn-secondary" onclick="closeModal('generic-modal')" style="width: auto; padding: 8px 18px;">Cancel</button>
          <button type="submit" class="btn-primary" style="width: auto; padding: 8px 20px; background: #0284c7; font-weight: 700;">Save Financial Year</button>
        </div>
      </div>
    </form>
  `;

  openModal('generic-modal');
  setTimeout(() => {
    const inputEl = document.getElementById('new-fy-input');
    if (inputEl) inputEl.focus();
  }, 150);
}

function saveNewFinancialYear(event) {
  if (event) event.preventDefault();
  const inputEl = document.getElementById('new-fy-input');
  const activeCheck = document.getElementById('new-fy-active-check');
  if (!inputEl) return;

  const yearVal = inputEl.value.trim();
  if (!yearVal) {
    showToast('Please enter a valid financial year', 'warning');
    return;
  }

  const isChecked = activeCheck ? activeCheck.checked : true;
  const status = isChecked ? 'Active' : 'Inactive';

  window.db.saveFinancialYear(yearVal, status);
  window._selectedFY = yearVal;
  closeModal('generic-modal');
  showToast(`Financial Year "${yearVal}" added successfully (${status})!`, 'success');

  if (window.app && typeof window.app.renderSettingsPage === 'function') {
    window.app.renderSettingsPage();
  }
}

window.changeSelectedYear = changeSelectedYear;
window.changeActiveYear = changeSelectedYear;
window.toggleActiveYearStatus = toggleActiveYearStatus;
window.openAddFinancialYearModal = openAddFinancialYearModal;
window.saveNewFinancialYear = saveNewFinancialYear;

// Global Demo Pill Fill Helper — resolves passwords from runtime config via auth module
function fillDemoCredentials(username, role) {
  const users = window.auth.getUsers();
  const matched = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  const uInput = document.getElementById('login-username');
  const pInput = document.getElementById('login-password');
  const rSelect = document.getElementById('login-role');

  if (uInput) uInput.value = username;
  if (pInput) pInput.value = matched ? matched.password : '';
  if (rSelect) rSelect.value = role;
  showToast(`Autofilled demo credentials for ${role}`, 'info');
}

document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
