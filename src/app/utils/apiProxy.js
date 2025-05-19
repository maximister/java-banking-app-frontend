// Утилита для работы с бэкендом через прокси API роут Next.js
// Это позволяет избежать CORS-проблем и OPTIONS-запросов

/**
 * Отправляет запрос через Next.js API роут вместо прямого обращения к серверу
 * @param {string} url - Путь API (без базового URL)
 * @param {string} method - HTTP метод (GET, POST, PUT, DELETE)
 * @param {object} body - Тело запроса (для POST, PUT)
 * @param {object} headers - Дополнительные заголовки
 * @returns {Promise<any>} - Ответ от сервера
 */
export async function fetchApi(url, method = 'GET', body = null, headers = {}) {
  // Добавляем токен авторизации, если он есть и путь не '/users/create'
  const authHeaders = {};
  if (typeof window !== 'undefined' && url !== '/users/create' && url !== '/authentication/login') {
    const token = localStorage.getItem('token');
    if (token) {
      authHeaders['Authorization'] = `Bearer ${token}`;
      console.log('Добавлен заголовок авторизации:', `Bearer ${token.substring(0, 10)}...`);
    } else {
      console.warn('Токен не найден в localStorage для запроса:', url);
    }
  }
  
  console.log('API Proxy запрос:', { 
    url, 
    method, 
    hasAuthHeader: !!authHeaders['Authorization'] 
  });
  
  try {
    const response = await fetch('/api/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        method,
        headers: {
          ...authHeaders,
          ...headers
        },
        body
      })
    });
    
    const text = await response.text();
    let data;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Ошибка при парсинге ответа как JSON:', text);
      throw new Error('Некорректный ответ от сервера');
    }
    
    console.log('API Proxy ответ:', {
      status: response.status,
      url: url,
      data: data
    });
    
    // Проверяем на ошибку авторизации
    if (response.status === 401 && typeof window !== 'undefined') {
      console.error('Ошибка авторизации 401, перенаправление на страницу входа');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login?reason=auth_failed';
      throw new Error('Unauthorized');
    }
    
    if (!response.ok) {
      throw new Error(data.message || 'Произошла ошибка при обработке запроса');
    }
    
    return data;
  } catch (error) {
    console.error('API Proxy Error:', error);
    throw error;
  }
}

// Обертки для удобного использования разных HTTP методов
export const apiProxy = {
  get: (url, headers = {}) => fetchApi(url, 'GET', null, headers),
  post: (url, body, headers = {}) => fetchApi(url, 'POST', body, headers),
  put: (url, body, headers = {}) => fetchApi(url, 'PUT', body, headers),
  delete: (url, headers = {}) => fetchApi(url, 'DELETE', null, headers)
};

export default apiProxy; 