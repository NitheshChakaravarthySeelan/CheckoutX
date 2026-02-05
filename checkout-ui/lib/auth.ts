// lib/auth.ts

interface User {
  userId: string;
  userName: { username: string };
  email: string;
  roles: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const TOKEN_KEY = "jwt_token";
const USER_ID_KEY = "user_id";
const USER_ROLES_KEY = "user_roles";
const USER_NAME_KEY = "user_name"; // Store username separately for simplicity if needed
const USER_EMAIL_KEY = "user_email";

// Helper to parse JWT token (for real applications, use a library like jwt-decode)
// For now, we'll just extract what we stored
function parseJwt(token: string): any {
  // Dummy parser for now, assuming we stored user details separately
  return {
    sub: localStorage.getItem(USER_NAME_KEY) || "", // Simulate username from token
    userId: localStorage.getItem(USER_ID_KEY),
    email: localStorage.getItem(USER_EMAIL_KEY),
    roles: localStorage.getItem(USER_ROLES_KEY)?.split(",") || [],
  };
}

export const Auth = {
  getAuthState(): AuthState {
    if (typeof window === "undefined") {
      return {
        token: null,
        user: null,
        isAuthenticated: false,
        isAdmin: false,
      };
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const userId = localStorage.getItem(USER_ID_KEY);
    const userRoles = localStorage.getItem(USER_ROLES_KEY);
    const userName = localStorage.getItem(USER_NAME_KEY);
    const userEmail = localStorage.getItem(USER_EMAIL_KEY);

    if (token && userId && userRoles) {
      const rolesArray = userRoles.split(",");
      const user: User = {
        userId: userId,
        userName: { username: userName || "" },
        email: userEmail || "",
        roles: rolesArray,
      };
      return {
        token,
        user,
        isAuthenticated: true,
        isAdmin: rolesArray.includes("ADMIN"),
      };
    }
    return { token: null, user: null, isAuthenticated: false, isAdmin: false };
  },

  setAuthState(token: string, user: User) {
    if (typeof window === "undefined") return;

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_ID_KEY, user.userId);
    localStorage.setItem(USER_ROLES_KEY, user.roles.join(","));
    localStorage.setItem(USER_NAME_KEY, user.userName.username);
    localStorage.setItem(USER_EMAIL_KEY, user.email);
  },

  clearAuthState() {
    if (typeof window === "undefined") return;

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_ROLES_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
  },
};
