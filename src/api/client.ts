const TOKEN_KEY = 'linguastep_token';
const USER_KEY = 'linguastep_user';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY) || '',
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  getUser: () => {
    try {
      const u = localStorage.getItem(USER_KEY);
      return u ? JSON.parse(u) : null;
    } catch {
      return null;
    }
  },
  setUser: (u: any) => localStorage.setItem(USER_KEY, JSON.stringify(u))
};

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || json.code >= 400) {
    throw new Error(json.message || '请求失败');
  }

  return json.data;
}

export const api = {
  // Auth
  register: (data: { username: string; email: string; password: string }) =>
    request<{ user: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  login: (data: { identifier: string; password: string }) =>
    request<{ user: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getCurrentUser: () => request<any>('/api/auth/me'),

  // Words
  getTodayWords: (limit = 20) => request<any[]>(`/api/words/today?limit=${limit}`),
  getWordById: (id: string) => request<any>(`/api/words/${id}`),
  getWordPhonics: (id: string) => request<any[]>(`/api/words/${id}/phonics`),
  getWordMeanings: (id: string) => request<any[]>(`/api/words/${id}/meanings`),
  markWordLearned: (id: string) => request<any>(`/api/words/${id}/learn`, { method: 'POST' }),
  checkWordAnswer: (id: string, answer: string, timeSpentSec = 5) =>
    request<{
      isCorrect: boolean;
      userInput: string;
      correctAnswer: string;
      phonetic?: string;
      meanings?: any[];
      progress?: any;
    }>(`/api/words/${id}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer, timeSpentSec })
    }),
  getWrongWords: () => request<any[]>('/api/words/wrong'),

  // Review
  getTodayReview: () => request<any[]>('/api/review/today'),
  submitReview: (id: string, payload: { answer?: string; isCorrect?: boolean }) =>
    request<any>(`/api/review/${id}`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Sentences
  getAllSentences: () => request<any[]>('/api/sentences'),
  getTodaySentences: (limit = 5) => request<any[]>(`/api/sentences/today?limit=${limit}`),
  getSentenceById: (id: string) => request<any>(`/api/sentences/${id}`),
  getSentenceSteps: (id: string) => request<any[]>(`/api/sentences/${id}/steps`),
  completeSentenceStep: (id: string, currentStep: number) =>
    request<any>(`/api/sentences/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ currentStep })
    }),

  // Dictionary Config
  getDictionaryConfig: () => request<any>('/api/dictionary/config'),
  updateDictionaryConfig: (data: any) =>
    request<any>('/api/dictionary/config', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Statistics
  getTodayStatistics: () => request<any>('/api/statistics/today'),
  getOverviewStatistics: () => request<any>('/api/statistics/overview')
};
