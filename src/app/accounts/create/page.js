'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import config from '../../config';
import apiProxy from '../../utils/apiProxy';
import Navbar from '../../components/Navbar';

export default function CreateAccount() {
  const [formData, setFormData] = useState({
    type: 'CURRENT', // По умолчанию текущий счет
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Получаем данные пользователя из localStorage
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        throw new Error('Не удалось получить данные пользователя');
      }
      
      const user = JSON.parse(userData);
      
      // Получаем ID клиента из данных пользователя
      const customerId = user.customerId || user.id;
      
      if (!customerId) {
        throw new Error('Не удалось получить ID клиента');
      }
      
      // Формируем запрос в соответствии с требуемой структурой CreateAccountRequest
      const requestData = {
        customerId: customerId,
        initialBalance: 0, // Начальный баланс 0 рублей
        type: 'CURRENT' // Только текущий счет
      };
      
      // Используем apiProxy для отправки запроса на создание счета
      await apiProxy.post('/accounts', requestData);

      // Счет успешно создан
      setSuccess(true);
      
      // Автоматическое перенаправление на страницу счетов через 2 секунды
      setTimeout(() => {
        router.push('/accounts');
      }, 2000);
    } catch (err) {
      console.error('Ошибка при создании счета:', err);
      setError(err.message || 'Произошла ошибка при создании счета. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Получаем иконку для текущего счета
  const getAccountTypeIcon = () => {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    );
  };

  if (loading && !success) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Создание счета...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar />
      <div className="content-wrapper">
        <div className="create-account-container">
          <div className="create-account-header">
            <h1>Открытие нового счета</h1>
            <Link href="/accounts" className="back-button">
              Назад к счетам
            </Link>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success ? (
            <div className="success-message">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2>Счет успешно создан!</h2>
              <p>Вы будете перенаправлены на страницу списка счетов...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="create-account-form">
              <div className="form-group">
                <label>Тип счета</label>
                <div className="account-type-card selected">
                  <div className="account-type-icon">
                    {getAccountTypeIcon()}
                  </div>
                  <div className="account-type-info">
                    <div className="account-type-label">Текущий счет</div>
                    <div className="account-type-description">
                      Счет для повседневных операций и платежей
                    </div>
                  </div>
                </div>
                
                <div className="form-help">
                  <div className="help-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </div>
                  <p>Текущий счет подходит для ежедневного использования, переводов и оплаты услуг.</p>
                </div>
              </div>

              <div className="form-info">
                <div className="info-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <p><strong>Начальный баланс:</strong> 0.00 ₽</p>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="create-button" 
                  disabled={loading}
                >
                  {loading ? 'Создание счета...' : 'Открыть счет'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 0;
          background-color: #f9fafb;
        }
        
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          flex: 1;
        }
        
        .create-account-container {
          width: 100%;
          max-width: 600px;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          padding: 30px;
          margin-bottom: 30px;
        }
        
        .create-account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          border-bottom: 1px solid #f0f0f0;
          padding-bottom: 15px;
        }
        
        .create-account-header h1 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        
        .back-button {
          color: #43A047;
          text-decoration: none;
          display: flex;
          align-items: center;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .back-button:hover {
          color: #2E7D32;
          text-decoration: underline;
        }
        
        .create-account-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .form-group label {
          font-weight: 600;
          color: #444;
          font-size: 1rem;
        }
        
        .account-type-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 2px solid #43A047;
          border-radius: 8px;
          background-color: #f9fff9;
        }
        
        .account-type-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background-color: rgba(67, 160, 71, 0.1);
          padding: 10px;
        }
        
        .account-type-info {
          flex: 1;
        }
        
        .account-type-label {
          font-weight: 600;
          color: #333;
          font-size: 1.1rem;
          margin-bottom: 4px;
        }
        
        .account-type-description {
          color: #666;
          font-size: 0.9rem;
        }
        
        .form-help {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background-color: #f0f9f0;
          padding: 12px;
          border-radius: 8px;
          margin-top: 5px;
        }
        
        .help-icon {
          margin-top: 2px;
        }
        
        .form-help p {
          margin: 0;
          color: #444;
          font-size: 0.9rem;
          line-height: 1.4;
        }
        
        .form-info {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: #f5f5f5;
          padding: 15px;
          border-radius: 8px;
        }
        
        .form-info p {
          margin: 0;
          font-size: 0.95rem;
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 15px;
        }
        
        .create-button {
          background-color: #43A047;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .create-button:hover:not(:disabled) {
          background-color: #388E3C;
          transform: translateY(-2px);
        }
        
        .create-button:disabled {
          background-color: #9E9E9E;
          cursor: not-allowed;
        }
        
        .error-message {
          padding: 15px;
          background-color: #ffebee;
          color: #c62828;
          border-left: 4px solid #c62828;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
        }
        
        .success-icon {
          margin-bottom: 20px;
        }
        
        .success-message h2 {
          color: #43A047;
          margin-bottom: 10px;
        }
        
        .success-message p {
          color: #666;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
        }
        
        .loading-spinner {
          border: 4px solid rgba(67, 160, 71, 0.3);
          border-radius: 50%;
          border-top: 4px solid #43A047;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 640px) {
          .create-account-container {
            padding: 20px;
          }
          
          .create-account-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .form-actions {
            justify-content: center;
          }
          
          .create-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 