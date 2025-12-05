/**
 * API Client for Backend
 * 
 * Set VITE_API_URL in Vercel environment variables
 * Example: https://your-backend.railway.app
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  baseURL: API_URL,
  
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Upload endpoints
  async uploadModel(file: File): Promise<{ url: string; job_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_URL}/v1/upload/model`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload model');
    }

    return response.json();
  },

  async uploadFabric(file: File, type: 'top' | 'bottom'): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await fetch(`${API_URL}/v1/upload/fabric`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload fabric');
    }

    return response.json();
  },

  // Mask detection
  async detectMask(jobId: string): Promise<{ mask_url: string }> {
    return this.request(`/v1/mask/detect/${jobId}`);
  },

  // Outfit generation
  async generateOutfit(data: {
    job_id: string;
    top_fabric_url?: string;
    bottom_fabric_url?: string;
    top_scale?: number;
    top_orientation?: number;
    top_strength?: number;
    bottom_scale?: number;
    bottom_orientation?: number;
    bottom_strength?: number;
  }): Promise<{ output_url: string; job_id: string }> {
    return this.request('/v1/outfit/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Job status
  async getJobStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result_url?: string;
    error?: string;
  }> {
    return this.request(`/v1/jobs/${jobId}`);
  },
};

