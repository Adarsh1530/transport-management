/* ==========================================
   AUTHENTICATION & ROLE-BASED ACCESS CONTROL
   ========================================== */

const AUTH_SESSION_KEY = 'school_transport_session';
window.AUTH_SESSION_KEY = AUTH_SESSION_KEY;

const DEMO_USERS = [
  {
    username: "superadmin",
    password: "super123",
    role: "Super Admin",
    name: "System Super Admin",
    schoolId: null,
    schoolName: "All Schools"
  },
  {
    username: "admin",
    password: "admin123",
    role: "Admin",
    name: "Transport Manager Admin",
    schoolId: null,
    schoolName: "All Schools"
  },
  {
    username: "school1",
    password: "school123",
    role: "School",
    name: "Green Valley Admin",
    schoolId: 1,
    schoolName: "Green Valley Public School"
  },
  {
    username: "school2",
    password: "school123",
    role: "School",
    name: "St. Mary's Admin",
    schoolId: 2,
    schoolName: "St. Mary's Higher Secondary School"
  }
];

const ROLE_PERMISSIONS_KEY = 'school_transport_role_permissions';
window.ROLE_PERMISSIONS_KEY = ROLE_PERMISSIONS_KEY;

const DEFAULT_ROLE_PERMISSIONS = {
  "Admin": ['dashboard', 'schools', 'vehicles', 'drivers', 'routes', 'trips', 'income', 'expenses', 'renewals', 'reports'],
  "School": ['dashboard', 'vehicles', 'drivers', 'routes', 'trips', 'income', 'expenses', 'renewals', 'reports']
};
window.DEFAULT_ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

class AuthManager {
  constructor() {
    this.session = this.getSession();
  }

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_SESSION_KEY)) || null;
    } catch (e) {
      return null;
    }
  }

  getRolePermissions() {
    try {
      const saved = localStorage.getItem(ROLE_PERMISSIONS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { ...DEFAULT_ROLE_PERMISSIONS };
  }

  saveRolePermissions(perms) {
    localStorage.setItem(ROLE_PERMISSIONS_KEY, JSON.stringify(perms));
  }

  resetRolePermissions() {
    localStorage.removeItem(ROLE_PERMISSIONS_KEY);
  }

  isLoggedIn() {
    return this.session !== null;
  }

  getCurrentUser() {
    return this.session;
  }

  login(username, password, role) {
    const user = DEMO_USERS.find(
      u => u.username === username.trim() &&
           u.password === password &&
           u.role === role
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
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(this.session));
      return { success: true, user: this.session };
    }

    return { success: false, message: "Invalid username, password, or role selection." };
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

    if (role === 'Super Admin') return true;

    const perms = this.getRolePermissions();
    const roleAllowed = perms[role] || DEFAULT_ROLE_PERMISSIONS[role] || [];
    return roleAllowed.includes(pageId);
  }
}

window.auth = new AuthManager();
