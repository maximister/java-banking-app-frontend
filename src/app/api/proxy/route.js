import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { url, method, headers = {}, body } = data;
    
    console.log('API Proxy Request:', {
      url,
      method,
      hasAuthHeader: !!headers['Authorization'],
      bodyKeys: body ? Object.keys(body) : 'no body'
    });
    
    const fullUrl = `http://localhost:8888${url}`;
    
    const requestHeaders = { ...headers };
    
    if (url === '/users/create') {
      delete requestHeaders['Authorization'];
      console.log('Запрос на регистрацию, удален заголовок авторизации');
    }
    
    console.log('Отправка запроса на бэкенд:', {
      url: fullUrl,
      method,
      headers: requestHeaders,
    });
    
    const apiResponse = await fetch(fullUrl, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...requestHeaders
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    console.log('API Proxy Response:', {
      url,
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      contentType: apiResponse.headers.get('content-type')
    });
    
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
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { message: responseText };
      }
    }
    
    const responseHeaders = {};
    apiResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });
    
    delete responseHeaders['access-control-allow-origin'];
    delete responseHeaders['access-control-allow-methods'];
    delete responseHeaders['access-control-allow-headers'];
    
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