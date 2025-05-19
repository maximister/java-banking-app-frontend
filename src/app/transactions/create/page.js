'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import apiProxy from '../../utils/apiProxy';
import Navbar from '../../components/Navbar';

export default function TransferPage() {
  const searchParams = useSearchParams();
  const sourceAccountId = searchParams.get('accountId');
  const router = useRouter();
  
  const [transferType, setTransferType] = useState('my');
  const [formData, setFormData] = useState({
    targetAccountId: '',
    amount: '',
    description: '',
    email: '',
    bankDetails: '',
    cardNumber: ''
  });
  
  const [account, setAccount] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const [foundClient, setFoundClient] = useState(null);
  const [clientAccounts, setClientAccounts] = useState([]);
  const [cardAccount, setCardAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [cardSearchLoading, setCardSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    if (!sourceAccountId) {
      setError('Не указан ID счета отправителя');
      return;
    }
    
    // Загрузка данных счета для отображения информации
    fetchAccountData();
    
    // Загрузка всех счетов пользователя (для перевода между своими счетами)
    fetchUserAccounts();
  }, [sourceAccountId, router]);

  const fetchAccountData = async () => {
    if (!sourceAccountId) return;
    
    try {
      const accountData = await apiProxy.get(`/accounts/${sourceAccountId}`);
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
      
      // Отфильтровываем текущий счет из списка 
      const filteredAccounts = accounts ? accounts.filter(acc => acc.id !== parseInt(sourceAccountId)) : [];
      setUserAccounts(filteredAccounts);
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

  const handleCardSearch = async () => {
    if (!formData.cardNumber) {
      setError('Пожалуйста, введите номер карты');
      return;
    }
    
    setCardSearchLoading(true);
    setError(null);
    setCardAccount(null);
    
    try {
      // Очищаем номер карты от пробелов перед отправкой запроса
      const cleanCardNumber = formData.cardNumber.replace(/\s+/g, '');
      
      // Поиск счета по номеру карты
      const accountData = await apiProxy.get(`/accounts/card/${cleanCardNumber}`);
      setCardAccount(accountData);
      
      // Устанавливаем счет как целевой
      setFormData(prev => ({ ...prev, targetAccountId: accountData.id }));
    } catch (err) {
      console.error('Ошибка при поиске карты:', err);
      setError('Карта не найдена или произошла ошибка при поиске');
      setFormData(prev => ({ ...prev, targetAccountId: '' }));
    } finally {
      setCardSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Форматирование номера карты с пробелами при вводе (каждые 4 цифры)
    if (name === 'cardNumber') {
      // Удаляем все нецифровые символы
      const digitsOnly = value.replace(/\D/g, '');
      
      // Ограничиваем количество цифр (до 16)
      const trimmed = digitsOnly.slice(0, 16);
      
      // Форматируем с пробелами каждые 4 цифры
      let formatted = '';
      for (let i = 0; i < trimmed.length; i += 4) {
        const chunk = trimmed.slice(i, i + 4);
        formatted += chunk;
        if (i + 4 < trimmed.length) formatted += ' ';
      }
      
      setFormData({
        ...formData,
        [name]: formatted
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleTypeChange = (type) => {
    setTransferType(type);
    setError(null);
    setFormData({
      ...formData,
      targetAccountId: '',
      email: '',
      bankDetails: '',
      cardNumber: ''
    });
    
    // Сбрасываем поиск при переключении типа
    if (type !== 'client') {
      setFoundClient(null);
      setClientAccounts([]);
    }
    
    if (type !== 'card') {
      setCardAccount(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Тип операции: пополнение или перевод
    const isDeposit = searchParams.get('type') === 'deposit';
    
    // Валидация для обычных переводов (не пополнения)
    if (!isDeposit && transferType !== 'other' && !formData.targetAccountId) {
      setError('Пожалуйста, укажите номер счета получателя');
      setLoading(false);
      return;
    }
    
    // Валидация суммы
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Пожалуйста, укажите корректную сумму');
      setLoading(false);
      return;
    }
    
    // Разные проверки баланса в зависимости от операции и типа
    if (!isDeposit && parseFloat(formData.amount) > account.balance) {
      setError('Недостаточно средств на счете');
      setLoading(false);
      return;
    }
    
    // Проверка для пополнения со своего счета
    if (isDeposit && transferType === 'my') {
      if (!formData.targetAccountId) {
        setError('Выберите счет для списания');
        setLoading(false);
        return;
      }
      
      // Проверяем баланс счета списания
      const fromAccount = userAccounts.find(acc => acc.id.toString() === formData.targetAccountId.toString());
      if (fromAccount) {
        // Конвертируем строки в числа для правильного сравнения
        const amount = parseFloat(formData.amount);
        const balance = parseFloat(fromAccount.balance);
        
        if (amount > balance) {
          setError('Недостаточно средств на выбранном счете');
          setLoading(false);
          return;
        }
      }
    }

    try {
      // Пополнение со своих счетов - перевернутая логика
      if (isDeposit && transferType === 'my') {
        const transferData = {
          sourceAccountId: formData.targetAccountId, // Списание с выбранного счета
          targetAccountId: sourceAccountId, // Зачисление на текущий счет
          amount: parseFloat(formData.amount),
          description: formData.description || 'Перевод между своими счетами'
        };
        await apiProxy.post('/transactions/transfer', transferData);
      }
      // Перевод в другой банк
      else if (transferType === 'other') {
        const transactionData = {
          accountId: sourceAccountId,
          amount: parseFloat(formData.amount),
          type: 'TRANSFER_OUT',
          description: formData.description || 'Перевод в другой банк'
        };
        await apiProxy.post('/transactions', transactionData);
      }
      // Обычный перевод внутри банка
      else {
        const transferData = {
          sourceAccountId: sourceAccountId,
          targetAccountId: formData.targetAccountId,
          amount: parseFloat(formData.amount),
          description: formData.description || 'Перевод средств'
        };
        await apiProxy.post('/transactions/transfer', transferData);
      }
      
      setSuccess(true);
      // Автоматическое перенаправление через 2 секунды
      setTimeout(() => {
        router.push(`/accounts/${sourceAccountId}`);
      }, 2000);
    } catch (err) {
      console.error('Ошибка при выполнении операции:', err);
      setError(err.message || 'Произошла ошибка при выполнении операции. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
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

  const generateTransferLink = () => {
    // Для ссылок на пополнение сумма необязательна
    if (formData.amount && parseFloat(formData.amount) <= 0) {
      setError('Пожалуйста, укажите корректную сумму или оставьте поле пустым');
      return;
    }
    
    // При создании ссылки для пополнения проверка баланса не нужна
    const isDeposit = searchParams.get('type') === 'deposit';
    if (!isDeposit && formData.amount && parseFloat(formData.amount) > account.balance) {
      setError('Недостаточно средств на счете');
      return;
    }
    
    // Создаем простые параметры URL
    const params = new URLSearchParams();
    params.append('accountId', sourceAccountId);
    
    // Добавляем сумму, только если она указана
    if (formData.amount) {
      params.append('amount', formData.amount);
    }
    
    // Установка описания в зависимости от типа операции
    params.append('description', formData.description || (isDeposit ? 'Пополнение счета' : 'Перевод в другой банк'));
    
    // Добавляем тип операции для различения пополнения от перевода
    if (isDeposit) {
      params.append('type', 'deposit');
    }
    
    // Если это операция с карты, добавляем информацию о карте
    if (transferType === 'card' && formData.cardNumber) {
      params.append('card', formData.cardNumber);
    }
    
    // Безопасно кодируем реквизиты получателя
    if (formData.bankDetails) {
      params.append('details', encodeURIComponent(formData.bankDetails));
    }
    
    // Создаем ссылку на страницу совершения транзакции с URL-параметрами
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/transactions/confirm?${params.toString()}`;
    
    setGeneratedLink(link);
    setError(null);
  };
  
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(generatedLink)
      .then(() => {
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      })
      .catch(err => {
        console.error('Не удалось скопировать ссылку:', err);
        setError('Не удалось скопировать ссылку. Пожалуйста, скопируйте её вручную.');
      });
  };

  if (loading && !account) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка данных...</p>
      </div>
    );
  }
  
  return (
    <div className="container">
      <Navbar />
      <div className="content-wrapper">
        <div className="transfer-container">
          <div className="transfer-header">
            <h1>{searchParams.get('type') === 'deposit' ? 'Пополнение счета' : 'Перевод средств'}</h1>
            <Link 
              href={account ? `/accounts/${account.id}` : '/accounts'} 
              className="back-button"
            >
              Назад
            </Link>
          </div>
          
          {error && (
            <div className="error-message">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {success ? (
            <div className="success-message">
              <div className="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h2>Операция выполнена успешно!</h2>
              <p className="success-info">
                {formData.amount && `Сумма: ${formatCurrency(formData.amount)}`}<br/>
                {formData.description && `Описание: ${formData.description}`}
              </p>
              <div className="success-actions">
                <Link href="/transactions" className="action-button">
                  История операций
                </Link>
                <Link href="/accounts" className="primary-button">
                  Вернуться к счетам
                </Link>
              </div>
            </div>
          ) : account ? (
            <>
              <div className="account-info">
                <div className="account-item">
                  <div className="account-label">Счет отправителя</div>
                  <div className="account-value">№ {account.id}</div>
                </div>
                <div className="account-item">
                  <div className="account-label">Баланс</div>
                  <div className="account-value balance">{formatCurrency(account.balance)}</div>
                </div>
              </div>
              
              {searchParams.get('type') === 'deposit' ? (
                // Форма пополнения счета
                <>
                  <div className="transfer-type-selector">
                    <div 
                      className={`transfer-type-option ${transferType === 'my' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('my')}
                    >
                      <div className="option-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                        </svg>
                      </div>
                      <div className="option-label">Со своих счетов</div>
                    </div>
                    <div 
                      className={`transfer-type-option ${transferType === 'link' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('link')}
                    >
                      <div className="option-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </div>
                      <div className="option-label">Создать ссылку</div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="transfer-form">
                    {/* Пополнение со своих счетов */}
                    {transferType === 'my' && (
                      <>
                        <div className="form-group">
                          <label htmlFor="targetAccountId">Выберите счет для списания</label>
                          {userAccounts.length > 0 ? (
                            <select
                              id="targetAccountId"
                              name="targetAccountId"
                              value={formData.targetAccountId}
                              onChange={handleChange}
                              required
                              disabled={loading}
                            >
                              <option value="">Выберите счет...</option>
                              {userAccounts.map(account => (
                                <option key={account.id} value={account.id}>
                                  Счет № {account.id} ({formatCurrency(account.balance)})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <div className="empty-accounts-message">
                              У вас нет других счетов для перевода
                            </div>
                          )}
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="amount">Сумма пополнения</label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              id="amount"
                              name="amount"
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder="Введите сумму"
                              required
                              disabled={loading}
                            />
                            <span className="currency-symbol">₽</span>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="description">Описание (необязательно)</label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Например: Пополнение с другого счета"
                            disabled={loading}
                            rows="3"
                          ></textarea>
                        </div>
                        
                        <div className="form-actions">
                          <button 
                            type="submit" 
                            className="primary-button full-width" 
                            disabled={loading || !formData.targetAccountId}
                          >
                            {loading ? 'Выполнение операции...' : 'Пополнить счет'}
                          </button>
                        </div>
                      </>
                    )}
                    
                    {/* Создать ссылку для пополнения */}
                    {transferType === 'link' && (
                      <div className="form-group">
                        <div className="link-info">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                          <p>Создайте ссылку для пополнения счета. Поделитесь ею, чтобы получить перевод на ваш счет.</p>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="amount">Сумма пополнения (необязательно)</label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              id="amount"
                              name="amount"
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder="Оставьте пустым для любой суммы"
                              disabled={loading}
                            />
                            <span className="currency-symbol">₽</span>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="description">Описание (необязательно)</label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Например: Пополнение счета"
                            disabled={loading}
                            rows="3"
                          ></textarea>
                        </div>
                        
                        {generatedLink && (
                          <div className="generated-link">
                            <div className="qrcode-container">
                              <QRCode value={generatedLink} size={150} />
                            </div>
                            <div className="link-text-container">
                              <input
                                type="text"
                                value={generatedLink}
                                readOnly
                                className="link-input"
                              />
                              <button 
                                type="button"
                                onClick={copyLinkToClipboard}
                                className="copy-button"
                              >
                                {linkCopied ? 'Скопировано!' : 'Копировать'}
                              </button>
                            </div>
                          </div>
                        )}
                        
                        <div className="form-actions">
                          <button
                            type="button"
                            onClick={generateTransferLink}
                            className="primary-button full-width"
                            disabled={loading || !!generatedLink}
                          >
                            {loading ? 'Генерация ссылки...' : 'Создать ссылку'}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </>
              ) : (
                // Форма перевода средств
                <>
                  <div className="transfer-type-selector">
                    <div 
                      className={`transfer-type-option ${transferType === 'my' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('my')}
                    >
                      <div className="option-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" />
                        </svg>
                      </div>
                      <div className="option-label">Со своими</div>
                    </div>
                    <div 
                      className={`transfer-type-option ${transferType === 'email' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('email')}
                    >
                      <div className="option-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </svg>
                      </div>
                      <div className="option-label">По email</div>
                    </div>
                    <div 
                      className={`transfer-type-option ${transferType === 'card' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('card')}
                    >
                      <div className="option-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </div>
                      <div className="option-label">По номеру карты</div>
                    </div>
                    <div 
                      className={`transfer-type-option ${transferType === 'link' ? 'active' : ''}`}
                      onClick={() => handleTypeChange('link')}
                    >
                      <div className="option-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                        </svg>
                      </div>
                      <div className="option-label">Создать ссылку</div>
                    </div>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="transfer-form">
                    {/* На свой счет */}
                    {transferType === 'my' && (
                      <div className="form-group">
                        <label htmlFor="targetAccountId">Выберите счет получателя</label>
                        {userAccounts.length > 0 ? (
                          <select
                            id="targetAccountId"
                            name="targetAccountId"
                            value={formData.targetAccountId}
                            onChange={handleChange}
                            required
                            disabled={loading}
                          >
                            <option value="">Выберите счет...</option>
                            {userAccounts.map(account => (
                              <option key={account.id} value={account.id}>
                                Счет № {account.id} ({formatCurrency(account.balance)})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="empty-accounts-message">
                            У вас нет других счетов для перевода
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* По email */}
                    {transferType === 'email' && (
                      <div className="form-group">
                        <label htmlFor="email">Email получателя</label>
                        <div className="input-with-button">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Введите email"
                            required
                            disabled={loading || searchLoading}
                          />
                          <button 
                            type="button" 
                            onClick={handleClientSearch}
                            className="search-button"
                            disabled={loading || searchLoading || !formData.email}
                          >
                            {searchLoading ? (
                              <div className="mini-spinner"></div>
                            ) : (
                              <span>Найти</span>
                            )}
                          </button>
                        </div>
                        
                        {foundClient && (
                          <div className="search-result">
                            <div className="client-info">
                              <div className="client-name">
                                {foundClient.firstName} {foundClient.lastName}
                              </div>
                              <div className="client-email">{foundClient.email}</div>
                            </div>
                            
                            {clientAccounts.length > 0 ? (
                              <div className="form-group inner-group">
                                <label htmlFor="targetAccountClient">Выберите счет получателя</label>
                                <select
                                  id="targetAccountClient"
                                  name="targetAccountId"
                                  value={formData.targetAccountId}
                                  onChange={handleChange}
                                  required
                                  disabled={loading}
                                >
                                  <option value="">Выберите счет...</option>
                                  {clientAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                      Счет № {account.id}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="empty-accounts-message">
                                У клиента нет доступных счетов
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* По номеру карты */}
                    {transferType === 'card' && (
                      <div className="form-group">
                        <label htmlFor="cardNumber">Номер карты</label>
                        <div className="input-with-button">
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            value={formData.cardNumber}
                            onChange={handleChange}
                            placeholder="Введите номер карты"
                            required
                            disabled={loading || cardSearchLoading}
                          />
                          <button 
                            type="button" 
                            onClick={handleCardSearch}
                            className="search-button"
                            disabled={loading || cardSearchLoading || !formData.cardNumber}
                          >
                            {cardSearchLoading ? (
                              <div className="mini-spinner"></div>
                            ) : (
                              <span>Найти</span>
                            )}
                          </button>
                        </div>
                        
                        {cardAccount && (
                          <div className="search-result">
                            <div className="account-info">
                              <div>Счет № {cardAccount.id}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Создать ссылку */}
                    {transferType === 'link' && (
                      <div className="form-group">
                        <div className="link-info">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                          </svg>
                          <p>Создайте ссылку для получения перевода. Поделитесь ею с получателем, чтобы он мог перевести средства на ваш счет.</p>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="amount">Сумма перевода (необязательно)</label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              id="amount"
                              name="amount"
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder="Оставьте пустым для любой суммы"
                              disabled={loading}
                            />
                            <span className="currency-symbol">₽</span>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="description">Описание (необязательно)</label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Например: Оплата услуг"
                            disabled={loading}
                            rows="3"
                          ></textarea>
                        </div>
                        
                        {generatedLink && (
                          <div className="generated-link">
                            <div className="qrcode-container">
                              <QRCode value={generatedLink} size={150} />
                            </div>
                            <div className="link-text-container">
                              <input
                                type="text"
                                value={generatedLink}
                                readOnly
                                className="link-input"
                              />
                              <button 
                                type="button"
                                onClick={copyLinkToClipboard}
                                className="copy-button"
                              >
                                {linkCopied ? 'Скопировано!' : 'Копировать'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Общие поля для всех типов переводов (кроме ссылки) */}
                    {transferType !== 'link' && (
                      <>
                        <div className="form-group">
                          <label htmlFor="amount">Сумма перевода</label>
                          <div className="input-with-icon">
                            <input
                              type="text"
                              id="amount"
                              name="amount"
                              value={formData.amount}
                              onChange={handleChange}
                              placeholder="Введите сумму"
                              required
                              disabled={loading}
                            />
                            <span className="currency-symbol">₽</span>
                          </div>
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="description">Описание (необязательно)</label>
                          <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Например: Оплата услуг"
                            disabled={loading}
                            rows="3"
                          ></textarea>
                        </div>
                      </>
                    )}
                    
                    <div className="form-actions">
                      {transferType === 'link' ? (
                        <button
                          type="button"
                          onClick={generateTransferLink}
                          className="primary-button full-width"
                          disabled={loading || !!generatedLink}
                        >
                          {loading ? 'Генерация ссылки...' : 'Создать ссылку'}
                        </button>
                      ) : (
                        <button 
                          type="submit" 
                          className="primary-button full-width" 
                          disabled={loading || (transferType === 'email' && !foundClient) || (transferType === 'card' && !cardAccount)}
                        >
                          {loading ? 'Выполнение перевода...' : 'Перевести деньги'}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </>
          ) : (
            <div className="error-state">
              <div className="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h2>Счет не найден</h2>
              <p>Не удалось загрузить информацию о счете для совершения операции.</p>
              <Link href="/accounts" className="primary-button">
                Вернуться к счетам
              </Link>
            </div>
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
        
        .transfer-container {
          width: 100%;
          max-width: 700px;
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .transfer-header {
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
          display: flex;
          align-items: center;
          gap: 12px;
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
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .success-icon {
          margin-bottom: 16px;
        }
        
        .success-info {
          margin: 16px 0 24px;
          font-size: 16px;
          line-height: 1.6;
        }
        
        .success-actions {
          display: flex;
          gap: 16px;
          margin-top: 8px;
        }
        
        .account-info {
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          display: flex;
          justify-content: space-between;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .account-item {
          flex: 1;
        }
        
        .account-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
        }
        
        .account-value {
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }
        
        .account-value.balance {
          color: #43A047;
        }
        
        .transfer-type-selector {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }
        
        .transfer-type-option {
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 16px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .transfer-type-option:hover {
          border-color: #43A047;
          background-color: #f0fdf4;
        }
        
        .transfer-type-option.active {
          border-color: #43A047;
          background-color: #f0fdf4;
        }
        
        .option-icon {
          color: #43A047;
        }
        
        .option-label {
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
        }
        
        .transfer-form {
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .form-group {
          margin-bottom: 24px;
        }
        
        .inner-group {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #2d3748;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 15px;
          color: #374151;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        input:focus, select:focus, textarea:focus {
          border-color: #43A047;
          outline: none;
          box-shadow: 0 0 0 3px rgba(67, 160, 71, 0.2);
        }
        
        .input-with-icon {
          position: relative;
        }
        
        .input-with-icon input {
          padding-right: 40px;
        }
        
        .currency-symbol {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: #6b7280;
        }
        
        .input-with-button {
          display: flex;
          gap: 8px;
        }
        
        .input-with-button input {
          flex: 1;
        }
        
        .search-button {
          padding: 0 20px;
          background-color: #43A047;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .search-button:hover:not(:disabled) {
          background-color: #388E3C;
        }
        
        .search-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
        }
        
        .search-result {
          margin-top: 16px;
          padding: 16px;
          border-radius: 8px;
          background-color: #f0fdf4;
          border: 1px solid #a7f3d0;
        }
        
        .client-info {
          margin-bottom: 16px;
        }
        
        .client-name {
          font-weight: 600;
          color: #111827;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .client-email {
          color: #6b7280;
          font-size: 14px;
        }
        
        .form-actions {
          margin-top: 32px;
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
          cursor: pointer;
          display: inline-block;
        }
        
        .primary-button:hover:not(:disabled) {
          background-color: #388E3C;
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
          transform: translateY(-2px);
        }
        
        .primary-button:disabled {
          background-color: #9ca3af;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }
        
        .full-width {
          width: 100%;
          display: block;
        }
        
        .action-button {
          padding: 12px 24px;
          background-color: #f3f4f6;
          color: #4b5563;
          border-radius: 8px;
          text-decoration: none;
          font-size: 15px;
          font-weight: 600;
          transition: all 0.3s;
          border: none;
        }
        
        .action-button:hover {
          background-color: #e5e7eb;
          transform: translateY(-2px);
        }
        
        .empty-accounts-message {
          background-color: #f3f4f6;
          color: #4b5563;
          padding: 12px;
          border-radius: 6px;
          text-align: center;
          font-size: 14px;
        }
        
        .link-info {
          display: flex;
          gap: 16px;
          background-color: #f0f7ff;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
          color: #1e40af;
          border-left: 4px solid #3b82f6;
        }
        
        .link-info svg {
          flex-shrink: 0;
          color: #3b82f6;
        }
        
        .generated-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          background-color: #fff;
          border-radius: 8px;
          padding: 24px;
          border: 1px solid #e5e7eb;
        }
        
        .qrcode-container {
          padding: 16px;
          background-color: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .link-text-container {
          display: flex;
          width: 100%;
          gap: 8px;
        }
        
        .link-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .copy-button {
          padding: 10px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .copy-button:hover {
          background-color: #2563eb;
        }
        
        .error-state {
          background-color: #fff;
          border-radius: 12px;
          padding: 40px 24px;
          margin-top: 24px;
          text-align: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .error-state h2 {
          color: #dc2626;
          margin: 16px 0 8px;
        }
        
        .error-state p {
          color: #6b7280;
          margin-bottom: 24px;
          max-width: 400px;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          gap: 16px;
        }
        
        .loading-spinner, .mini-spinner {
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(67, 160, 71, 0.2);
          border-left-color: #43A047;
        }
        
        .mini-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-left-color: white;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .transfer-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .transfer-type-selector {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          
          .account-info {
            flex-direction: column;
            gap: 16px;
          }
          
          .search-result {
            overflow-x: auto;
          }
          
          .input-with-button {
            flex-direction: column;
          }
          
          .success-actions {
            flex-direction: column;
            width: 100%;
          }
          
          .success-actions .primary-button,
          .success-actions .action-button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 