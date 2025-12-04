// Get the API base URL from environment variable or use relative path
export const getApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In production, use VITE_API_URL if set, otherwise use relative path
  const baseUrl = import.meta.env.VITE_API_URL || '';
  
  // If baseUrl is set, ensure it doesn't end with a slash
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Always ensure path starts with /
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  
  return normalizedBase ? `${normalizedBase}${normalizedPath}` : normalizedPath;
};

// API client for direct fetch calls
export const api = {
  get: async (url: string) => {
    const apiUrl = getApiUrl(url);
    const res = await fetch(apiUrl, {
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || error.error || res.statusText);
    }
    return res.json();
  },
  post: async (url: string, data?: unknown, options?: RequestInit) => {
    const apiUrl = getApiUrl(url);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: options?.headers || (data instanceof FormData ? {} : { "Content-Type": "application/json" }),
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
      credentials: "include",
      ...options,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      const errorObj = new Error(error.message || error.error || res.statusText);
      (errorObj as any).response = { data: error, status: res.status };
      throw errorObj;
    }
    const json = await res.json();
    // Return both wrapped and unwrapped for compatibility
    return json;
  },
  delete: async (url: string) => {
    const apiUrl = getApiUrl(url);
    const res = await fetch(apiUrl, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(error.message || error.error || res.statusText);
    }
    return res.json();
  },
};

