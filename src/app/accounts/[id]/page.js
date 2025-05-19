'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import config from '../../config';
import apiProxy from '../../utils/apiProxy';
import { use } from 'react';
import Navbar from '../../components/Navbar';

export default function AccountDetails({ params }) {
  const id = use(params).id;
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [card, setCard] = useState(null);
  const [cardLoading, setCardLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }

    // Загрузка данных счета
    fetchAccountData(id);
  }, [id, router]);

  const fetchAccountData = async (accountId) => {
    setLoading(true);
    try {
      // Запрос данных счета с использованием apiProxy
      const accountData = await apiProxy.get(`/accounts/${accountId}`);
      setAccount(accountData);

      // Запрос транзакций по счету
      try {
        const transactionsData = await apiProxy.get(`/transactions/account/${accountId}`);
        setTransactions(transactionsData);
      } catch (transactionError) {
        console.warn('Не удалось загрузить транзакции:', transactionError);
        // Не выводим ошибку пользователю, если не получилось загрузить транзакции
      }

      // Запрос карты по счету
      try {
        setCardLoading(true);
        const cardData = await apiProxy.get(`/cards/account/${accountId}`);
        setCard(cardData);
      } catch (cardError) {
        console.warn('Не удалось загрузить карту:', cardError);
        // Если карты нет, не выводим ошибку
        setCard(null);
      } finally {
        setCardLoading(false);
      }
    } catch (err) {
      console.error('Ошибка при получении данных счета:', err);
      setError('Произошла ошибка при загрузке данных счета. Пожалуйста, попробуйте позже.');
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

  // Определение стиля суммы (положительная или отрицательная)
  const getAmountStyleClass = (type) => {
    const positiveTypes = ['DEPOSIT', 'TRANSFER_IN'];
    return positiveTypes.includes(type) ? 'amount-positive' : 'amount-negative';
  };

  // Определение знака суммы (+ или -)
  const getAmountSign = (type) => {
    const positiveTypes = ['DEPOSIT', 'TRANSFER_IN'];
    return positiveTypes.includes(type) ? '+ ' : '- ';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleCardFlip = () => {
    setIsCardFlipped(!isCardFlipped);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Загрузка данных счета...</p>
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
              Вернуться к списку счетов
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container">
        <Navbar />
        <div className="content-wrapper">
          <div className="error-container">
            <div className="error-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8"/>
              </svg>
            </div>
            <h2>Счет не найден</h2>
            <p>Запрашиваемый счет не существует или у вас нет к нему доступа.</p>
            <Link href="/accounts" className="primary-button">
              Вернуться к списку счетов
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
        <div className="account-details-container">
          <div className="account-details-header">
            <h1>Детали счета</h1>
            <div className="header-actions">
              <Link href="/accounts" className="back-button">
                Назад к счетам
              </Link>
            </div>
          </div>

          <div className="account-card">
                          <div className="account-header">
              <div className="account-number">
                Счет № {account.id}
              </div>
            </div>
            
            <div className="account-balance">
              <span className="balance-label">Текущий баланс</span>
              <span className="balance-amount">{formatCurrency(account.balance)}</span>
            </div>
            


            <div className="account-actions-grid">
              <Link href={`/transactions/create?accountId=${account.id}&type=deposit`} className="action-button deposit-button">
                <div className="action-content">
                  <span className="action-title">Пополнить</span>
                  <span className="action-desc">Внести средства</span>
                </div>
              </Link>
              
              <Link href={`/transactions/create?accountId=${account.id}`} className="action-button transfer-button">
                <div className="action-content">
                  <span className="action-title">Перевести</span>
                  <span className="action-desc">На другой счет</span>
                </div>
              </Link>
            </div>
          </div>

          <div className="section-divider">
            <span className="section-title">Привязанная карта</span>
          </div>

          {cardLoading ? (
            <div className="card-loading">
              <div className="mini-spinner"></div>
              <span>Загрузка карты...</span>
            </div>
          ) : card ? (
            <div className="card-section">
              <div className="card-preview-container">
                <div className={`card-preview ${isCardFlipped ? 'flipped' : ''}`} onClick={handleCardFlip}>
                  <div className="card-front" style={{ background: 'linear-gradient(135deg, #43A047 0%, #2E7D32 100%)' }}>
                    <div className="card-chip"></div>
                                      <div className="card-number">
                    {card.cardNumber}
                  </div>
                    <div className="card-bottom">
                      <div className="card-holder">
                        <div className="card-label">ДЕРЖАТЕЛЬ КАРТЫ</div>
                        <div>{card.holderFirstName} {card.holderLastName}</div>
                      </div>
                                              <div className="card-exp">
                          <div className="card-label">СРОК ДО</div>
                          <div>05/29</div>
                        </div>
                    </div>

                  </div>
                  <div className="card-back">
                    <div className="magnetic-stripe"></div>
                    <div className="signature-and-cvv">
                      <div className="signature">
                        <span>{card.holderFirstName} {card.holderLastName}</span>
                      </div>
                      <div className="cvv">
                        <div className="cvv-label">CVV</div>
                        <div className="cvv-value">{card.maskedCvv}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-details">
                <div className="card-info-row">
                  <span className="card-info-label">Номер карты:</span>
                  <span className="card-info-value">{card.cardNumber}</span>
                </div>


                <div className="card-info-row">
                  <span className="card-info-label">Срок действия:</span>
                  <span className="card-info-value">05/29</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-card-section">
              <div className="empty-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
              <p>К этому счету пока не привязана карта</p>
              <button className="issue-card-button">
                Выпустить карту
              </button>
            </div>
          )}

          <div className="section-divider">
            <span className="section-title">История операций</span>
          </div>

          {transactions.length > 0 ? (
            <div className="transactions-section">
              <div className="transaction-list">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      <div className={`icon-wrapper ${getAmountStyleClass(transaction.type)}`}>
                        {transaction.type === 'DEPOSIT' || transaction.type === 'TRANSFER_IN' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 19V5M5 12l7-7 7 7"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M5 12l7 7 7-7"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="transaction-content">
                      <div className="transaction-info">
                        <div className="transaction-type">
                          {getTransactionTypeLabel(transaction.type)}
                        </div>
                        <div className="transaction-date">{new Date(transaction.timestamp).toLocaleDateString()}</div>
                      </div>
                      <div className="transaction-amount-section">
                        <span className={`transaction-amount ${getAmountStyleClass(transaction.type)}`}>
                          {getAmountSign(transaction.type)}{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="view-all-transactions">
                <Link href={'/transactions'} className="view-all-button">
                  Показать все операции
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-transactions">
              <div className="empty-transactions-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <path d="M14 2v6h6"/>
                  <path d="M16 13H8"/>
                  <path d="M16 17H8"/>
                  <path d="M10 9H8"/>
                </svg>
              </div>
              <p>По этому счету пока нет операций</p>
              <Link href={`/transactions/create?accountId=${account.id}`} className="transaction-action-button">
                Совершить перевод
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
        
        .account-details-container {
          width: 100%;
          max-width: 800px;
          margin: 20px 0;
          animation: fadeIn 0.5s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .account-details-header {
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
        
        .account-card {
          background-color: #fff;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .account-number {
          font-size: 18px;
          font-weight: 600;
          color: #4b5563;
        }
        
        .account-status {
          padding: 6px 12px;
          border-radius: 30px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .status-active {
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        
        .status-inactive {
          background-color: rgba(245, 158, 11, 0.1);
          color: #d97706;
        }
        
        .status-blocked {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        
        .status-closed {
          background-color: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }
        
        .account-balance {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px;
          background-color: #f0fdf4;
          border-radius: 12px;
          margin-bottom: 24px;
          border-left: 4px solid #43A047;
        }
        
        .balance-label {
          color: #4b5563;
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        .balance-amount {
          font-size: 36px;
          font-weight: 700;
          color: #43A047;
        }
        
        .account-details-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
          padding: 0 12px;
        }
        
        .detail-item {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 6px;
        }
        
        .detail-value {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        .account-actions-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-top: 32px;
        }
        
        .action-button {
          padding: 16px;
          border-radius: 12px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
        }
        
        .deposit-button {
          background-color: #f0fdf4;
          color: #43A047;
          border: 1px solid #a7f3d0;
        }
        
        .deposit-button:hover {
          background-color: #ecfdf5;
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(67, 160, 71, 0.15);
        }
        
        .transfer-button {
          background-color: #eff6ff;
          color: #3b82f6;
          border: 1px solid #bfdbfe;
        }
        
        .transfer-button:hover {
          background-color: #dbeafe;
          transform: translateY(-3px);
          box-shadow: 0 6px 12px rgba(59, 130, 246, 0.15);
        }
        
        .action-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.15;
        }
        
        .action-icon svg {
          color: currentColor;
        }
        
        .action-content {
          display: flex;
          flex-direction: column;
        }
        
        .action-title {
          font-weight: 600;
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .action-desc {
          font-size: 14px;
          color: #6b7280;
        }
        
        .section-divider {
          display: flex;
          align-items: center;
          margin: 32px 0 24px;
          position: relative;
        }
        
        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #2d3748;
          padding-right: 16px;
          background: #f9fafb;
          position: relative;
          z-index: 1;
        }
        
        .section-divider::after {
          content: "";
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background-color: #e5e7eb;
          z-index: 0;
        }

        .card-section {
          background-color: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }
        
        .card-preview-container {
          position: relative;
          perspective: 1000px;
        }
        
        .card-preview {
          width: 100%;
          aspect-ratio: 1.58 / 1;
          transform-style: preserve-3d;
          transition: transform 0.8s;
          cursor: pointer;
          position: relative;
        }
        
        .card-preview.flipped {
          transform: rotateY(180deg);
        }
        
        .card-front, .card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 12px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          overflow: hidden;
        }
        
        .card-front {
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }
        
        .card-front::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
          transform: rotate(30deg);
        }
        
        .card-back {
          transform: rotateY(180deg);
          background-color: #e8e8e8;
        }
        
        .card-chip {
          width: 40px;
          height: 32px;
          background: linear-gradient(135deg, #fdde5c 0%, #f8b64c 100%);
          border-radius: 5px;
          margin-bottom: 25px;
        }
        
        .card-number {
          font-size: 18px;
          letter-spacing: 2px;
          margin-bottom: 20px;
        }
        
        .card-bottom {
          display: flex;
          justify-content: space-between;
        }
        
        .card-label {
          font-size: 9px;
          opacity: 0.8;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        
        .card-holder, .card-exp {
          font-size: 14px;
        }
        
        .card-type {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 16px;
          font-weight: bold;
        }
        
        .magnetic-stripe {
          width: 100%;
          height: 40px;
          background-color: #333;
          margin-top: 20px;
        }
        
        .signature-and-cvv {
          display: flex;
          justify-content: space-between;
          padding: 20px;
          margin-top: 20px;
        }
        
        .signature {
          width: 70%;
          height: 40px;
          background-color: #fff;
          display: flex;
          align-items: center;
          padding: 0 10px;
          border-radius: 4px;
          font-family: 'Brush Script MT', cursive;
          font-style: italic;
          color: #333;
          position: relative;
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
        
        .cvv {
          width: 20%;
          padding: 0 10px;
        }
        
        .cvv-label {
          font-size: 10px;
          color: #333;
        }
        
        .cvv-value {
          font-weight: bold;
        }
        
        .card-details {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .card-info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .card-info-row:last-child {
          border-bottom: none;
        }
        
        .card-info-label {
          color: #6b7280;
          font-size: 14px;
        }
        
        .card-info-value {
          font-weight: 600;
          color: #374151;
        }
        
        .card-loading, .empty-card-section {
          background-color: #fff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6b7280;
        }
        
        .empty-card-icon, .empty-transactions-icon {
          color: #9ca3af;
          margin-bottom: 8px;
        }
        
        .issue-card-button, .transaction-action-button {
          background-color: #43A047;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          margin-top: 8px;
          text-decoration: none;
          display: inline-block;
          box-shadow: 0 2px 8px rgba(67, 160, 71, 0.3);
        }
        
        .issue-card-button:hover, .transaction-action-button:hover {
          background-color: #388E3C;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(67, 160, 71, 0.4);
        }
        
        .mini-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(67, 160, 71, 0.2);
          border-left-color: #43A047;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .transactions-section {
          background-color: #fff;
          border-radius: 16px;
          padding: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        
        .transaction-list {
          display: flex;
          flex-direction: column;
        }
        
        .transaction-item {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s ease;
        }
        
        .transaction-item:last-child {
          border-bottom: none;
        }
        
        .transaction-item:hover {
          background-color: #f9fafb;
        }
        
        .transaction-icon {
          margin-right: 16px;
          flex-shrink: 0;
        }
        
        .icon-wrapper {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-wrapper.amount-positive {
          background-color: #43A047;
        }
        
        .icon-wrapper.amount-negative {
          background-color: #ef4444;
        }
        
        .transaction-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex: 1;
        }
        
        .transaction-info {
          display: flex;
          flex-direction: column;
        }
        
        .transaction-type {
          font-weight: 500;
          color: #111827;
          margin-bottom: 4px;
        }
        
        .transaction-date {
          font-size: 13px;
          color: #6b7280;
        }
        
        .transaction-amount-section {
          text-align: right;
        }
        
        .transaction-amount {
          font-weight: 600;
          font-size: 16px;
        }
        
        .amount-positive {
          color: #43A047;
        }
        
        .amount-negative {
          color: #ef4444;
        }
        
        .view-all-transactions {
          display: flex;
          justify-content: center;
          padding: 16px 0 8px;
        }
        
        .view-all-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          color: #43A047;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.2s;
          border-radius: 8px;
          background-color: #f0fdf4;
          border: 1px solid #a7f3d0;
        }
        
        .view-all-button:hover {
          color: #2e7d32;
          background-color: #ecfdf5;
        }
        
        .empty-transactions {
          background-color: #fff;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #6b7280;
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
        }
        
        .error-container p {
          color: #6b7280;
          margin-bottom: 24px;
        }
        
        .error-icon {
          margin-bottom: 16px;
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
        
        @media (max-width: 768px) {
          .account-details-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .account-details-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .account-actions-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .card-section {
            grid-template-columns: 1fr;
          }
          
          .card-preview-container {
            margin-bottom: 24px;
          }
        }
      `}</style>
    </div>
  );
} 