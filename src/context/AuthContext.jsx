import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../api';
import { getAuthUser } from '../cookies';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getAuthUser());
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    let isMounted = true;
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();
        if (isMounted) {
          setUser(currentUser);
        }
      } catch {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  async function login(email, password) {
    const res = await loginUser(email, password);
    if (res.success && res.user) {
      setUser(res.user);
      setIsAuthModalOpen(false);
    }
    return res;
  }

  async function register(name, email, password, recaptchaToken = null) {
    const res = await registerUser(name, email, password, recaptchaToken);
    if (res.success) {
      if (res.user) {
        setUser(res.user);
        setIsAuthModalOpen(false);
        return res;
      }
      // Fallback: Seamlessly authenticate user with credentials if session wasn't directly returned
      const loginRes = await login(email, password);
      return loginRes;
    }
    return res;
  }

  async function logout() {
    await logoutUser();
    setUser(null);
  }

  function openAuthModal(mode = 'login') {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }

  function closeAuthModal() {
    setIsAuthModalOpen(false);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
