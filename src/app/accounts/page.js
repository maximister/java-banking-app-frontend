'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import config from '../config';
import apiProxy from '../utils/apiProxy';
import Navbar from '../components/Navbar';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    // Получение списка счетов клиента
    fetchAccounts();
  }, [router]);

  const fetchAccounts = async () => {
    try {
      // Получаем данные о пользователе из localStorage
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        setError('Не удалось получить данные пользователя. Пожалуйста, войдите заново.');
        return;
      }
      
      const user = JSON.parse(userData);
      
      // Получаем ID клиента (customerId) из данных пользователя
      // Иногда данные пользователя могут содержать прямое поле customerId, 
      // а иногда оно может быть в поле id
      const customerId = user.customerId || user.id;
      
      if (!customerId) {
        console.error('Не удалось получить ID клиента из данных пользователя:', user);
        setError('Не удалось получить ID клиента. Пожалуйста, войдите заново.');
        return;
      }
      
      console.log('Получение счетов для клиента с ID:', customerId);
      
      // Используем правильный эндпоинт для получения счетов по ID клиента
      const data = await apiProxy.get(`/accounts/customer/${customerId}`);
      setAccounts(data);
    } catch (err) {
      console.error('Ошибка при получении счетов:', err);
      setError('Произошла ошибка при загрузке счетов. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Форматирование суммы
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  // Определение статуса счета
  const getStatusLabel = (status) => {
    const statusMap = {
      'ACTIVE': 'Активен',
      'INACTIVE': 'Неактивен',
      'BLOCKED': 'Заблокирован',
      'CLOSED': 'Закрыт'
    };
    return statusMap[status] || status;
  };

  // Определение CSS класса для статуса
  const getStatusClass = (status) => {
    const statusClassMap = {
      'ACTIVE': 'status-active',
      'INACTIVE': 'status-inactive',
      'BLOCKED': 'status-blocked',
      'CLOSED': 'status-closed'
    };
    return statusClassMap[status] || '';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return <div className="loading">Загрузка счетов...</div>;
  }

  return (
    <div className="container">
      <Navbar />
      <div className="accounts-container">
        <div className="accounts-header">
          <h1>Мои счета</h1>
          <div className="header-actions">
            <Link href="/" className="back-button">
              Назад
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="sub-links">
          <span className="sub-link active">Мои счета</span>
          <Link href="/transactions" className="sub-link">История операций</Link>
        </div>

        <div className="accounts-actions">
          <Link href="/accounts/create" className="create-account-button">
            <span className="plus-icon">+</span>
            Открыть новый счет
          </Link>
        </div>

        {accounts.length === 0 ? (
          <div className="no-accounts">
            <div className="empty-state-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M12 9v6M9 12h6" />
              </svg>
            </div>
            <h3>У вас пока нет открытых счетов</h3>
            <p>Чтобы начать пользоваться банковскими услугами, откройте новый счет.</p>
            <Link href="/accounts/create" className="empty-action-button">
              Открыть счет
            </Link>
          </div>
        ) : (
          <div className="accounts-list">
            {accounts.map((account) => (
              <div key={account.id} className="account-card">
                <div className="account-header">
                  <div className="account-number">
                    Счет № {account.id}
                  </div>
                  <div className={`account-status ${getStatusClass(account.status)}`}>
                    {getStatusLabel(account.status)}
                  </div>
                </div>
                <div className="account-balance">
                  <div className="balance-label">Баланс</div>
                  <span className="balance-amount">{formatCurrency(account.balance)}</span>
                </div>
                <div className="account-actions">
                  <Link href={`/accounts/${account.id}`} className="action-button details-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    Подробнее
                  </Link>
                  <Link href={`/transactions/create?accountId=${account.id}&type=deposit`} className="action-button deposit-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
                      <path d="M12 19V5M5 12l7-7 7 7"/>
                    </svg>
                    Пополнить
                  </Link>
                  <Link href={`/transactions/create?accountId=${account.id}`} className="action-button transaction-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="action-icon">
                      <path d="M12 5v14M5 12l7 7 7-7" />
                    </svg>
                    Перевести
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 0;
          background-color: #f9f9f9;
        }
        
        .accounts-container {
          width: 100%;
          max-width: 800px;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #fff;
          margin: 30px auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .accounts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eaeaea;
        }
        
        h1 {
          font-size: 2.2rem;
          margin: 0;
          color: #333;
          font-weight: 700;
        }
        
        .back-button {
          padding: 8px 16px;
          background-color: #43A047;
          color: white;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          border: none;
          box-shadow: 0 2px 4px rgba(67, 160, 71, 0.2);
        }
        
        .back-button:hover {
          background-color: #388E3C;
          box-shadow: 0 4px 8px rgba(67, 160, 71, 0.3);
          transform: translateY(-1px);
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          border-left: 4px solid #c62828;
          font-size: 15px;
        }
        
        .sub-links {
          display: flex;
          margin-bottom: 25px;
          gap: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .sub-link {
          font-size: 16px;
          padding: 8px 12px;
          border-radius: 6px;
          text-decoration: none;
          color: #666;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .sub-link:hover:not(.active) {
          background-color: rgba(67, 160, 71, 0.08);
          color: #43A047;
        }
        
        .sub-link.active {
          color: #43A047;
          background-color: rgba(67, 160, 71, 0.12);
          font-weight: 600;
        }
        
        .accounts-actions {
          margin-bottom: 25px;
          display: flex;
          justify-content: flex-end;
        }
        
        .create-account-button {
          padding: 14px 24px;
          background-color: #43A047;
          color: white;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 6px rgba(67, 160, 71, 0.2);
        }
        
        .create-account-button:hover {
          background-color: #388E3C;
          transform: translateY(-2px);
          box-shadow: 0 6px 10px rgba(67, 160, 71, 0.3);
        }
        
        .plus-icon {
          margin-right: 8px;
          font-size: 20px;
          font-weight: 700;
        }
        
        .no-accounts {
          padding: 40px;
          text-align: center;
          background-color: #f9f9f9;
          border-radius: 12px;
          margin-top: 20px;
          border: 1px dashed #d0d0d0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .empty-state-icon {
          color: #43A047;
          margin-bottom: 16px;
          opacity: 0.7;
        }
        
        .no-accounts h3 {
          margin: 0 0 10px;
          color: #333;
          font-size: 18px;
        }
        
        .no-accounts p {
          margin: 0 0 20px;
          color: #666;
          max-width: 400px;
        }
        
        .empty-action-button {
          padding: 12px 24px;
          background-color: #43A047;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .empty-action-button:hover {
          background-color: #388E3C;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(67, 160, 71, 0.2);
        }
        
        .accounts-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .account-card {
          padding: 25px;
          border-radius: 12px;
          background-color: #fff;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          transition: all 0.3s ease;
          border-left: 5px solid #43A047;
          position: relative;
          overflow: hidden;
        }
        
        .account-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 20px rgba(67, 160, 71, 0.15);
        }
        
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .account-number {
          font-size: 18px;
          font-weight: 600;
          color: #333;
        }
        
        .account-status {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .status-active {
          background-color: rgba(46, 125, 50, 0.12);
          color: #2e7d32;
        }
        
        .status-inactive {
          background-color: rgba(117, 117, 117, 0.12);
          color: #757575;
        }
        
        .status-blocked {
          background-color: rgba(198, 40, 40, 0.12);
          color: #c62828;
        }
        
        .status-closed {
          background-color: rgba(69, 90, 100, 0.12);
          color: #455a64;
        }
        
        .account-balance {
          margin-bottom: 24px;
          text-align: center;
          padding: 16px 0;
          position: relative;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .balance-label {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        .balance-amount {
          font-size: 34px;
          font-weight: 700;
          color: #43A047;
          display: block;
        }
        
        .account-actions {
          display: flex;
          gap: 20px;
          margin-top: 16px;
        }
        
        .action-button {
          padding: 14px 20px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          flex: 1;
          text-align: center;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
          letter-spacing: 0.3px;
        }
        
        .action-icon {
          flex-shrink: 0;
        }
        
        .details-button {
          background-color: #edf2f7;
          color: #2d3748;
          border: 1px solid #e2e8f0;
          font-weight: 600;
        }
        
        .details-button:hover {
          background-color: #e2e8f0;
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
        }
        
        .deposit-button {
          background-color: #43A047;
          color: white;
          border: none;
          font-weight: 600;
        }
        
        .deposit-button:hover {
          background-color: #388E3C;
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(67, 160, 71, 0.35);
        }
        
        .transaction-button {
          background-color: #3182ce;
          color: white;
          border: none;
          font-weight: 600;
        }
        
        .transaction-button:hover {
          background-color: #2b6cb0;
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(49, 130, 206, 0.35);
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 18px;
          color: #43A047;
          flex-direction: column;
        }
        
        .loading:after {
          content: '';
          width: 50px;
          height: 50px;
          border: 3px solid rgba(67, 160, 71, 0.2);
          border-top: 3px solid #43A047;
          border-radius: 50%;
          margin-top: 15px;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .logout-button {
          padding: 8px 16px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(244, 67, 54, 0.2);
        }
        
        .logout-button:hover {
          background-color: #d32f2f;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
        }
        
        @media (max-width: 768px) {
          .accounts-container {
            padding: 20px;
            margin: 20px 0;
          }
          
          .accounts-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .account-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
          
          .account-balance {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
          }
          
          .account-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
} 