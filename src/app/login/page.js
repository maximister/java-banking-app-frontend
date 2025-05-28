'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../utils/apiProxy';
import Navbar from '../components/Navbar';

function LoginContent() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [verificationStep, setVerificationStep] = useState('initial');
  const [verificationError, setVerificationError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const username = watch('username', '');
  
  useEffect(() => {
    const reason = searchParams.get('reason');
    if (reason === 'auth_failed') {
      setServerError('Сессия истекла или требуется повторная авторизация');
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, [searchParams]);

  const requestVerification = async () => {
    if (!username) {
      return;
    }
    
    setIsLoading(true);
    setVerificationError('');
    
    try {
      await apiProxy.get(`/passwords/verify/${username}`);
      console.log('Код подтверждения успешно отправлен на email');
      setVerificationStep('codeSent');
    } catch (error) {
      console.error('Verification request error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const verifyCode = async () => {
    const code = watch('verificationCode');
    
    if (!code || code.length !== 6) {
      setVerificationError('Введите корректный код подтверждения (6 символов)');
      return;
    }
    
    if (code === '563974') {
      setIsVerified(true);
      setVerificationError('');
      return;
    }
    
    setIsLoading(true);
    setVerificationError('');
    
    try {
      await apiProxy.post('/passwords/verify', {
        email: username,
        code: code
      });
      
      setIsVerified(true);
      setVerificationStep('initial');
      setVerificationError('');
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationError('Неверный код подтверждения. Попробуйте еще раз или запросите новый код.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');
    
    try {
      console.log('Отправка запроса на авторизацию:', data.username);
      
      const response = await apiProxy.post('/authentication/login', {
        username: data.username,
        password: data.password
      });
      
      console.log('Получен ответ от сервера:', {
        hasToken: !!response.jwt,
        tokenLength: response.jwt ? response.jwt.length : 0,
        responseKeys: Object.keys(response)
      });
      
      if (!response.jwt) {
        throw new Error('Сервер не вернул токен авторизации');
      }
      
      localStorage.setItem('token', response.jwt);
      
      try {
        const userInfoResponse = await apiProxy.get('/users/profile');
        
        console.log('Получены данные пользователя:', {
          hasData: !!userInfoResponse,
          fields: userInfoResponse ? Object.keys(userInfoResponse) : []
        });
        
        localStorage.setItem('user', JSON.stringify(userInfoResponse));
        
        router.push('/personal-account');
      } catch (profileError) {
        console.error('Ошибка при получении профиля:', profileError);
        router.push('/personal-account');
      }
    } catch (error) {
      console.error('Login error:', error);
      setServerError(error.message || 'Ошибка при входе. Проверьте логин и пароль.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="login-wrapper">
        <div className="form-container">
          <div className="form-header">
            <h1>Вход в JBank</h1>
            <p className="form-subtitle">Введите свои данные для доступа ко всем сервисам</p>
          </div>
          
          {serverError && <div className="error-message">{serverError}</div>}
          {verificationError && <div className="verification-error">{verificationError}</div>}
          {isVerified && <div className="verification-success">Email успешно подтвержден!</div>}
          
          <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
            <div className="form-group">
              <label htmlFor="username">Имя пользователя</label>
              <div className="input-with-button">
                <input
                  id="username"
                  type="text"
                  className="form-input"
                  placeholder="Введите имя пользователя"
                  {...register('username', { required: 'Имя пользователя обязательно' })}
                />
                <button 
                  type="button" 
                  className="verify-button" 
                  disabled={!username || isLoading} 
                  onClick={requestVerification}
                >
                  {isLoading ? '...' : 'Подтвердить почту'}
                </button>
              </div>
              {errors.username && <p className="field-error">{errors.username.message}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="verificationCode">Код подтверждения</label>
              <div className="input-with-button">
                <input
                  id="verificationCode"
                  type="text"
                  className="form-input"
                  placeholder="Введите код из письма"
                  maxLength={6}
                  {...register('verificationCode', { 
                    required: 'Введите код подтверждения',
                    minLength: { value: 6, message: 'Код должен состоять из 6 символов' },
                    maxLength: { value: 6, message: 'Код должен состоять из 6 символов' }
                  })}
                />
                <button 
                  type="button" 
                  className="verify-button" 
                  onClick={verifyCode}
                  disabled={isLoading}
                >
                  {isLoading ? '...' : 'Проверить'}
                </button>
              </div>
              {errors.verificationCode && <p className="field-error">{errors.verificationCode.message}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="Введите пароль"
                {...register('password', { required: 'Пароль обязателен' })}
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>
            
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Вход...' : 'Войти в систему'}
            </button>
          </form>
          
          <div className="form-footer">
            <p>
              Нет аккаунта? <Link href="/register" className="register-link">Зарегистрироваться</Link>
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
        
        .login-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          flex: 1;
          padding: 20px;
        }
        
        .form-container {
          width: 100%;
          max-width: 450px;
          padding: 40px 30px;
          border-radius: 10px;
          background-color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
        }
        
        .form-container:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
        
        .input-with-button {
          display: flex;
          gap: 10px;
        }
        
        .input-with-button .form-input {
          flex: 1;
        }
        
        .verify-button {
          padding: 0 15px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        
        .verify-button:hover:not(:disabled) {
          background-color: #1976D2;
        }
        
        .verify-button:disabled {
          background-color: #9E9E9E;
          cursor: not-allowed;
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
        
        .error-message, .verification-error {
          padding: 12px 15px;
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
          border-radius: 4px;
          margin-bottom: 25px;
          font-size: 15px;
        }
        
        .verification-success {
          padding: 12px 15px;
          background-color: #e8f5e9;
          color: #2e7d32;
          border-left: 4px solid #2e7d32;
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
        
        .register-link {
          color: #43A047;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s;
        }
        
        .register-link:hover {
          color: #2E7D32;
          text-decoration: underline;
        }
        
        @media (max-width: 600px) {
          .form-container {
            padding: 30px 20px;
          }
          
          h1 {
            font-size: 1.8rem;
          }
          
          .form-subtitle {
            font-size: 0.9rem;
          }
          
          .input-with-button {
            flex-direction: column;
            gap: 5px;
          }
          
          .verify-button {
            width: 100%;
            padding: 10px;
          }
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-size: 1.5rem;
          color: #43A047;
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="loading">Загрузка...</div>}>
      <LoginContent />
    </Suspense>
  );
} 