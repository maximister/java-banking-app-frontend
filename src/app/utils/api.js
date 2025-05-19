import axios from 'axios';
import config from '../config';

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
  // Отключаем credentials для предотвращения OPTIONS запросов
  withCredentials: false,
});

// Перехватчик запросов для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    // Проверяем наличие localStorage (только на клиенте)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      // Если токен существует, добавляем его к заголовкам запроса
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Перехватчик ответов для обработки ошибок аутентификации
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Если ошибка 401 (неавторизован), очищаем localStorage и перенаправляем на страницу входа
    if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Перенаправляем на страницу входа, если мы находимся в браузере
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 