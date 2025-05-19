import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Получаем данные из запроса
    const data = await request.json();
    const { url, method, headers = {}, body } = data;
    
    // Логируем запрос для отладки
    console.log('API Proxy Request:', {
      url,
      method,
      hasAuthHeader: !!headers['Authorization'],
      bodyKeys: body ? Object.keys(body) : 'no body'
    });
    
    // Формируем полный URL для запроса к API
    const fullUrl = `http://localhost:8888${url}`;
    
    // Создаем копию заголовков для возможной модификации
    const requestHeaders = { ...headers };
    
    // Если это запрос на регистрацию пользователя, удаляем заголовок авторизации
    if (url === '/users/create') {
      delete requestHeaders['Authorization'];
      console.log('Запрос на регистрацию, удален заголовок авторизации');
    }
    
    // Подробно логируем исходящий запрос
    console.log('Отправка запроса на бэкенд:', {
      url: fullUrl,
      method,
      headers: requestHeaders,
    });
    
    // Отправляем запрос на сервер
    const apiResponse = await fetch(fullUrl, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...requestHeaders
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    // Логируем ответ для отладки
    console.log('API Proxy Response:', {
      url,
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      contentType: apiResponse.headers.get('content-type')
    });
    
    // Проверяем, возвращает ли сервер JSON или текст
    const contentType = apiResponse.headers.get('content-type');
    let responseData;
    
    const responseText = await apiResponse.text();
    console.log('Response text first 100 chars:', responseText.substring(0, 100));
    
    if (contentType && contentType.includes('application/json')) {
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Ошибка при парсинге JSON ответа:', e);
        responseData = { message: responseText, error: 'Error parsing JSON response' };
      }
    } else {
      // Пытаемся распарсить текст как JSON, если возможно
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // Если не получилось распарсить как JSON, возвращаем текст
        responseData = { message: responseText };
      }
    }
    
    // Получаем все заголовки ответа
    const responseHeaders = {};
    apiResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    // Удаляем заголовки, связанные с CORS, чтобы не конфликтовать с заголовками Next.js
    delete responseHeaders['access-control-allow-origin'];
    delete responseHeaders['access-control-allow-methods'];
    delete responseHeaders['access-control-allow-headers'];
    
    // Вернем ответ клиенту
    return NextResponse.json(responseData, {
      status: apiResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('API Proxy Error:', error);
    return NextResponse.json(
      { message: 'Произошла ошибка при обработке запроса', error: error.message },
      { status: 500 }
    );
  }
} 