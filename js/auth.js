/* ==========================================
   AUTHENTICATION & ROLE-BASED ACCESS CONTROL
   ========================================== */

const AUTH_SESSION_KEY = 'school_transport_session';
window.AUTH_SESSION_KEY = AUTH_SESSION_KEY;

const EXPENSE_VISIBILITY_KEY = 'school_transport_expense_visibility';
window.EXPENSE_VISIBILITY_KEY = EXPENSE_VISIBILITY_KEY;

// Demo credentials are loaded from localStorage key 'vms_demo_cfg'.
// Seed them once via: localStorage.setItem('vms_demo_cfg', JSON.stringify({sa:'super123',ad:'admin123',sc:'school123'}));
// In production, remove this seed block and provision credentials server-side.
(function _seedDemoCfgIfAbsent() {
  try {
    if (!localStorage.getItem('vms_demo_cfg')) {
      localStorage.setItem('vms_demo_cfg', JSON.stringify({ sa: 'super123', ad: 'admin123', sc: 'school123' }));
    }
  } catch (e) {}
})();

function _getDemoCfg() {
  try {
    const cfg = JSON.parse(localStorage.getItem('vms_demo_cfg') || '{}');
    return {
      superAdminPass: cfg.sa || '',
      adminPass:      cfg.ad || '',
      schoolPass:     cfg.sc || ''
    };
  } catch (e) {
    return { superAdminPass: '', adminPass: '', schoolPass: '' };
  }
}

function _buildDemoUsers() {
  const cfg = _getDemoCfg();
  return [
    { username: 'superadmin', password: cfg.superAdminPass, role: 'Super Admin', name: 'System Super Admin',       schoolId: null, schoolName: 'All Schools' },
    { username: 'admin',      password: cfg.adminPass,      role: 'Admin',       name: 'Transport Manager Admin',  schoolId: null, schoolName: 'All Schools' },
    { username: 'school1',    password: cfg.schoolPass,     role: 'School',      name: 'Green Valley Admin',       schoolId: 1,    schoolName: 'Green Valley Public School' },
    { username: 'school2',    password: cfg.schoolPass,     role: 'School',      name: "St. Mary's Admin",         schoolId: 2,    schoolName: "St. Mary's Higher Secondary School" }
  ];
}

const DEMO_USERS = _buildDemoUsers();

const ROLE_PERMISSIONS_KEY = 'school_transport_role_permissions';
window.ROLE_PERMISSIONS_KEY = ROLE_PERMISSIONS_KEY;

const DEFAULT_ROLE_PERMISSIONS = {
  "Admin": ['dashboard', 'schools', 'vehicles', 'drivers', 'attendants', 'routes', 'school-entry', 'school_entry_sec1', 'school_entry_sec2', 'school_entry_sec3', 'school_entry_sec4', 'income', 'expenses', 'renewals', 'reports', 'settings', 'settings_report_builder', 'settings_categories', 'settings_expense_visibility', 'settings_rto', 'settings_user_profile', 'settings_create_user', 'settings_role_permissions', 'settings_reset_data'],
  "School": ['dashboard', 'vehicles', 'drivers', 'attendants', 'routes', 'school-entry', 'school_entry_sec1', 'income', 'expenses', 'renewals', 'reports', 'settings', 'settings_categories', 'settings_user_profile']
};
window.DEFAULT_ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

const USERS_STORAGE_KEY = 'school_transport_users';
window.USERS_STORAGE_KEY = USERS_STORAGE_KEY;

class AuthManager {
  constructor() {
    this.session = this.getSession();
  }

  getUsers() {
    let users = [];
    try {
      const saved = localStorage.getItem(USERS_STORAGE_KEY);
      if (saved) users = JSON.parse(saved);
    } catch (e) {}

    if (!Array.isArray(users) || users.length === 0) {
      users = [...DEMO_USERS];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } else {
      let changed = false;
      DEMO_USERS.forEach(demo => {
        if (!users.some(u => u.username.toLowerCase() === demo.username.toLowerCase())) {
          users.push(demo);
          changed = true;
        }
      });
      if (changed) {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    }
    return users;
  }

  saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  getUserByUsername(username) {
    const users = this.getUsers();
    return users.find(u => u.username === username) || null;
  }

  updateUserProfile(username, data) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
      if (data.username && data.username.trim().toLowerCase() !== username.toLowerCase()) {
        const newUsername = data.username.trim();
        const dup = users.find(u => u.username.toLowerCase() === newUsername.toLowerCase());
        if (dup) {
          return { success: false, message: `Username "${newUsername}" is already taken.` };
        }
      }
      users[idx] = { ...users[idx], ...data };
      if (data.username) users[idx].username = data.username.trim();
      this.saveUsers(users);

      if (this.session && (this.session.username === username || (data.username && this.session.username === data.username.trim()))) {
        this.session = {
          ...this.session,
          username: users[idx].username,
          name: users[idx].name,
          role: users[idx].role,
          schoolId: users[idx].schoolId,
          schoolName: users[idx].schoolName
        };
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(this.session));
      }
      return { success: true };
    }
    return { success: false, message: 'User profile not found.' };
  }

  createUser(userData) {
    const users = this.getUsers();
    const username = (userData.username || '').trim();
    if (!username) {
      return { success: false, message: 'Username is required.' };
    }
    const existing = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      return { success: false, message: 'Username already exists. Please choose a unique username.' };
    }
    const newUser = {
      username: username,
      password: userData.password || _getDemoCfg().schoolPass || '',
      role: userData.role || 'School',
      name: (userData.name || '').trim(),
      schoolId: userData.schoolId !== undefined ? userData.schoolId : null,
      schoolName: userData.schoolName || 'All Schools'
    };
    users.push(newUser);
    this.saveUsers(users);
    return { success: true, user: newUser };
  }

  deleteUser(username) {
    let users = this.getUsers();
    if (users.length <= 1) {
      return { success: false, message: 'Cannot delete the last remaining user account.' };
    }
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
      if (this.session && this.session.username === username) {
        return { success: false, message: 'You cannot delete your active logged-in user account.' };
      }
      users.splice(idx, 1);
      this.saveUsers(users);
      return { success: true };
    }
    return { success: false, message: 'User not found.' };
  }

  resetUsers() {
    localStorage.removeItem(USERS_STORAGE_KEY);
  }

  getSession() {
    try {
      const sess = JSON.parse(localStorage.getItem(AUTH_SESSION_KEY));
      if (sess && typeof sess === 'object' && sess.username && sess.role) {
        return sess;
      }
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    } catch (e) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      return null;
    }
  }

  getRolePermissions() {
    let perms = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    let savedPermissions = null;
    try {
      const saved = localStorage.getItem(ROLE_PERMISSIONS_KEY);
      if (saved) savedPermissions = JSON.parse(saved);
    } catch (e) {}

    // A saved matrix is authoritative: an unchecked privilege must stay
    // unchecked. Merge only missing roles for forward-compatible upgrades.
    if (savedPermissions && typeof savedPermissions === 'object') {
      ['Admin', 'School'].forEach(role => {
        if (Array.isArray(savedPermissions[role])) perms[role] = [...new Set(savedPermissions[role])];
      });
    }

    return perms;
  }

  saveRolePermissions(perms) {
    localStorage.setItem(ROLE_PERMISSIONS_KEY, JSON.stringify(perms));
  }

  resetRolePermissions() {
    localStorage.removeItem(ROLE_PERMISSIONS_KEY);
  }

  getExpenseVisibility() {
    try {
      const saved = localStorage.getItem(EXPENSE_VISIBILITY_KEY);
      if (saved) return saved;
    } catch (e) {}
    return 'All';
  }

  saveExpenseVisibility(level) {
    localStorage.setItem(EXPENSE_VISIBILITY_KEY, level);
  }

  canViewExpenses(role) {
    return true;
  }

  isLoggedIn() {
    return this.getCurrentUser() !== null;
  }

  getCurrentUser() {
    if (this.session && typeof this.session === 'object' && this.session.username && this.session.role) {
      return this.session;
    }
    this.session = this.getSession();
    return this.session;
  }

  login(username, password, role) {
    const users = this.getUsers();
    const cleanUser = (username || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    if (!cleanUser || !cleanPass) {
      return { success: false, message: "Please enter both username and password." };
    }

    let user = users.find(
      u => u.username.toLowerCase() === cleanUser && u.password === cleanPass
    );

    if (user) {
      this.session = {
        username: user.username,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.schoolName,
        loginTime: new Date().toISOString()
      };
      try {
        localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(this.session));
      } catch (e) {}
      return { success: true, user: this.session };
    }

    return { success: false, message: "Invalid username or password. Try demo logins below!" };
  }

  logout() {
    this.session = null;
    localStorage.removeItem(AUTH_SESSION_KEY);
  }

  demoResetPassword(mobile, otp, newPassword) {
    if (!mobile || mobile.length < 10) {
      return { success: false, message: "Please enter a valid 10-digit mobile number." };
    }
    if (otp !== "123456") {
      return { success: false, message: "Invalid OTP! Use demo OTP 123456." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: "Password must be at least 6 characters long." };
    }

    return { success: true, message: "Password reset successful! You may now log in." };
  }

  hasPermission(pageId) {
    if (!this.session) return false;
    const role = this.session.role;

    if (pageId === 'expenses') {
      if (!this.canViewExpenses(role)) return false;
    }

    if (role === 'Super Admin') return true;

    const perms = this.getRolePermissions();
    const roleAllowed = perms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];

    if (pageId === 'settings') {
      return roleAllowed.includes('settings') || roleAllowed.some(p => typeof p === 'string' && p.startsWith('settings_'));
    }

    return roleAllowed.includes(pageId);
  }
}

window.auth = new AuthManager();

