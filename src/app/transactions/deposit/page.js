'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../../utils/apiProxy';

export default function DepositPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const router = useRouter();
  
  const [transferType, setTransferType] = useState('self');
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    targetAccountId: accountId || '',
    email: ''
  });
  
  const [account, setAccount] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [foundClient, setFoundClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    // Если есть accountId в URL, то загружаем данные этого счета
    if (accountId) {
      fetchAccountData(accountId);
    }
    
    // Загрузка всех счетов пользователя
    fetchUserAccounts();
  }, [accountId, router]);

  const fetchAccountData = async (id) => {
    if (!id) return;
    
    try {
      const accountData = await apiProxy.get(`/accounts/${id}`);
      setAccount(accountData);
    } catch (err) {
      console.error('Ошибка при получении данных счета:', err);
      setError('Не удалось загрузить данные счета. Пожалуйста, попробуйте позже.');
    }
  };

  const fetchUserAccounts = async () => {
    try {
      // Получаем данные о пользователе из localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const customerId = user.customerId || user.id;
      
      if (!customerId) {
        console.error('Не удалось получить ID клиента');
        return;
      }
      
      // Получаем все счета пользователя
      const accounts = await apiProxy.get(`/accounts/customer/${customerId}`);
      setUserAccounts(accounts || []);
      
      // Если конкретный счет еще не выбран, но есть счета пользователя,
      // устанавливаем первый счет как выбранный
      if (!account && accounts && accounts.length > 0) {
        setFormData(prev => ({ ...prev, targetAccountId: accounts[0].id }));
        fetchAccountData(accounts[0].id);
      }
    } catch (err) {
      console.error('Ошибка при получении счетов пользователя:', err);
    }
  };

  const handleClientSearch = async () => {
    if (!formData.email) {
      setError('Пожалуйста, введите email клиента');
      return;
    }
    
    setSearchLoading(true);
    setError(null);
    setFoundClient(null);
    setClientAccounts([]);
    
    try {
      // Поиск клиента по email
      const client = await apiProxy.get(`/customers/find/${formData.email}`);
      setFoundClient(client);
      
      // Получение счетов клиента
      const accounts = await apiProxy.get(`/accounts/customer/${client.id}`);
      setClientAccounts(accounts || []);
      
      // Если есть счета, выбираем первый
      if (accounts && accounts.length > 0) {
        setFormData(prev => ({ ...prev, targetAccountId: accounts[0].id }));
      } else {
        setError('У клиента нет доступных счетов');
      }
    } catch (err) {
      console.error('Ошибка при поиске клиента:', err);
      setError('Клиент не найден или произошла ошибка при поиске');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Если меняется выбранный счет для пополнения, запрашиваем его данные
    if (name === 'targetAccountId' && transferType === 'self') {
      fetchAccountData(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Валидация
    if (transferType !== 'other' && !formData.targetAccountId) {
      setError('Пожалуйста, выберите счет для пополнения');
      setLoading(false);
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Пожалуйста, укажите корректную сумму пополнения');
      setLoading(false);
      return;
    }

    try {
      // Создаем транзакцию
      let transactionData = {};
      
      if (transferType === 'other') {
        // Транзакция типа TRANSFER_IN для пополнения из другого банка
        transactionData = {
          accountId: formData.targetAccountId,
          amount: parseFloat(formData.amount),
          type: 'TRANSFER_IN',
          description: formData.description || 'Пополнение из другого банка'
        };
      } else {
        // Обычное пополнение счета
        transactionData = {
          accountId: formData.targetAccountId,
          amount: parseFloat(formData.amount),
          type: 'DEPOSIT',
          description: formData.description || 'Пополнение счета'
        };
      }

      await apiProxy.post('/transactions', transactionData);
      
      setSuccess(true);
      // Автоматическое перенаправление через 2 секунды
      setTimeout(() => {
        router.push(`/accounts/${formData.targetAccountId}`);
      }, 2000);
    } catch (err) {
      console.error('Ошибка при выполнении пополнения:', err);
      setError(err.message || 'Произошла ошибка при пополнении счета. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type) => {
    setTransferType(type);
    setError(null);
    
    // Сбрасываем поиск клиента при переключении типа
    if (type !== 'client') {
      setFoundClient(null);
      setClientAccounts([]);
    }
    
    // Сбрасываем targetAccountId при переключении с self или client на other
    if (type === 'other') {
      setFormData(prev => ({ ...prev, targetAccountId: '' }));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <div className="container">
      <div className="deposit-container">
        <div className="deposit-header">
          <h1>Пополнение счета</h1>
          <div className="header-actions">
            <Link href="/accounts" className="back-button">
              Назад к счетам
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

        {success ? (
          <div className="success-message">
            <h2>Счет успешно пополнен!</h2>
            <p>Вы будете перенаправлены на страницу счета...</p>
          </div>
        ) : (
          <>
            <div className="transfer-options">
              <div className="option-pills">
                <button 
                  className={`option-pill ${transferType === 'self' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('self')}
                >
                  Мой счет
                </button>
                <button 
                  className={`option-pill ${transferType === 'client' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('client')}
                >
                  Клиент банка
                </button>
                <button 
                  className={`option-pill ${transferType === 'other' ? 'active' : ''}`}
                  onClick={() => handleTypeChange('other')}
                >
                  Другой банк
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="deposit-form">
              {/* Пополнение своего счета */}
              {transferType === 'self' && (
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="targetAccountId">Выберите счет для пополнения</label>
                    <select
                      id="targetAccountId"
                      name="targetAccountId"
                      value={formData.targetAccountId}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Выберите счет</option>
                      {userAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          Счет № {acc.id} - {formatCurrency(acc.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {account && (
                    <div className="account-card">
                      <div className="account-number">
                        Счет № {account.id}
                      </div>
                      <div className="account-balance">
                        <span className="balance-label">Текущий баланс</span>
                        <span className="balance-amount">{formatCurrency(account.balance)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Пополнение счета клиента банка */}
              {transferType === 'client' && (
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="email">Email клиента</label>
                    <div className="search-field">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Введите email клиента"
                        value={formData.email}
                        onChange={handleChange}
                        disabled={loading || searchLoading}
                      />
                      <button 
                        type="button" 
                        className="search-button"
                        onClick={handleClientSearch}
                        disabled={loading || searchLoading || !formData.email}
                      >
                        {searchLoading ? 'Поиск...' : 'Найти'}
                      </button>
                    </div>
                  </div>
                  
                  {foundClient && (
                    <div className="client-info">
                      <h3>Найден клиент</h3>
                      <p>{foundClient.firstname} {foundClient.lastname}</p>
                      <p>{foundClient.email}</p>
                    </div>
                  )}
                  
                  {clientAccounts.length > 0 && (
                    <div className="form-group">
                      <label htmlFor="targetAccountId">Выберите счет клиента</label>
                      <select
                        id="targetAccountId"
                        name="targetAccountId"
                        value={formData.targetAccountId}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      >
                        <option value="">Выберите счет</option>
                        {clientAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            Счет № {acc.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Пополнение из другого банка */}
              {transferType === 'other' && (
                <div className="form-section">
                  <div className="form-group">
                    <label htmlFor="targetAccountId">Выберите счет для пополнения</label>
                    <select
                      id="targetAccountId"
                      name="targetAccountId"
                      value={formData.targetAccountId}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="">Выберите счет</option>
                      {userAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          Счет № {acc.id} - {formatCurrency(acc.balance)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.targetAccountId && (
                    <div className="form-group">
                      <label htmlFor="senderDetails">Данные отправителя</label>
                      <textarea
                        id="senderDetails"
                        name="senderDetails"
                        rows="3"
                        placeholder="ФИО отправителя, номер счета, БИК банка отправителя"
                        className="bank-details-input"
                        disabled={loading}
                      />
                      <div className="form-hint">
                        Данные отправителя будут использованы только для описания перевода.
                        Фактическое пополнение будет обработано банковским операционистом.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Общие поля для всех типов пополнений */}
              <div className="form-group">
                <label htmlFor="amount">Сумма пополнения (₽)</label>
                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  disabled={loading || 
                    (transferType === 'client' && !foundClient) ||
                    (transferType === 'other' && !formData.targetAccountId)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Описание (необязательно)</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  placeholder={transferType === 'other' ? 'Например: Перевод из Сбербанка' : 'Например: Пополнение счета'}
                  value={formData.description}
                  onChange={handleChange}
                  disabled={loading || 
                    (transferType === 'client' && !foundClient) ||
                    (transferType === 'other' && !formData.targetAccountId)}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="deposit-button" 
                  disabled={loading || 
                    ((transferType === 'self' || transferType === 'other') && !formData.targetAccountId) || 
                    !formData.amount || 
                    (transferType === 'client' && !foundClient)}
                >
                  {loading ? 'Выполнение...' : 'Пополнить счет'}
                </button>
              </div>
            </form>
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
        
        .deposit-container {
          width: 100%;
          max-width: 600px;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #fff;
          margin: 50px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .deposit-header {
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
        
        .transfer-options {
          margin-bottom: 24px;
        }
        
        .option-pills {
          display: flex;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        }
        
        .option-pill {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-right: 1px solid #e0e0e0;
          color: #666;
        }
        
        .option-pill:last-child {
          border-right: none;
        }
        
        .option-pill.active {
          background-color: #4caf50;
          color: white;
        }
        
        .option-pill:hover:not(.active):not(:disabled) {
          background-color: #f0f0f0;
        }
        
        .option-pill:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .form-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .disabled-section {
          opacity: 0.7;
        }
        
        .not-available {
          padding: 16px;
          background-color: #f5f5f5;
          border-radius: 8px;
          text-align: center;
          color: #666;
        }
        
        .error-message {
          background-color: #fdeded;
          color: #c62828;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #c62828;
        }
        
        .success-message {
          background-color: #edf7ed;
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
        }
        
        .account-card {
          padding: 20px;
          border-radius: 10px;
          background-color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.07);
          margin-bottom: 24px;
          border-left: 5px solid #4caf50;
        }
        
        .account-number {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        
        .account-balance {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .balance-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .balance-amount {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }
        
        .client-info {
          background-color: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .client-info h3 {
          margin-top: 0;
          margin-bottom: 10px;
          font-size: 16px;
          color: #333;
        }
        
        .client-info p {
          margin: 5px 0;
          color: #555;
        }
        
        .search-field {
          display: flex;
          gap: 10px;
        }
        
        .search-field input {
          flex: 1;
        }
        
        .search-button {
          padding: 0 16px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .search-button:hover:not(:disabled) {
          background-color: #005cc8;
        }
        
        .search-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .deposit-form {
          margin-top: 20px;
        }
        
        .form-group {
          margin-bottom: 25px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
        }
        
        input, select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          color: #333;
          transition: border-color 0.2s;
          background-color: white;
        }
        
        input:focus, select:focus {
          border-color: #4caf50;
          outline: none;
        }
        
        .form-actions {
          margin-top: 30px;
        }
        
        .deposit-button {
          width: 100%;
          padding: 14px;
          background-color: #4caf50;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .deposit-button:hover:not(:disabled) {
          background-color: #3b9c3f;
        }
        
        .deposit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        textarea.bank-details-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          color: #333;
          transition: border-color 0.2s;
          background-color: white;
          resize: vertical;
          min-height: 90px;
          font-family: inherit;
        }
        
        textarea.bank-details-input:focus {
          border-color: #4caf50;
          outline: none;
        }
        
        @media (max-width: 768px) {
          .deposit-container {
            padding: 20px;
            margin: 20px 0;
          }
          
          .deposit-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .option-pills {
            flex-direction: column;
          }
          
          .option-pill {
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }
          
          .option-pill:last-child {
            border-bottom: none;
          }
          
          .search-field {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
} 