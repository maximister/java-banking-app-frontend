'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Проверяем, авторизован ли пользователь
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <div className="main-container">
      <Navbar />

      {isLoggedIn ? (
        <div className="dashboard">
          <div className="welcome-section">
            <h1>Добро пожаловать в JBank</h1>
            <p>Управляйте своими финансами легко и удобно</p>
          </div>

          <div className="finance-management">
            <h2>Управление финансами</h2>
            <div className="finance-cards">
              <Link href="/accounts" className="finance-card accounts-card">
                <div className="icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" className="card-icon accounts-icon">
                    <path d="M4 10h16v4H4z M2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2zm2 0h16v10H4V7zm2 3h12v1H6v-1zm0 2h8v1H6v-1z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Мои счета</h3>
                  <p>Управление банковскими счетами и просмотр баланса</p>
                </div>
              </Link>
              
              <Link href="/transactions" className="finance-card transactions-card">
                <div className="icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" className="card-icon transactions-icon">
                    <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Транзакции</h3>
                  <p>История транзакций и детали платежей</p>
                </div>
              </Link>
              
              <Link href="/cards" className="finance-card cards-card">
                <div className="icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" className="card-icon cards-icon">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Карты</h3>
                  <p>Управление банковскими картами и настройками</p>
                </div>
              </Link>
              
              <Link href="/personal-account" className="finance-card profile-card">
                <div className="icon-container">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="32" height="32" className="card-icon profile-icon">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>Личный кабинет</h3>
                  <p>Управление профилем и настройки безопасности</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="landing">
          <div className="hero">
            <h1>Банкинг будущего</h1>
            <p>Современный подход к управлению вашими финансами</p>
            <div className="cta">
              <Link href="/register" className="btn-cta">Начать сейчас</Link>
            </div>
          </div>
          
          <div className="features">
            <div className="feature">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                </svg>
              </div>
              <h3>Управление картами</h3>
              <p>Создавайте и управляйте своими банковскими картами</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M4 10h16v4H4z M2 7v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2zm2 0h16v10H4V7zm2 3h12v1H6v-1zm0 2h8v1H6v-1z"/>
                </svg>
              </div>
              <h3>Счета</h3>
              <p>Открывайте счета и отслеживайте баланс в одном месте</p>
            </div>
            
            <div className="feature">
              <div className="feature-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48">
                  <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
              </div>
              <h3>Переводы</h3>
              <p>Отправляйте и получайте деньги быстро и безопасно</p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .main-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        /* Стили для неавторизованных пользователей */
        .landing {
          display: flex;
          flex-direction: column;
          gap: 4rem;
          padding: 2rem 0;
        }
        
        .hero {
          text-align: center;
          padding: 4rem 0;
        }
        
        .hero h1 {
          font-size: 3.5rem;
          margin-bottom: 1rem;
          color: #333;
        }
        
        .hero p {
          font-size: 1.5rem;
          color: #666;
          margin-bottom: 2rem;
        }
        
        .btn-cta {
          display: inline-block;
          padding: 1rem 2rem;
          background-color: #43A047;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-weight: 500;
          font-size: 1.1rem;
          transition: background-color 0.2s;
        }
        
        .btn-cta:hover {
          background-color: #388E3C;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }
        
        .feature {
          text-align: center;
          padding: 2rem;
          background-color: #f5f7fa;
          border-radius: 8px;
          transition: transform 0.2s;
        }
        
        .feature:hover {
          transform: translateY(-5px);
        }
        
        .feature-icon {
          margin-bottom: 1rem;
          color: #43A047;
        }
        
        .feature h3 {
          margin-bottom: 0.5rem;
          font-size: 1.5rem;
        }
        
        .feature p {
          color: #666;
        }
        
        /* Стили для авторизованных пользователей */
        .dashboard {
          display: flex;
          flex-direction: column;
          gap: 3rem;
          padding-top: 2rem;
        }
        
        .welcome-section {
          text-align: center;
          margin-bottom: 1rem;
        }
        
        .welcome-section h1 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #333;
        }
        
        .welcome-section p {
          color: #666;
          font-size: 1.2rem;
        }
        
        .finance-management h2 {
          font-size: 1.8rem;
          margin-bottom: 1.5rem;
          color: #333;
          border-left: 4px solid #43A047;
          padding-left: 1rem;
        }
        
        .finance-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        
        .finance-card {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          border-radius: 10px !important;
          text-decoration: none !important;
          color: inherit !important;
          background-color: white !important;
          box-shadow: 0 4px 10px rgba(0,0,0,0.08) !important;
          transition: all 0.25s ease !important;
          border: 1px solid #eaeaea !important;
          border-left-width: 5px !important;
          overflow: hidden !important;
          min-height: 100px !important;
          position: relative !important;
        }
        
        .finance-card:hover {
          box-shadow: 0 8px 25px rgba(67, 160, 71, 0.2) !important;
          transform: translateY(-3px) !important;
          border-color: #43A047 !important;
        }
        
        .accounts-card {
          border-left-color: #43A047 !important;
        }
        
        .transactions-card {
          border-left-color: #66BB6A !important;
        }
        
        .cards-card {
          border-left-color: #81C784 !important;
        }
        
        .profile-card {
          border-left-color: #A5D6A7 !important;
        }
        
        .icon-container {
          width: 80px !important;
          min-width: 80px !important;
          flex-shrink: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          padding: 1rem !important;
        }
        
        .card-icon {
          width: 40px !important;
          height: 40px !important;
        }
        
        .accounts-icon {
          color: #43A047 !important;
        }
        
        .transactions-icon {
          color: #66BB6A !important;
        }
        
        .cards-icon {
          color: #81C784 !important;
        }
        
        .profile-icon {
          color: #A5D6A7 !important;
        }
        
        .card-content {
          flex: 1 !important;
          padding: 1.5rem !important;
          padding-left: 0 !important;
          text-align: left !important;
        }
        
        .finance-card h3 {
          margin: 0 0 0.5rem !important;
          font-size: 1.25rem !important;
          font-weight: 600 !important;
          color: #2E7D32 !important;
        }
        
        .finance-card p {
          margin: 0 !important;
          color: #666 !important;
          font-size: 0.95rem !important;
          line-height: 1.4 !important;
        }
        
        @media (max-width: 768px) {
          .features {
            grid-template-columns: 1fr;
          }
          
          .finance-cards {
            grid-template-columns: 1fr;
          }
          
          .hero h1 {
            font-size: 2.5rem;
          }
        }
      `}</style>
    </div>
  );
}
