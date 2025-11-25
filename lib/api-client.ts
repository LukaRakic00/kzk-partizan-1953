// Automatski detektuj API URL - u browser-u koristi trenutni origin, u server-side koristi env varijablu
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // U browser-u - koristi trenutni origin (automatski radi i u dev i u production)
    return window.location.origin;
  }
  // U server-side - koristi env varijablu ili fallback na localhost
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
};

const API_URL = getApiUrl();

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // U browser-u, uvek koristi trenutni origin
    if (typeof window !== 'undefined') {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    }
    
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth-token');
    }
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: headers as HeadersInit,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Greška na serveru' }));
      throw new Error(error.error || 'Greška na serveru');
    }

    return response.json();
  }

  async login(username: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', data.token);
      this.token = data.token;
    }

    return data;
  }

  async logout() {
    try {
      // Pozovi logout API da obriše cookie
      await this.request('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-token');
        this.token = null;
      }
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  }

  // Players
  async getPlayers(year?: number) {
    const url = year ? `/api/players?year=${year}` : '/api/players';
    return this.request<any[]>(url);
  }

  async createPlayer(data: any) {
    return this.request('/api/players', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlayer(id: string, data: any) {
    return this.request(`/api/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePlayer(id: string) {
    return this.request(`/api/players/${id}`, {
      method: 'DELETE',
    });
  }

  // News
  async getNews() {
    return this.request<any[]>('/api/news');
  }

  async getNewsBySlug(slug: string) {
    return this.request<any>(`/api/news/${slug}`);
  }

  async createNews(data: any) {
    return this.request('/api/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateNews(id: string, data: any) {
    return this.request(`/api/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteNews(id: string) {
    return this.request(`/api/news/${id}`, {
      method: 'DELETE',
    });
  }

  // Gallery
  async getGalleries(category?: string) {
    const url = category ? `/api/gallery?category=${category}` : '/api/gallery';
    return this.request<any[]>(url);
  }

  async createGallery(data: any) {
    return this.request('/api/gallery', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGallery(id: string, data: any) {
    return this.request(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGallery(id: string) {
    return this.request(`/api/gallery/${id}`, {
      method: 'DELETE',
    });
  }

  // History
  async getHistory() {
    return this.request<any[]>('/api/history');
  }

  async createHistory(data: any) {
    return this.request('/api/history', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateHistory(id: string, data: any) {
    return this.request(`/api/history/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteHistory(id: string) {
    return this.request(`/api/history/${id}`, {
      method: 'DELETE',
    });
  }

  // Club Status
  async getClubStatus() {
    return this.request<any>('/api/club-status');
  }

  async updateClubStatus(data: any) {
    return this.request('/api/club-status', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Images
  async getImages(folder?: string, category?: string) {
    const params = new URLSearchParams();
    if (folder) params.append('folder', folder);
    if (category) params.append('category', category);
    const url = `/api/images${params.toString() ? `?${params.toString()}` : ''}`;
    try {
      const data = await this.request<any[]>(url);
      console.log(`API Client: Loaded ${data?.length || 0} images for folder: ${folder || 'all'}`);
      return data || [];
    } catch (error) {
      console.error('API Client getImages error:', error);
      return [];
    }
  }

  // Get images directly from Cloudinary (not from MongoDB)
  async getImagesFromCloudinary(folder: string) {
    const url = `/api/images/cloudinary?folder=${folder}`;
    try {
      const data = await this.request<any[]>(url);
      console.log(`API Client: Loaded ${data?.length || 0} images from Cloudinary folder: ${folder}`);
      return data || [];
    } catch (error) {
      console.error('API Client getImagesFromCloudinary error:', error);
      return [];
    }
  }

  async createImage(data: any) {
    return this.request('/api/images', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateImage(id: string, data: any) {
    return this.request(`/api/images/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteImage(id: string) {
    return this.request(`/api/images/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings
  async getSettings(key?: string) {
    const url = key ? `/api/settings?key=${key}` : '/api/settings';
    return this.request<any>(url);
  }

  async updateSetting(data: { key: string; value: any; type?: string; description?: string }) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Contact
  async sendContactMessage(data: { name: string; email: string; title: string; message?: string }) {
    return this.request('/api/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getContacts(unreadOnly?: boolean): Promise<{ contacts: any[]; success: boolean; total: number; unread: number }> {
    const url = unreadOnly ? '/api/contact?unread=true' : '/api/contact';
    return this.request<{ contacts: any[]; success: boolean; total: number; unread: number }>(url);
  }

  // Team
  async getTeam() {
    return this.request('/api/team');
  }

  async updateTeam(data: any) {
    return this.request('/api/team', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Management
  async getManagement(): Promise<any[]> {
    return this.request<any[]>('/api/management');
  }

  async createManagement(data: any) {
    return this.request('/api/management', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateManagement(id: string, data: any) {
    return this.request(`/api/management/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteManagement(id: string) {
    return this.request(`/api/management/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();

