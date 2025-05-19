'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { use } from 'react';
import apiProxy from '../../../utils/apiProxy';

export default function ConfirmTransactionPage({ params }) {
  const token = use(params).token;
  const router = useRouter();
  
  const [transactionData, setTransactionData] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Проверяем авторизацию
    const authToken = localStorage.getItem('token');
    
    if (!authToken) {
      // Сохраняем текущий URL для возврата после авторизации
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      router.push('/login?reason=auth_required');
      return;
    }
    
    if (!token) {
      setError('Недействительная ссылка');
      setLoading(false);
      return;
    }
    
    // Декодируем параметры из токена
    try {
      // Декодируем из base64 в строку с поддержкой Unicode
      // Обратный процесс кодированию: 
      // сначала atob для декодирования base64
      // затем decodeURIComponent для преобразования %xx последовательностей в символы
      const jsonStr = decodeURIComponent(escape(atob(token)));
      const data = JSON.parse(jsonStr);
      
      if (!data.accountId || !data.amount) {
        throw new Error('Отсутствуют обязательные параметры');
      }
      
      // Загружаем данные счета отправителя
      fetchAccountData(data.accountId, data);
    } catch (e) {
      console.error('Ошибка при декодировании параметров:', e);
      setError('Некорректная ссылка для перевода');
      setLoading(false);
    }
  }, [token, router]);

  const fetchAccountData = async (accountId, data) => {
    try {
      const accountData = await apiProxy.get(`/accounts/${accountId}`);
      setAccount(accountData);
      setTransactionData(data);
    } catch (err) {
      console.error('Ошибка при получении данных счета:', err);
      setError('Не удалось загрузить данные счета. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    
    try {
      // Проверяем достаточно ли средств
      if (parseFloat(transactionData.amount) > account.balance) {
        throw new Error('Недостаточно средств на счете');
      }
      
      // Создаем транзакцию типа TRANSFER_OUT для перевода в другой банк
      const transaction = {
        accountId: transactionData.accountId,
        amount: parseFloat(transactionData.amount),
        type: 'TRANSFER_OUT',
        description: transactionData.description || 'Перевод в другой банк'
      };
      
      await apiProxy.post('/transactions', transaction);
      
      setSuccess(true);
      // Перенаправляем на счет через 3 секунды после успешной транзакции
      setTimeout(() => {
        router.push(`/accounts/${transactionData.accountId}`);
      }, 3000);
    } catch (err) {
      console.error('Ошибка при выполнении транзакции:', err);
      setError(err.message || 'Произошла ошибка при обработке операции. Пожалуйста, попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  if (loading) {
    return <div className="loading">Загрузка информации о транзакции...</div>;
  }

  if (error) {
    return (
      <div className="container">
        <div className="error-container">
          <h2>Ошибка</h2>
          <p>{error}</p>
          <Link href="/accounts" className="back-button">
            Вернуться к счетам
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="confirm-transaction-container">
        <div className="transaction-header">
          <h1>Подтверждение перевода</h1>
          <div className="header-actions">
            <Link href="/accounts" className="back-button">
              К счетам
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </div>

        {success ? (
          <div className="success-message">
            <h2>Перевод успешно выполнен!</h2>
            <p>Вы будете перенаправлены на страницу счета...</p>
          </div>
        ) : (
          <>
            <div className="transaction-details">
              <h2>Детали операции</h2>
              
              <div className="detail-row">
                <span className="detail-label">Счет отправителя</span>
                <span className="detail-value">№ {account?.id}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Сумма перевода</span>
                <span className="detail-value">{formatCurrency(transactionData?.amount)}</span>
              </div>
              
              {transactionData?.description && (
                <div className="detail-row">
                  <span className="detail-label">Назначение платежа</span>
                  <span className="detail-value">{transactionData.description}</span>
                </div>
              )}
              
              {transactionData?.bankDetails && (
                <div className="detail-row">
                  <span className="detail-label">Реквизиты получателя</span>
                  <span className="detail-value">{transactionData.bankDetails}</span>
                </div>
              )}
              
              <div className="detail-row balance-row">
                <span className="detail-label">Доступно на счете</span>
                <span className="detail-value">{formatCurrency(account?.balance)}</span>
              </div>
            </div>
            
            <div className="transaction-actions">
              <div className="action-info">
                {account && parseFloat(transactionData?.amount) > account.balance ? (
                  <div className="error-message">
                    Недостаточно средств на счете для выполнения операции
                  </div>
                ) : (
                  <p>Нажмите кнопку "Подтвердить", чтобы выполнить перевод.</p>
                )}
              </div>
              
              <div className="action-buttons">
                <Link href={`/accounts/${transactionData?.accountId}`} className="cancel-button">
                  Отмена
                </Link>
                <button 
                  className="confirm-button" 
                  onClick={handleSubmit} 
                  disabled={submitting || (account && parseFloat(transactionData?.amount) > account.balance)}
                >
                  {submitting ? 'Выполнение...' : 'Подтвердить'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          min-height: 100vh;
          padding: 20px;
          background-color: #f9f9f9;
        }
        
        .confirm-transaction-container {
          width: 100%;
          max-width: 600px;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #fff;
          margin: 50px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .error-container {
          width: 100%;
          max-width: 600px;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #fff;
          margin: 50px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          text-align: center;
        }
        
        .transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eaeaea;
        }
        
        h1 {
          font-size: 1.8rem;
          margin: 0;
          color: #333;
        }
        
        h2 {
          font-size: 1.4rem;
          margin: 0 0 20px;
          color: #444;
          padding-left: 10px;
          border-left: 4px solid #0070f3;
        }
        
        .header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        
        .back-button {
          padding: 8px 16px;
          background-color: #f5f7fa;
          color: #333;
          border-radius: 6px;
          text-decoration: none;
          font-size: 14px;
          transition: background-color 0.2s;
          border: 1px solid #e0e0e0;
        }
        
        .back-button:hover {
          background-color: #eaeef2;
        }
        
        .logout-button {
          padding: 8px 16px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .logout-button:hover {
          background-color: #d32f2f;
        }
        
        .success-message {
          background-color: #e8f5e9;
          color: #2e7d32;
          padding: 30px;
          border-radius: 8px;
          margin: 20px 0;
          text-align: center;
          border-left: 4px solid #2e7d32;
        }
        
        .success-message h2 {
          margin-top: 0;
          color: #2e7d32;
          border-left: none;
          padding-left: 0;
        }
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #c62828;
        }
        
        .transaction-details {
          background-color: #f5f7fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #eee;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .balance-row {
          margin-top: 10px;
          padding-top: 15px;
          border-top: 2px dashed #ddd;
          font-weight: 600;
        }
        
        .detail-label {
          color: #666;
          font-size: 14px;
        }
        
        .detail-value {
          color: #333;
          font-size: 16px;
          font-weight: 500;
        }
        
        .transaction-actions {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .action-info {
          text-align: center;
          color: #666;
        }
        
        .action-buttons {
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }
        
        .cancel-button, .confirm-button {
          flex: 1;
          padding: 14px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
          text-decoration: none;
        }
        
        .cancel-button {
          background-color: #f5f5f5;
          color: #555;
          border: 1px solid #ddd;
        }
        
        .cancel-button:hover {
          background-color: #e0e0e0;
        }
        
        .confirm-button {
          background-color: #0070f3;
          color: white;
          border: none;
        }
        
        .confirm-button:hover:not(:disabled) {
          background-color: #0056b3;
        }
        
        .confirm-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 18px;
        }
        
        @media (max-width: 768px) {
          .confirm-transaction-container {
            padding: 20px;
            margin: 20px 0;
          }
          
          .transaction-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .action-buttons {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
} 