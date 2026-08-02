import { createContext, useState, useContext } from 'react';
import { loginRequest, registerRequest, googleLoginRequest } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });

  function saveAuthData(data) {
    if (!data) return null;
    const authUser = data.user || data;
    const token = data.accessToken || data.access_token || data.token;
    const refresh = data.refreshToken || data.refresh_token;

    if (token) localStorage.setItem('accessToken', token);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    if (authUser) {
      localStorage.setItem('user', JSON.stringify(authUser));
      setUser(authUser);
    }
    return authUser;
  }

  async function login(emailOrObj, passwordArg) {
    let email, password;
    if (typeof emailOrObj === 'object' && emailOrObj !== null) {
      email = emailOrObj.email;
      password = emailOrObj.password;
    } else {
      email = emailOrObj;
      password = passwordArg;
    }

    const data = await loginRequest({ email, password });
    return saveAuthData(data);
  }

  async function register({ name, email, password, role }) {
    const data = await registerRequest({ name, email, password, role });
    return saveAuthData(data);
  }

  async function googleLogin(idToken) {
    const data = await googleLoginRequest(idToken);
    return saveAuthData(data);
  }

  function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}