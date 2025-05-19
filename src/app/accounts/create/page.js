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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

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
        type: formData.type // Тип счета: CURRENT, SAVINGS, FIXED_DEPOSIT или LOAN
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

  // Типы счетов для выбора в соответствии с AccountType на бэкенде
  const accountTypes = [
    { value: 'CURRENT', label: 'Текущий счет' },
    { value: 'SAVINGS', label: 'Сберегательный счет' },
    { value: 'FIXED_DEPOSIT', label: 'Депозитный счет' },
    { value: 'LOAN', label: 'Кредитный счет' }
  ];

  const getAccountTypeIcon = (type) => {
    switch(type) {
      case 'CURRENT':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        );
      case 'SAVINGS':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2 0-.3-.5-1-1-1Z" />
            <path d="M2 9v1c0 1.1.9 2 2 2h1" />
            <path d="M16 19h3v3" />
          </svg>
        );
      case 'FIXED_DEPOSIT':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M12 14v-3" />
            <path d="M9 11h6" />
            <path d="M18 9h.01" />
          </svg>
        );
      case 'LOAN':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 5H2v7" />
            <path d="M2 5l5.586 5.586" />
            <path d="M22 19h-7v-7" />
            <path d="M22 19l-5.586-5.586" />
          </svg>
        );
      default:
        return null;
    }
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
                <label htmlFor="type">Тип счета</label>
                <div className="account-type-selector">
                  {accountTypes.map((type) => (
                    <div 
                      key={type.value} 
                      className={`account-type-option ${formData.type === type.value ? 'selected' : ''}`}
                      onClick={() => setFormData({...formData, type: type.value})}
                    >
                      <div className="account-type-icon">
                        {getAccountTypeIcon(type.value)}
                      </div>
                      <div className="account-type-label">{type.label}</div>
                    </div>
                  ))}
                </div>
                <div className="form-help">
                  <div className="help-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                  </div>
                  <p>
                    {formData.type === 'CURRENT' && 'Текущий счет для повседневных операций и платежей.'}
                    {formData.type === 'SAVINGS' && 'Сберегательный счет с начислением процентов на остаток.'}
                    {formData.type === 'FIXED_DEPOSIT' && 'Депозитный счет с фиксированной процентной ставкой на определенный срок.'}
                    {formData.type === 'LOAN' && 'Кредитный счет с возможностью использования заемных средств.'}
                  </p>
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
          max-width: 650px;
          padding: 30px;
          border-radius: 16px;
          background-color: #fff;
          margin: 20px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .create-account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 15px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #2d3748;
        }
        
        .back-button {
          padding: 10px 20px;
          background-color: #43A047;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);
        }
        
        .back-button:hover {
          background-color: #388E3C;
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
          transform: translateY(-2px);
        }
        
        .error-message {
          background-color: #fef2f2;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border-left: 4px solid #dc2626;
          font-weight: 500;
          display: flex;
          align-items: center;
        }
        
        .success-message {
          background-color: #ecfdf5;
          color: #047857;
          padding: 30px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          border: 1px solid #a7f3d0;
        }
        
        .success-icon {
          margin-bottom: 16px;
        }
        
        .success-message h2 {
          margin-top: 8px;
          margin-bottom: 12px;
          color: #047857;
          font-size: 24px;
          font-weight: 700;
        }
        
        .success-message p {
          color: #059669;
          font-size: 16px;
        }
        
        .create-account-form {
          margin-top: 24px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        .account-type-selector {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 16px;
        }
        
        .account-type-option {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        
        .account-type-option:hover {
          border-color: #a7f3d0;
          background-color: #f0fdf4;
        }
        
        .account-type-option.selected {
          border-color: #43A047;
          background-color: #f0fdf4;
        }
        
        .account-type-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 50px;
          height: 50px;
          background-color: #ecfdf5;
          border-radius: 50%;
        }
        
        .account-type-label {
          font-weight: 600;
          color: #374151;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2d3748;
          font-size: 16px;
        }
        
        .form-help {
          margin-top: 16px;
          padding: 12px 16px;
          background-color: #f0fdf4;
          border-radius: 8px;
          font-size: 14px;
          color: #374151;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        
        .help-icon {
          margin-top: 2px;
          flex-shrink: 0;
        }
        
        .form-actions {
          margin-top: 32px;
        }
        
        .create-button {
          width: 100%;
          padding: 16px;
          background-color: #43A047;
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(67, 160, 71, 0.2);
        }
        
        .create-button:hover {
          background-color: #388E3C;
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(67, 160, 71, 0.25);
        }
        
        .create-button:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .form-info {
          background-color: #f3f4f6;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 4px solid #9ca3af;
        }
        
        .form-info p {
          margin: 0;
          color: #4b5563;
          font-size: 15px;
        }
        
        .info-icon {
          color: #6b7280;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          gap: 16px;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(67, 160, 71, 0.2);
          border-left-color: #43A047;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .create-account-container {
            padding: 20px;
            margin: 16px 0;
          }
          
          .create-account-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .account-type-selector {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
} 