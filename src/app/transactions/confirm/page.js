'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../../utils/apiProxy';
import Navbar from '../../components/Navbar';

export default function ConfirmTransactionPage() {
  const searchParams = useSearchParams();
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
      localStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
      router.push('/login?reason=auth_required');
      return;
    }
    
    // Получаем параметры из URL
    const accountId = searchParams.get('accountId');
    const amount = searchParams.get('amount');
    const description = searchParams.get('description');
    const details = searchParams.get('details');
    const operationType = searchParams.get('type'); // Тип операции (deposit или null/transfer)
    const cardNumber = searchParams.get('card'); // Номер карты (если есть)
    
    if (!accountId) {
      setError('Отсутствуют необходимые параметры для выполнения транзакции');
      setLoading(false);
      return;
    }
    
    // Формируем данные транзакции
    const data = {
      accountId,
      amount: amount || '', // Для ссылок сумма может быть не указана
      description: description || (operationType === 'deposit' ? 'Пополнение счета' : 'Перевод в другой банк'),
      bankDetails: details ? decodeURIComponent(details) : '',
      operationType: operationType || 'transfer', // Сохраняем тип операции
      cardNumber // Сохраняем номер карты, если он передан
    };
    
    // Загружаем данные счета отправителя
    fetchAccountData(accountId, data);
  }, [searchParams, router]);

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
      // Проверяем наличие суммы в параметрах
      if (!transactionData.amount) {
        throw new Error('Сумма не указана. Вернитесь к отправителю и попросите указать сумму перевода.');
      }
      
      if (parseFloat(transactionData.amount) <= 0) {
        throw new Error('Сумма перевода должна быть больше нуля.');
      }
      
      // Проверяем достаточно ли средств только для операций списания
      if (transactionData.operationType !== 'deposit' && parseFloat(transactionData.amount) > account.balance) {
        throw new Error('Недостаточно средств на счете');
      }
      
      // Определяем тип транзакции в зависимости от операции
      let transactionType = 'TRANSFER_OUT';
      let transactionDescription = 'Перевод в другой банк';
      
      // Если это операция пополнения, меняем тип
      if (transactionData.operationType === 'deposit') {
        transactionType = 'DEPOSIT';
        transactionDescription = 'Пополнение счета';
      }
      
      // Если есть информация о карте, добавляем ее в описание
      if (transactionData.cardNumber) {
        transactionDescription = `${transactionData.operationType === 'deposit' ? 'Пополнение с карты' : 'Перевод на карту'} ${transactionData.cardNumber}`;
      }
      
      // Создаем транзакцию
      const transaction = {
        accountId: transactionData.accountId,
        amount: parseFloat(transactionData.amount),
        type: transactionType,
        description: transactionData.description || transactionDescription
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
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка информации о транзакции...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <Navbar />
        <div className="content-wrapper">
          <div className="error-container">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h2>Ошибка</h2>
            <p>{error}</p>
            <Link href="/accounts" className="primary-button">
              Вернуться к счетам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar />
      <div className="content-wrapper">
        <div className="confirm-transaction-container">
          <div className="transaction-header">
            <h1>Подтверждение перевода</h1>
            <div className="header-actions">
              <Link href="/accounts" className="back-button">
                Назад
              </Link>
            </div>
          </div>

          {success ? (
            <div className="success-message">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2>Операция выполнена успешно!</h2>
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
                  {!transactionData?.amount ? (
                    <span className="detail-value error-text">Не указана</span>
                  ) : (
                    <div className="amount-display">
                      <span className="detail-value amount">{formatCurrency(transactionData?.amount)}</span>
                    </div>
                  )}
                </div>
                
                {transactionData?.cardNumber && (
                  <div className="detail-row">
                    <span className="detail-label">
                      {transactionData.operationType === 'deposit' ? 'Карта отправителя' : 'Карта получателя'}
                    </span>
                    <span className="detail-value card-number">{transactionData.cardNumber}</span>
                  </div>
                )}
                
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
                
              </div>
              
              <div className="transaction-actions">
                {account && parseFloat(transactionData?.amount) > account.balance && (
                  <div className="error-message">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>Недостаточно средств на счете для выполнения операции</span>
                  </div>
                )}
                
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
        
        .confirm-transaction-container {
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
        
        .error-container {
          width: 100%;
          max-width: 600px;
          padding: 40px;
          border-radius: 16px;
          background-color: #fff;
          margin: 40px auto;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .error-container h2 {
          font-size: 24px;
          margin: 16px 0;
          color: #ef4444;
          font-weight: 700;
          border: none;
          padding: 0;
        }
        
        .error-container p {
          color: #6b7280;
          margin-bottom: 24px;
        }
        
        .error-icon {
          margin-bottom: 16px;
        }
        
        .transaction-header {
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
        
        h2 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px;
          color: #374151;
          padding-left: 12px;
          border-left: 4px solid #43A047;
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
        
        .success-message {
          background-color: #ecfdf5;
          color: #047857;
          padding: 40px 24px;
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
          margin: 8px 0 12px;
          color: #047857;
          font-size: 24px;
          font-weight: 700;
          border: none;
          padding: 0;
        }
        
        .success-message p {
          color: #059669;
          font-size: 16px;
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
          gap: 12px;
        }
        
        .transaction-details {
          background-color: #f9fafb;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 30px;
          border: 1px solid #e5e7eb;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .balance-row {
          margin-top: 12px;
          padding-top: 18px;
          border-top: 2px dashed #e5e7eb;
          font-weight: 600;
        }
        
        .detail-label {
          color: #6b7280;
          font-size: 15px;
        }
        
        .detail-value {
          color: #374151;
          font-size: 16px;
          font-weight: 600;
        }
        
        .detail-value.amount {
          color: #ef4444;
        }
        
        .detail-value.card-number {
          color: #3b82f6;
          font-family: monospace;
          letter-spacing: 1px;
        }
        
        .detail-value.balance {
          color: #43A047;
        }
        
        .transaction-actions {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .action-buttons {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
        
        .cancel-button, .confirm-button {
          flex: 1;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          transition: all 0.3s;
          text-decoration: none;
        }
        
        .cancel-button {
          background-color: #f3f4f6;
          color: #4b5563;
          border: 1px solid #e5e7eb;
        }
        
        .cancel-button:hover {
          background-color: #e5e7eb;
          transform: translateY(-2px);
        }
        
        .confirm-button {
          background-color: #43A047;
          color: white;
          border: none;
          box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);
        }
        
        .confirm-button:hover:not(:disabled) {
          background-color: #388E3C;
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
          transform: translateY(-2px);
        }
        
        .confirm-button:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .amount-display {
          display: flex;
          align-items: center;
          gap: 12px;
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
        
        .primary-button {
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
        
        .primary-button:hover {
          background-color: #388E3C;
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
          transform: translateY(-2px);
        }
        
        @media (max-width: 768px) {
          .confirm-transaction-container {
            padding: 20px;
            margin: 16px 0;
          }
          
          .transaction-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .action-buttons {
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
} 