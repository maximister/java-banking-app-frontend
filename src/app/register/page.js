'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../utils/apiProxy';
import Navbar from '../components/Navbar';

export default function Register() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const router = useRouter();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    
    try {
      // Форматируем данные в соответствии с требованиями бэкенда
      const formattedData = {
        // Исправляем имена полей в соответствии с серверной моделью
        firstname: data.firstName,
        lastname: data.lastName,
        dateOfBirth: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : null,
        email: data.email,
        username: data.username,
        password: data.password,
        // Добавляем дополнительные поля для бэкенда
        active: true,
        enabled: true,
        roles: ["USER"]
      };
      
      // Удаляем поле подтверждения пароля, оно не нужно на бэкенде
      delete formattedData.passwordConfirm;
      
      console.log('Отправляемые данные для создания пользователя:', formattedData);
      
      // 1. Регистрируем пользователя
      const userResponse = await apiProxy.post('/users/create', formattedData);
      console.log('Пользователь успешно создан:', userResponse);
      
      // 2. Выполняем авторизацию после регистрации пользователя
      const loginResponse = await apiProxy.post('/authentication/login', {
        username: data.username,
        password: data.password
      });
      
      console.log('Авторизация успешна:', {
        hasToken: !!loginResponse.jwt,
        tokenLength: loginResponse.jwt ? loginResponse.jwt.length : 0,
        responseKeys: Object.keys(loginResponse)
      });
      
      // Проверяем наличие токена в ответе (поле jwt, а не token)
      if (!loginResponse.jwt) {
        throw new Error('Не удалось получить токен авторизации после регистрации');
      }
      
      // Сохраняем токен авторизации
      localStorage.setItem('token', loginResponse.jwt);
      
      // 3. Создаем клиента - привязываем пользователя к клиентской записи
      // Готовим данные для создания клиента в соответствии с контрактом бэкенда
      const clientData = {
        firstname: data.firstName,
        lastname: data.lastName,
        email: data.email,
        dateOfBirth: data.birthDate ? data.birthDate : new Date().toISOString().split('T')[0]
      };
      
      console.log('Отправляемые данные для создания клиента:', clientData);
      
      try {
        // Отправляем запрос в клиентский сервис на правильный URL (/customers/create)
        const clientResponse = await apiProxy.post('/customers/create', clientData);
        console.log('Клиент успешно создан:', clientResponse);
      } catch (clientError) {
        console.error('Ошибка при создании клиента:', clientError);
        // Не выбрасываем ошибку, так как пользователь уже создан и авторизован
      }
      
      // 4. Получаем информацию о профиле пользователя
      try {
        const profileResponse = await apiProxy.get('/users/profile');
        console.log('Профиль пользователя получен:', profileResponse);
        // Сохраняем данные пользователя
        localStorage.setItem('user', JSON.stringify(profileResponse));
      } catch (profileError) {
        console.error('Ошибка при получении профиля:', profileError);
        // Если не удалось получить профиль, сохраняем базовую информацию
        localStorage.setItem('user', JSON.stringify({ 
          firstname: data.firstName,
          lastname: data.lastName,
          email: data.email,
          username: data.username,
          dateOfBirth: data.birthDate
        }));
      }
      
      // Перенаправляем на страницу личного кабинета
      router.push('/personal-account');
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(error.message || 'Ошибка при регистрации. Пожалуйста, попробуйте позже.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="register-wrapper">
        <div className="form-container">
          <div className="form-header">
            <h1>Регистрация в JBank</h1>
            <p className="form-subtitle">Создайте аккаунт для доступа к банковским услугам</p>
          </div>
          
          {serverError && <div className="error-message">{serverError}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Имя*</label>
                <input
                  id="firstName"
                  type="text"
                  className="form-input"
                  placeholder="Ваше имя"
                  {...register('firstName', { required: 'Имя обязательно' })}
                />
                {errors.firstName && <p className="field-error">{errors.firstName.message}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Фамилия*</label>
                <input
                  id="lastName"
                  type="text"
                  className="form-input"
                  placeholder="Ваша фамилия"
                  {...register('lastName', { required: 'Фамилия обязательна' })}
                />
                {errors.lastName && <p className="field-error">{errors.lastName.message}</p>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="username">Имя пользователя*</label>
              <input
                id="username"
                type="text"
                className="form-input"
                placeholder="Придумайте имя пользователя"
                {...register('username', { required: 'Имя пользователя обязательно' })}
              />
              {errors.username && <p className="field-error">{errors.username.message}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="example@email.com"
                {...register('email', { 
                  required: 'Email обязателен',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Некорректный email'
                  }
                })}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Пароль*</label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  placeholder="Минимум 6 символов"
                  {...register('password', { 
                    required: 'Пароль обязателен',
                    minLength: {
                      value: 6,
                      message: 'Пароль должен содержать минимум 6 символов'
                    }
                  })}
                />
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>
              
              <div className="form-group">
                <label htmlFor="passwordConfirm">Подтверждение пароля*</label>
                <input
                  id="passwordConfirm"
                  type="password"
                  className="form-input"
                  placeholder="Повторите пароль"
                  {...register('passwordConfirm', { 
                    required: 'Подтверждение пароля обязательно',
                    validate: value => value === watch('password') || 'Пароли не совпадают'
                  })}
                />
                {errors.passwordConfirm && <p className="field-error">{errors.passwordConfirm.message}</p>}
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="birthDate">Дата рождения*</label>
              <input
                id="birthDate"
                type="date"
                className="form-input"
                {...register('birthDate', { required: 'Дата рождения обязательна' })}
              />
              {errors.birthDate && <p className="field-error">{errors.birthDate.message}</p>}
            </div>
            
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </form>
          
          <div className="form-footer">
            <p>
              Уже есть аккаунт? <Link href="/login" className="login-link">Войти</Link>
            </p>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 0;
          background-color: #f9f9f9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .register-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          padding: 20px;
        }
        
        .form-container {
          width: 100%;
          max-width: 600px;
          padding: 40px 30px;
          border-radius: 10px;
          background-color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
          margin: 30px 0;
        }
        
        .form-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        h1 {
          font-size: 2.2rem;
          margin-bottom: 10px;
          color: #43A047;
          font-weight: 700;
        }
        
        .form-subtitle {
          color: #666;
          font-size: 1rem;
        }
        
        .auth-form {
          margin-bottom: 25px;
        }
        
        .form-row {
          display: flex;
          gap: 15px;
          margin-bottom: 0;
        }
        
        .form-row .form-group {
          flex: 1;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #444;
        }
        
        .form-input {
          width: 100%;
          padding: 12px 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .form-input:focus {
          border-color: #43A047;
          box-shadow: 0 0 0 2px rgba(67, 160, 71, 0.2);
          outline: none;
        }
        
        .submit-button {
          width: 100%;
          padding: 14px;
          background-color: #43A047;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 10px;
        }
        
        .submit-button:hover:not(:disabled) {
          background-color: #388E3C;
          box-shadow: 0 4px 8px rgba(67, 160, 71, 0.3);
          transform: translateY(-2px);
        }
        
        .submit-button:disabled {
          background-color: #9E9E9E;
          cursor: not-allowed;
        }
        
        .field-error {
          color: #e53935;
          margin-top: 6px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .error-message {
          padding: 12px 15px;
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
          border-radius: 4px;
          margin-bottom: 25px;
          font-size: 15px;
        }
        
        .form-footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eaeaea;
          color: #666;
        }
        
        .login-link {
          color: #43A047;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        
        .login-link:hover {
          color: #2E7D32;
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .form-row {
            flex-direction: column;
            gap: 0;
          }
          
          .form-container {
            padding: 30px 25px;
          }
          
          h1 {
            font-size: 1.8rem;
          }
          
          .form-subtitle {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
} 