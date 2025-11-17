import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // URL Backend NestJS của bạn
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động đính kèm Token vào mọi request
apiClient.interceptors.request.use(config => {
  const authStore = useAuthStore();
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`;
  }
  return config;
});

// Interceptor: Xử lý lỗi 401/403
apiClient.interceptors.response.use(
  response => response,
  error => {
  if (error.response?.status === 401) {
  const authStore = useAuthStore();
    authStore.logout(); 
    router.push({ name: 'login' }); 
  }
  return Promise.reject(error);
  }
);

export default apiClient;