/**
 * src/api.js — Multi-Tenant SaaS Backend API Client for Blogs
 *
 * Communicates with the Cloudflare Pages serverless / local Node backend,
 * supplying:
 * 1. X-Website-Id (Multi-tenant isolation)
 * 2. X-Device-Id (Deduplication of pageviews & likes)
 * 3. Authorization Bearer Token (Authenticated user session)
 */

import { siteConfig } from './site.config';
import {
  getDeviceId,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  setAuthUser,
} from './cookies';

function getEndpoint(path) {
  const base =
    import.meta.env.VITE_API_URL ||
    siteConfig.apiUrl ||
    (typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://127.0.0.1:5000'
      : '');
  return `${base.replace(/\/$/, '')}${path}`;
}

function getCommonHeaders(customHeaders = {}) {
  const websiteId = siteConfig.websiteId || 'partial-existence';
  const deviceId = getDeviceId();
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-Website-Id': websiteId,
    'X-Device-Id': deviceId,
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

// ============================================================================
// AUTHENTICATION APIs
// ============================================================================

/**
 * Register a new user account
 */
export async function registerUser(name, email, password) {
  try {
    const res = await fetch(getEndpoint('/api/auth/register'), {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({
        name,
        email,
        password,
        websiteId: siteConfig.websiteId || 'partial-existence',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Registration failed' };
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user) {
      setAuthUser(data.user);
    }

    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    return { success: false, error: err.message || 'Network error during registration' };
  }
}

/**
 * Login existing user
 */
export async function loginUser(email, password) {
  try {
    const res = await fetch(getEndpoint('/api/auth/login'), {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({
        email,
        password,
        websiteId: siteConfig.websiteId || 'partial-existence',
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }

    if (data.token) {
      setAuthToken(data.token);
    }
    if (data.user) {
      setAuthUser(data.user);
    }

    return { success: true, user: data.user, token: data.token };
  } catch (err) {
    return { success: false, error: err.message || 'Network error during login' };
  }
}

/**
 * Logout current user
 */
export async function logoutUser() {
  try {
    await fetch(getEndpoint('/api/auth/logout'), {
      method: 'POST',
      headers: getCommonHeaders(),
    });
  } catch {
    // Ignore network errors on logout
  } finally {
    clearAuthToken();
  }
  return { success: true };
}

/**
 * Fetch current authenticated user
 */
export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(getEndpoint('/api/auth/me'), {
      method: 'GET',
      headers: getCommonHeaders(),
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuthToken();
      }
      return null;
    }

    const data = await res.json();
    if (data.user) {
      setAuthUser(data.user);
      return data.user;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// ENGAGEMENT APIs (PAGEVIEWS, LIKES, COMMENTS, STATS)
// ============================================================================

/**
 * Record a pageview for a post slug (deduplicated by deviceId on backend)
 */
export async function recordPageView(slug) {
  try {
    const res = await fetch(getEndpoint('/api/pageviews'), {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({
        slug,
        deviceId: getDeviceId(),
        websiteId: siteConfig.websiteId || 'partial-existence',
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Pageview sync failed:', err.message);
    return null;
  }
}

/**
 * Get total pageviews for a post slug
 */
export async function getPageViews(slug) {
  try {
    const res = await fetch(
      getEndpoint(`/api/pageviews?slug=${encodeURIComponent(slug)}&websiteId=${encodeURIComponent(siteConfig.websiteId || 'partial-existence')}`),
      {
        headers: getCommonHeaders(),
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Get pageviews failed:', err.message);
    return null;
  }
}

/**
 * Get likes count for a post slug
 */
export async function getLikes(slug) {
  try {
    const res = await fetch(
      getEndpoint(`/api/likes?slug=${encodeURIComponent(slug)}&websiteId=${encodeURIComponent(siteConfig.websiteId || 'partial-existence')}`),
      {
        headers: getCommonHeaders(),
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Get likes failed:', err.message);
    return null;
  }
}

/**
 * Toggle or update like status
 */
export async function toggleLike(slug, liked) {
  try {
    const res = await fetch(getEndpoint('/api/likes'), {
      method: 'POST',
      headers: getCommonHeaders(),
      body: JSON.stringify({
        slug,
        action: liked ? 'like' : 'unlike',
        deviceId: getDeviceId(),
        websiteId: siteConfig.websiteId || 'partial-existence',
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Toggle like failed:', err.message);
    return null;
  }
}

/**
 * Fetch comments for a post slug
 */
export async function getComments(slug) {
  try {
    const res = await fetch(
      getEndpoint(`/api/comments?slug=${encodeURIComponent(slug)}&websiteId=${encodeURIComponent(siteConfig.websiteId || 'partial-existence')}`),
      {
        headers: getCommonHeaders(),
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Get comments failed:', err.message);
    return null;
  }
}

/**
 * Submit a new comment (authenticated or guest with recaptcha)
 */
export async function postComment(slug, author, text, recaptchaToken = null, email = null, subscribeUpdates = false) {
  const authorToken = getDeviceId();
  try {
    const res = await fetch(getEndpoint('/api/comments'), {
      method: 'POST',
      headers: getCommonHeaders({ 'x-author-token': authorToken }),
      body: JSON.stringify({
        slug,
        author,
        text,
        email,
        subscribeUpdates,
        authorToken,
        recaptchaToken,
        websiteId: siteConfig.websiteId || 'partial-existence',
      }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        error: errData.error || 'Failed to submit comment',
        warning: errData.warning || null,
        title: errData.title || null,
        message: errData.message || null,
        accountNotice: errData.accountNotice || null,
        isProfanity: Boolean(errData.isProfanity),
        detectedWords: errData.detectedWords || [],
      };
    }
    return await res.json();
  } catch (err) {
    console.debug('[API] Post comment failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a comment by ID
 */
export async function deleteComment(id) {
  const authorToken = getDeviceId();
  try {
    const res = await fetch(
      getEndpoint(`/api/comments?id=${encodeURIComponent(id)}&token=${encodeURIComponent(authorToken)}&websiteId=${encodeURIComponent(siteConfig.websiteId || 'partial-existence')}`),
      {
        method: 'DELETE',
        headers: getCommonHeaders({
          'x-author-token': authorToken,
        }),
      }
    );
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error || 'Failed to delete comment' };
    }
    return await res.json();
  } catch (err) {
    console.debug('[API] Delete comment failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Get aggregate statistics across the blog
 */
export async function getBlogStats() {
  try {
    const res = await fetch(
      getEndpoint(`/api/stats?websiteId=${encodeURIComponent(siteConfig.websiteId || 'partial-existence')}`),
      {
        headers: getCommonHeaders(),
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Get stats failed:', err.message);
    return null;
  }
}

/**
 * Get dynamic moderation configuration from the SaaS backend
 */
export async function getModerationConfig() {
  try {
    const res = await fetch(
      getEndpoint(`/api/moderation/config?websiteId=${encodeURIComponent(siteConfig.websiteId || 'partial-existence')}`),
      { headers: getCommonHeaders() }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.debug('[API] Get moderation config failed:', err.message);
    return null;
  }
}
