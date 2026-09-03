/**
 * src/cookies.js — Secure Dual-Cookie & Storage Management
 *
 * Handles:
 * 1. Device Identifier (pe_device_id, pe_viewed_posts) — Prevents redundant view counts
 * 2. User Authentication Session (pe_auth_token, pe_auth_user) — Sign In, Sign Out & Profile
 * 3. Cookie Consent & Author Name persistence
 */

export function setCookie(name, value, days = 365) {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  const sameSite = 'SameSite=Lax';
  const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};${expires};path=/;${sameSite};${secure}`;
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const cookieName = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(';');

  for (let i = 0; i < cookies.length; i++) {
    let c = cookies[i].trim();
    if (c.indexOf(cookieName) === 0) {
      return decodeURIComponent(c.substring(cookieName.length, c.length));
    }
  }
  return null;
}

export function deleteCookie(name) {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;SameSite=Lax;`;
}

// ============================================================================
// 1. DEVICE IDENTITY (Redundant View Count Prevention)
// ============================================================================

/**
 * Get or initialize persistent unique device ID (stored in cookie + localStorage)
 */
export function getDeviceId() {
  let deviceId = getCookie('pe_device_id');
  if (!deviceId) {
    try {
      deviceId = localStorage.getItem('pe_device_id');
    } catch {
      // Ignore
    }
  }

  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  setCookie('pe_device_id', deviceId, 365);
  try {
    localStorage.setItem('pe_device_id', deviceId);
  } catch {
    // Ignore
  }

  return deviceId;
}

/**
 * Check if current device has already recorded a view for this post
 */
export function hasViewedPostCookie(slug) {
  try {
    const raw = getCookie('pe_viewed_posts');
    if (raw) {
      const viewedList = JSON.parse(raw);
      if (Array.isArray(viewedList) && viewedList.includes(slug)) return true;
    }
    const localRaw = localStorage.getItem('pe_viewed_posts');
    if (localRaw) {
      const localList = JSON.parse(localRaw);
      if (Array.isArray(localList) && localList.includes(slug)) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Mark post as viewed on this device (cookie + localStorage)
 */
export function markPostViewedCookie(slug) {
  try {
    let viewedList = [];
    const localRaw = localStorage.getItem('pe_viewed_posts');
    if (localRaw) {
      const parsed = JSON.parse(localRaw);
      if (Array.isArray(parsed)) viewedList = parsed;
    }

    if (!viewedList.includes(slug)) {
      viewedList.push(slug);
      localStorage.setItem('pe_viewed_posts', JSON.stringify(viewedList));
      setCookie('pe_viewed_posts', JSON.stringify(viewedList), 180);
    }
  } catch {
    // Ignore
  }
}

// ============================================================================
// 2. AUTHENTICATION SESSION (Sign In / Sign Out / Profile)
// ============================================================================

/**
 * Get stored Auth Session Token
 */
export function getAuthToken() {
  const fromCookie = getCookie('pe_auth_token');
  if (fromCookie) return fromCookie;
  try {
    return localStorage.getItem('pe_auth_token') || null;
  } catch {
    return null;
  }
}

/**
 * Save Auth Session Token to cookie + localStorage
 */
export function setAuthToken(token) {
  if (!token) return;
  setCookie('pe_auth_token', token, 30);
  try {
    localStorage.setItem('pe_auth_token', token);
  } catch {
    // Ignore
  }
}

/**
 * Clear Auth Session Token from cookie + localStorage
 */
export function clearAuthToken() {
  deleteCookie('pe_auth_token');
  try {
    localStorage.removeItem('pe_auth_token');
    localStorage.removeItem('pe_auth_user');
  } catch {
    // Ignore
  }
}

/**
 * Get cached user profile
 */
export function getAuthUser() {
  try {
    const raw = localStorage.getItem('pe_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Set cached user profile
 */
export function setAuthUser(user) {
  try {
    if (user) {
      localStorage.setItem('pe_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('pe_auth_user');
    }
  } catch {
    // Ignore
  }
}

// ============================================================================
// 3. SAVED AUTHOR NAME & COOKIE CONSENT
// ============================================================================

export function getUserIdCookie() {
  return getDeviceId();
}

export function getSavedAuthorName() {
  const user = getAuthUser();
  if (user && user.name) return user.name;

  const fromCookie = getCookie('pe_author_name');
  if (fromCookie) return fromCookie;
  try {
    return localStorage.getItem('pe_author_name') || '';
  } catch {
    return '';
  }
}

export function saveAuthorName(name) {
  const trimmed = (name || '').trim();
  if (trimmed) {
    setCookie('pe_author_name', trimmed, 365);
    try {
      localStorage.setItem('pe_author_name', trimmed);
    } catch {
      // Ignore
    }
  }
}

export function getCookieConsent() {
  return getCookie('pe_cookie_consent');
}

export function setCookieConsent(status) {
  setCookie('pe_cookie_consent', status, 365);
}
