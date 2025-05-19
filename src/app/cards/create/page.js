'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../../utils/apiProxy';

export default function CreateCardPage() {
  const searchParams = useSearchParams();
  const accountId = searchParams.get('accountId');
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    accountId: accountId || '',
    cardType: 'VISA',
    holderFirstName: '',
    holderLastName: ''
  });
  
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Предзаполняем имя и фамилию держателя карты, если доступно
      if (parsedUser.firstname && parsedUser.lastname) {
        const firstName = parsedUser.firstname.toUpperCase();
        const lastName = parsedUser.lastname.toUpperCase();
        
        setFormData(prev => ({
          ...prev,
          holderFirstName: firstName,
          holderLastName: lastName
        }));
        
        // Проверяем автоматически предзаполненные поля на соответствие латинице
        const latinRegex = /^[A-Za-z\s\-']+$/;
        const newFormErrors = {};
        
        if (!latinRegex.test(firstName)) {
          newFormErrors.holderFirstName = 'Имя должно содержать только латинские буквы';
        }
        
        if (!latinRegex.test(lastName)) {
          newFormErrors.holderLastName = 'Фамилия должна содержать только латинские буквы';
        }
        
        if (Object.keys(newFormErrors).length > 0) {
          setFormErrors(newFormErrors);
        }
      }
    } catch (err) {
      console.error('Ошибка при парсинге данных пользователя', err);
    }
    
    if (!accountId) {
      setError('Не указан ID счета для выпуска карты');
      setPageLoading(false);
      return;
    }
    
    // Загрузка данных счета для отображения информации
    fetchAccountData();
  }, [accountId, router]);

  const fetchAccountData = async () => {
    if (!accountId) {
      setPageLoading(false);
      return;
    }
    
    try {
      const accountData = await apiProxy.get(`/accounts/${accountId}`);
      setAccount(accountData);
    } catch (err) {
      console.error('Ошибка при получении данных счета:', err);
      setError('Не удалось загрузить данные счета. Пожалуйста, попробуйте позже.');
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Валидация для полей с именем и фамилией
    if (name === 'holderFirstName' || name === 'holderLastName') {
      const latinRegex = /^[A-Za-z\s\-']+$/;
      
      // Очищаем предыдущую ошибку при вводе
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name]; // Полностью удаляем ошибку для данного поля
        return newErrors;
      });
      
      // Проверяем на латинские буквы
      if (value && !latinRegex.test(value)) {
        setFormErrors(prev => ({
          ...prev,
          [name]: 'Пожалуйста, используйте только латинские буквы (A-Z)'
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Дополнительная проверка перед отправкой
    const latinRegex = /^[A-Za-z\s\-']+$/;
    const newFormErrors = {};
    
    if (!latinRegex.test(formData.holderFirstName)) {
      newFormErrors.holderFirstName = 'Имя должно содержать только латинские буквы';
    }
    
    if (!latinRegex.test(formData.holderLastName)) {
      newFormErrors.holderLastName = 'Фамилия должна содержать только латинские буквы';
    }
    
    // Если есть ошибки, останавливаем отправку
    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors);
      setLoading(false);
      return;
    }

    try {
      // Создаем запрос на выпуск карты
      const cardData = {
        accountId: accountId,
        cardType: formData.cardType,
        holderFirstName: formData.holderFirstName,
        holderLastName: formData.holderLastName
      };

      await apiProxy.post('/cards', cardData);
      
      setSuccess(true);
      // Автоматическое перенаправление через 2 секунды
      setTimeout(() => {
        router.push(`/accounts/${accountId}`);
      }, 2000);
    } catch (err) {
      console.error('Ошибка при выпуске карты:', err);
      setError(err.message || 'Произошла ошибка при выпуске карты. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (pageLoading) {
    return <div className="loading">Загрузка данных счета...</div>;
  }

  return (
    <div className="container">
      <div className="create-card-container">
        <div className="create-card-header">
          <h1>Выпуск карты</h1>
          <div className="header-actions">
            {accountId && (
              <Link href={`/accounts/${accountId}`} className="back-button">
                Назад к счету
              </Link>
            )}
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
            <h2>Карта успешно выпущена!</h2>
            <p>Вы будете перенаправлены на страницу счета...</p>
          </div>
        ) : (
          <>
            {account && (
              <div className="account-card">
                <div className="account-number">
                  Счет № {account.id}
                </div>
                <div className="account-status">
                  Статус: {account.status === 'ACTIVE' ? 'Активен' : account.status}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="create-card-form">
              <div className="form-group">
                <label htmlFor="cardType">Тип карты</label>
                <select
                  id="cardType"
                  name="cardType"
                  value={formData.cardType}
                  onChange={handleChange}
                  required
                  disabled={loading}
                >
                  <option value="VISA">VISA</option>
                  <option value="MASTERCARD">MasterCard</option>
                  <option value="MIR">МИР</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="holderFirstName">Имя держателя карты (латиницей)</label>
                <input
                  id="holderFirstName"
                  name="holderFirstName"
                  type="text"
                  placeholder="IVAN"
                  value={formData.holderFirstName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={formErrors.holderFirstName ? 'input-error' : ''}
                />
                {formErrors.holderFirstName && (
                  <div className="error-text">{formErrors.holderFirstName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="holderLastName">Фамилия держателя карты (латиницей)</label>
                <input
                  id="holderLastName"
                  name="holderLastName"
                  type="text"
                  placeholder="IVANOV"
                  value={formData.holderLastName}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  className={formErrors.holderLastName ? 'input-error' : ''}
                />
                {formErrors.holderLastName && (
                  <div className="error-text">{formErrors.holderLastName}</div>
                )}
                <div className="form-hint">
                  Имя и фамилия как в загранпаспорте, заглавными буквами
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="create-card-button" 
                  disabled={loading || !account || account.status !== 'ACTIVE' || 
                    !formData.holderFirstName || !formData.holderLastName || 
                    Object.keys(formErrors).length > 0}
                >
                  {loading ? 'Выполнение...' : 'Выпустить карту'}
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
        
        .create-card-container {
          width: 100%;
          max-width: 600px;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #fff;
          margin: 50px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .create-card-header {
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
        
        .error-message {
          background-color: #ffebee;
          color: #c62828;
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
          border-left: 4px solid #c62828;
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
        }
        
        .account-card {
          padding: 20px;
          border-radius: 10px;
          background-color: #fff;
          box-shadow: 0 2px 6px rgba(0,0,0,0.07);
          margin-bottom: 24px;
          border-left: 5px solid #0070f3;
        }
        
        .account-number {
          font-size: 18px;
          font-weight: 600;
          color: #333;
          margin-bottom: 12px;
        }
        
        .account-status {
          font-size: 14px;
          color: #555;
        }
        
        .create-card-form {
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
          border-color: #0070f3;
          outline: none;
        }
        
        .form-hint {
          margin-top: 8px;
          font-size: 14px;
          color: #666;
        }
        
        .form-actions {
          margin-top: 30px;
        }
        
        .create-card-button {
          width: 100%;
          padding: 14px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .create-card-button:hover:not(:disabled) {
          background-color: #005cc8;
        }
        
        .create-card-button:disabled {
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
        
        .input-error {
          border-color: #c62828;
          background-color: #ffebee;
        }
        
        .error-text {
          color: #c62828;
          font-size: 13px;
          margin-top: 5px;
        }
        
        @media (max-width: 768px) {
          .create-card-container {
            padding: 20px;
            margin: 20px 0;
          }
          
          .create-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
        }
      `}</style>
    </div>
  );
} 