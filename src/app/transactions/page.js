'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../utils/apiProxy';
import Navbar from '../components/Navbar';

export default function TransactionsHistory() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState({});
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

    // Загрузка данных
    fetchUserTransactions();
  }, [router]);

  const fetchUserTransactions = async () => {
    setLoading(true);
    try {
      // Получаем данные о пользователе из localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const customerId = user.customerId || user.id;
      
      if (!customerId) {
        console.error('Не удалось получить ID клиента');
        setError('Не удалось получить данные пользователя');
        setLoading(false);
        return;
      }
      
      // Получаем все счета пользователя
      const userAccounts = await apiProxy.get(`/accounts/customer/${customerId}`);
      
      if (!userAccounts || userAccounts.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      
      // Создаем объект для быстрого доступа к данным счетов
      const accountsMap = userAccounts.reduce((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});
      
      setAccounts(accountsMap);

      // Параллельно запрашиваем транзакции для всех счетов
      const transactionsPromises = userAccounts.map(account => 
        apiProxy.get(`/transactions/account/${account.id}`)
          .catch(err => {
            console.warn(`Ошибка при загрузке транзакций для счета ${account.id}:`, err);
            return []; // Возвращаем пустой массив в случае ошибки
          })
      );
      
      // Ждем выполнения всех запросов
      const transactionsResults = await Promise.all(transactionsPromises);
      
      // Объединяем все транзакции в один массив
      let allTransactions = [];
      transactionsResults.forEach(result => {
        if (Array.isArray(result)) {
          allTransactions = [...allTransactions, ...result];
        }
      });
      
      // Сортируем по дате (от новых к старым)
      allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Ошибка при получении транзакций:', err);
      setError('Произошла ошибка при загрузке истории транзакций');
    } finally {
      setLoading(false);
    }
  };

  // Форматирование суммы
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  // Форматирование даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Форматирование типа транзакции
  const getTransactionTypeLabel = (type) => {
    const typeMap = {
      'DEPOSIT': 'Пополнение',
      'WITHDRAWAL': 'Снятие',
      'TRANSFER': 'Перевод',
      'TRANSFER_IN': 'Пополнение',
      'TRANSFER_OUT': 'Перевод'
    };
    return typeMap[type] || 'Операция';
  };

  // Определение иконки для транзакции
  const getTransactionIcon = (type) => {
    switch(type) {
      case 'DEPOSIT':
      case 'TRANSFER_IN':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        );
      case 'WITHDRAWAL':
      case 'TRANSFER_OUT':
      case 'TRANSFER':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7"/>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        );
    }
  };

  // Определение стиля суммы
  const getAmountStyleClass = (type) => {
    const positiveTypes = ['DEPOSIT', 'TRANSFER_IN'];
    return positiveTypes.includes(type) ? 'amount-positive' : 'amount-negative';
  };

  // Определение знака суммы
  const getAmountSign = (type) => {
    const positiveTypes = ['DEPOSIT', 'TRANSFER_IN'];
    return positiveTypes.includes(type) ? '+ ' : '- ';
  };

  // Получение дополнительной информации по транзакции
  const getTransactionInfo = (transaction) => {
    if (transaction.type === 'TRANSFER') {
      const sourceAccount = accounts[transaction.sourceAccountId] 
        ? `№ ${transaction.sourceAccountId}` 
        : 'Неизвестный счет';
        
      const targetAccount = accounts[transaction.targetAccountId] 
        ? `№ ${transaction.targetAccountId}` 
        : 'Неизвестный счет';
        
      return `Из ${sourceAccount} на ${targetAccount}`;
    } else if (transaction.type === 'TRANSFER_OUT') {
      return `Со счета № ${transaction.accountId}`;
    } else if (transaction.type === 'TRANSFER_IN') {
      return `На счет № ${transaction.accountId}`;
    } else if (transaction.accountId) {
      return `Счет № ${transaction.accountId}`;
    }
    return '';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка истории транзакций...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar />
      <div className="content-wrapper">
        <div className="transactions-container">
          <div className="transactions-header">
            <h1>История операций</h1>
            <div className="header-actions">
              <Link href="/" className="back-button">
                Назад
              </Link>
            </div>
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="nav-tabs">
            <Link href="/accounts" className="nav-tab">
              Счета
            </Link>
            <Link href="/cards" className="nav-tab">
              Карты
            </Link>
            <span className="nav-tab active">История операций</span>
          </div>
          
          {transactions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <h3>История операций пуста</h3>
              {Object.keys(accounts).length > 0 ? (
                <p>Для совершения операций воспользуйтесь функциями пополнения или перевода средств</p>
              ) : (
                <p>Для начала работы откройте счет в разделе "Счета"</p>
              )}
              <Link href="/accounts" className="primary-button">
                Перейти к счетам
              </Link>
            </div>
          ) : (
            <>
              <div className="transactions-summary">
                <span className="transactions-count">{transactions.length} операций</span>
              </div>
              <div className="transactions-list">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      <div className={`icon-wrapper ${getAmountStyleClass(transaction.type)}`}>
                        {getTransactionIcon(transaction.type)}
                      </div>
                    </div>
                    <div className="transaction-content">
                      <div className="transaction-left">
                        <div className="transaction-type">
                          {getTransactionTypeLabel(transaction.type)}
                        </div>
                        <div className="transaction-account-info">
                          {getTransactionInfo(transaction)}
                        </div>
                        <div className="transaction-date">
                          {formatDate(transaction.timestamp)}
                        </div>
                      </div>
                      <div className="transaction-right">
                        <div className="transaction-description">
                          {transaction.description || 'Без описания'}
                        </div>
                        <div className={`transaction-amount ${getAmountStyleClass(transaction.type)}`}>
                          {getAmountSign(transaction.type)}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
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
        
        .transactions-container {
          width: 100%;
          max-width: 900px;
          padding: 24px;
          border-radius: 16px;
          background-color: #fff;
          margin: 20px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .transactions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        h1 {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          color: #2d3748;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
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
          border: none;
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
        }
        
        .nav-tabs {
          display: flex;
          gap: 16px;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 24px;
          padding-bottom: 8px;
        }
        
        .nav-tab {
          padding: 8px 16px;
          color: #6b7280;
          text-decoration: none;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s;
          border-radius: 6px 6px 0 0;
        }
        
        .nav-tab:hover:not(.active) {
          color: #43A047;
          background-color: #f0fdf4;
        }
        
        .nav-tab.active {
          color: #43A047;
          border-bottom: 3px solid #43A047;
          font-weight: 600;
        }
        
        .transactions-summary {
          margin-bottom: 16px;
          padding: 0 8px;
        }
        
        .transactions-count {
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 48px 24px;
          text-align: center;
          background-color: #f9fafb;
          border-radius: 12px;
          margin: 24px 0;
        }
        
        .empty-icon {
          margin-bottom: 24px;
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #ecfdf5;
          border-radius: 50%;
          padding: 16px;
        }
        
        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 12px;
          color: #374151;
        }
        
        .empty-state p {
          color: #6b7280;
          margin: 0 0 24px;
          max-width: 400px;
        }
        
        .primary-button {
          padding: 12px 24px;
          background-color: #43A047;
          color: white;
          border-radius: 8px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
          border: none;
          box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);
        }
        
        .primary-button:hover {
          background-color: #388E3C;
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
          transform: translateY(-2px);
        }
        
        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .transaction-item {
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
          background-color: #fff;
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .transaction-item:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-color: #d1d5db;
        }
        
        .transaction-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 16px;
          color: white;
        }
        
        .icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .icon-wrapper.amount-positive {
          background-color: #43A047;
        }
        
        .icon-wrapper.amount-negative {
          background-color: #f87171;
        }
        
        .transaction-content {
          flex: 1;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-left: 1px solid #e5e7eb;
        }
        
        .transaction-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .transaction-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        
        .transaction-type {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }
        
        .transaction-account-info {
          font-size: 14px;
          color: #4b5563;
        }
        
        .transaction-date {
          font-size: 13px;
          color: #6b7280;
        }
        
        .transaction-description {
          font-size: 14px;
          color: #4b5563;
          text-align: right;
        }
        
        .transaction-amount {
          font-size: 16px;
          font-weight: 600;
        }
        
        .amount-positive {
          color: #43A047;
        }
        
        .amount-negative {
          color: #ef4444;
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
          .transactions-container {
            padding: 16px;
            margin: 16px 0;
            border-radius: 12px;
          }
          
          .transactions-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .transaction-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          
          .transaction-right {
            align-items: flex-start;
            width: 100%;
          }
          
          .transaction-description {
            text-align: left;
          }
          
          .nav-tabs {
            overflow-x: auto;
            padding-bottom: 12px;
            margin-bottom: 16px;
          }
          
          .transaction-item {
            flex-direction: column;
          }
          
          .transaction-icon {
            padding: 16px 0 0 16px;
          }
        }
      `}</style>
    </div>
  );
} 