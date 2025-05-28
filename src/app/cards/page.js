'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiProxy from '../utils/apiProxy';
import Navbar from '../components/Navbar';

const CardChip = () => (
  <div className="card-chip">
    <div className="chip-line"></div>
    <div className="chip-line"></div>
    <div className="chip-line"></div>
    <div className="chip-main"></div>
  </div>
);

export default function Cards() {
  const [cards, setCards] = useState([]);
  const [accounts, setAccounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flippedCard, setFlippedCard] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    // Получение списка карт клиента
    fetchCards();
  }, [router]);

  const fetchCards = async () => {
    try {
      // Получаем данные о пользователе из localStorage
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        setError('Не удалось получить данные пользователя. Пожалуйста, войдите заново.');
        return;
      }
      
      const user = JSON.parse(userData);
      const customerId = user.customerId || user.id;
      
      if (!customerId) {
        console.error('Не удалось получить ID клиента из данных пользователя:', user);
        setError('Не удалось получить ID клиента. Пожалуйста, войдите заново.');
        return;
      }
      
      // Получаем список карт клиента
      const cardsData = await apiProxy.get(`/cards/customer/${customerId}`);
      setCards(cardsData || []);
      
      // Получаем данные о счетах для отображения баланса
      const accountsData = await apiProxy.get(`/accounts/customer/${customerId}`);
      
      // Преобразуем список счетов в объект для быстрого доступа
      const accountsMap = {};
      accountsData.forEach(account => {
        accountsMap[account.id] = account;
      });
      
      setAccounts(accountsMap);
    } catch (err) {
      console.error('Ошибка при получении карт:', err);
      setError('Произошла ошибка при загрузке карт. Пожалуйста, попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения лого платежной системы
  const getCardLogo = (cardType) => {
    switch(cardType) {
      case 'VISA':
        return '/visa-logo.svg';
      case 'MASTERCARD':
        return '/mastercard-logo.svg';
      case 'MIR':
        return '/mir-logo.svg';
      default:
        return '/card-logo.svg';
    }
  };

  // Функция для маскирования номера карты
  const formatCardNumber = (number) => {
    if (!number) return '•••• •••• •••• ••••';
    const last4 = number.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  // Форматирование суммы
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(amount);
  };

  // Определение статуса карты
  const getStatusLabel = (status) => {
    const statusMap = {
      'ACTIVE': 'Активна',
      'INACTIVE': 'Неактивна',
      'BLOCKED': 'Заблокирована',
      'EXPIRED': 'Срок истек'
    };
    return statusMap[status] || status;
  };

  // Определение CSS класса для статуса
  const getStatusClass = (status) => {
    const statusClassMap = {
      'ACTIVE': 'status-active',
      'INACTIVE': 'status-inactive',
      'BLOCKED': 'status-blocked',
      'EXPIRED': 'status-expired'
    };
    return statusClassMap[status] || '';
  };

  // Функция для получения цвета карты в зависимости от типа
  const getCardColorClass = (cardType) => {
    switch(cardType) {
      case 'VISA':
        return 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)';
      case 'MASTERCARD':
        return 'linear-gradient(135deg, #388E3C 0%, #1B5E20 100%)';
      case 'MIR':
        return 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)';
      default:
        return 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)';
    }
  };

  const handleCardFlip = (cardId) => {
    setFlippedCard(flippedCard === cardId ? null : cardId);
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
        <p>Загрузка карт...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <Navbar />
      <div className="content-wrapper">
        <div className="cards-container">
          <div className="cards-header">
            <h1>Мои карты</h1>
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

          <div className="cards-navigation">
            <div className="nav-tabs">
              <Link href="/accounts" className="nav-tab">
                Счета
              </Link>
              <span className="nav-tab active">Карты</span>
              <Link href="/transactions" className="nav-tab">
                История операций
              </Link>
            </div>
          </div>

          {cards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#43A047" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <h3>У вас пока нет выпущенных карт</h3>
              <p>Чтобы выпустить карту, перейдите на страницу счета и нажмите кнопку &quot;Выпустить карту&quot;</p>
              <Link href="/accounts" className="primary-button">
                Перейти к счетам
              </Link>
            </div>
          ) : (
            <div className="cards-list">
              {cards.map((card) => (
                <div key={card.id} className="card-item">
                  <div className="card-container">
                    <div className={`card-wrapper ${flippedCard === card.id ? 'flipped' : ''}`} onClick={() => handleCardFlip(card.id)}>
                      <div className="bank-card card-front" style={{ background: getCardColorClass(card.cardType) }}>
                        <div className="card-chip-and-logo">
                          <CardChip />
                          <div className="card-type-logo">{card.cardType}</div>
                        </div>
                        <div className="card-number">{card.cardNumber}</div>
                        <div className="card-bottom-row">
                          <div className="card-holder">
                            <div className="card-label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                            <div className="card-holder-name">{card.holderFirstName} {card.holderLastName}</div>
                          </div>
                          <div className="card-expires">
                            <div className="card-label">СРОК ДО</div>
                            <div className="card-expire-date">05/29</div>
                          </div>
                        </div>
                        <div className="bank-logo">JBank</div>
                      </div>
                      <div className="bank-card card-back">
                        <div className="magnetic-stripe"></div>
                        <div className="signature-and-cvv">
                          <div className="signature-strip">
                            <div className="signature">{card.holderFirstName} {card.holderLastName}</div>
                          </div>
                          <div className="cvv-container">
                            <div className="cvv-label">CVV</div>
                            <div className="cvv-code">{card.maskedCvv}</div>
                          </div>
                        </div>
                        <div className="bank-info">Нажмите на карту, чтобы перевернуть</div>
                        <div className="bank-logo">JBank</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-details">
                    <div className="card-info">
                      <div className="card-info-row">
                        <span className="card-info-label">Счет:</span>
                        <span className="card-info-value">№ {card.accountId}</span>
                      </div>
                      <div className="card-info-row">
                        <span className="card-info-label">Баланс:</span>
                        <span className="card-info-value balance">
                          {accounts[card.accountId] ? formatCurrency(accounts[card.accountId].balance) : 'Загрузка...'}
                        </span>
                      </div>
                      <div className="card-info-row">
                        <span className="card-info-label">Статус:</span>
                        <span className={`card-info-value ${getStatusClass(card.status)}`}>
                          {getStatusLabel(card.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="card-actions">
                      <Link 
                        href={`/transactions/create?accountId=${card.accountId}`} 
                        className="card-button primary"
                      >
                        Перевести
                      </Link>
                      <Link 
                        href={`/accounts/${card.accountId}`} 
                        className="card-button secondary"
                      >
                        К счету
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
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
        
        .cards-container {
          width: 100%;
          max-width: 800px;
          padding: 24px;
          border-radius: 16px;
          background-color: #fff;
          margin: 20px 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        
        .cards-header {
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
        
        .cards-navigation {
          margin-bottom: 24px;
        }
        
        .nav-tabs {
          display: flex;
          gap: 16px;
          border-bottom: 1px solid #e5e7eb;
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
        
        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .card-item {
          display: flex;
          flex-direction: column;
          gap: 16px;
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .card-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
        }
        
        .card-wrapper {
          width: 340px;
          height: 215px;
          perspective: 1000px;
          cursor: pointer;
          position: relative;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }
        
        .card-wrapper.flipped {
          transform: rotateY(180deg);
        }
        
        .bank-card {
          width: 340px;
          height: 215px;
          padding: 25px;
          border-radius: 16px;
          position: absolute;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        
        .bank-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
          transform: rotate(30deg);
        }
        
        .card-front {
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .card-back {
          transform: rotateY(180deg);
          color: #333;
          background: #e8e8e8;
        }
        
        .magnetic-stripe {
          width: 100%;
          height: 40px;
          background-color: #333;
          margin: 20px 0;
        }
        
        .signature-and-cvv {
          display: flex;
          margin: 15px 0;
          padding: 0 10px;
        }
        
        .signature-strip {
          flex: 1;
          background-color: #fff;
          height: 40px;
          display: flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 4px;
          position: relative;
          overflow: hidden;
        }
        
        .signature {
          font-family: 'Brush Script MT', cursive;
          font-size: 16px;
          color: #333;
          font-style: italic;
        }
        
        .signature::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: repeating-linear-gradient(
            45deg,
            rgba(200, 200, 200, 0.1),
            rgba(200, 200, 200, 0.1) 5px,
            transparent 5px,
            transparent 10px
          );
        }
        
        .cvv-container {
          width: 80px;
          margin-left: 15px;
          background-color: #fff;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .cvv-label {
          font-size: 10px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .cvv-code {
          font-size: 16px;
          font-weight: bold;
          letter-spacing: 1px;
        }
        
        .card-chip {
          width: 50px;
          height: 40px;
          background: linear-gradient(135deg, #fdde5c 0%, #f8b64c 100%);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
        }
        
        .chip-line {
          width: 80%;
          height: 2px;
          background-color: rgba(0,0,0,0.2);
          margin: 2px 0;
        }
        
        .chip-main {
          position: absolute;
          width: 30px;
          height: 26px;
          background: linear-gradient(135deg, #d4af37 0%, #f9d966 100%);
          border-radius: 6px;
        }
        
        .card-chip-and-logo {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        
        .card-type-logo {
          font-size: 20px;
          font-weight: bold;
          color: #fff;
          letter-spacing: 1px;
        }
        
        .card-number {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 2px;
          margin-bottom: 25px;
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .card-bottom-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 15px;
        }
        
        .card-holder, .card-expires {
          display: flex;
          flex-direction: column;
        }
        
        .card-label {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 5px;
          opacity: 0.8;
        }
        
        .card-holder-name {
          font-size: 16px;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .card-expire-date {
          font-size: 16px;
          font-weight: 500;
        }
        
        .bank-logo {
          position: absolute;
          bottom: 20px;
          right: 25px;
          font-size: 18px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .bank-info {
          text-align: center;
          color: #666;
          font-size: 12px;
          position: absolute;
          bottom: 50px;
          left: 0;
          right: 0;
        }
        
        .card-details {
          background-color: #f9fafb;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .card-info {
          margin-bottom: 20px;
        }
        
        .card-info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .card-info-row:last-child {
          border-bottom: none;
        }
        
        .card-info-label {
          font-weight: 500;
          color: #6b7280;
        }
        
        .card-info-value {
          font-weight: 600;
          color: #374151;
        }

        .card-info-value.balance {
          color: #43A047;
        }
        
        .card-actions {
          display: flex;
          justify-content: space-between;
          gap: 16px;
        }
        
        .card-button {
          flex: 1;
          padding: 12px 0;
          text-align: center;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.3s;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        }
        
        .card-button.primary {
          background-color: #43A047;
          color: white;
        }
        
        .card-button.primary:hover {
          background-color: #388E3C;
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.3);
          transform: translateY(-2px);
        }
        
        .card-button.secondary {
          background-color: #f3f4f6;
          color: #4b5563;
        }
        
        .card-button.secondary:hover {
          background-color: #e5e7eb;
          transform: translateY(-2px);
        }
        
        .status-active {
          color: #059669;
        }
        
        .status-inactive {
          color: #d97706;
        }
        
        .status-blocked {
          color: #dc2626;
        }
        
        .status-expired {
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
          .cards-container {
            padding: 20px;
            margin: 16px 0;
          }
          
          .cards-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .header-actions {
            width: 100%;
          }
          
          .nav-tabs {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 12px;
          }
          
          .card-container {
            padding: 10px 0;
          }
          
          .card-wrapper {
            width: 100%;
            max-width: 340px;
          }
          
          .bank-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 