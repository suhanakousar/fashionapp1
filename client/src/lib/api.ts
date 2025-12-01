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

