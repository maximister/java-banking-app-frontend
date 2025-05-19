'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function PersonalAccount() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (!userData) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('Извлеченные данные из токена:', payload);
          
          const basicUser = {
            username: payload.sub,
            firstname: payload.fullName ? payload.fullName.split(' ')[0] : 'Пользователь',
            lastname: payload.fullName ? payload.fullName.split(' ')[1] : '',
            email: payload.email || 'не указан',
            dateOfBirth: payload.dateOfBirth || new Date().toISOString().split('T')[0]
          };
          
          localStorage.setItem('user', JSON.stringify(basicUser));
          setUser(basicUser);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Ошибка при декодировании токена:', error);
      }
    }
    
    try {
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } else {
        setUser({
          username: 'пользователь',
          firstname: 'Имя',
          lastname: 'Фамилия',
          email: 'email@example.com',
          dateOfBirth: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      setUser({
        username: 'пользователь',
        firstname: 'Имя',
        lastname: 'Фамилия',
        email: 'email@example.com',
        dateOfBirth: new Date().toISOString().split('T')[0]
      });
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="container">
      <Navbar />
      <div className="account-container">
        <div className="account-header">
          <h1>Личный кабинет</h1>
          <div className="header-actions">
            <Link 
              href="/" 
              style={{
                padding: '10px 20px',
                backgroundColor: '#43A047',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                transition: 'all 0.2s',
                fontWeight: 500,
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#388E3C';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(67, 160, 71, 0.2)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#43A047';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              На главную
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </div>
        </div>
        
        <div className="user-profile">
          <div className="profile-avatar">
            <div className="avatar-placeholder">
              {user.firstname[0]}{user.lastname[0]}
            </div>
          </div>
          <div className="profile-details">
            <h2 className="user-name">{user.firstname} {user.lastname}</h2>
            <p className="user-email">{user.email}</p>
            <button onClick={handleEditProfile} className="edit-button">
              Редактировать профиль
            </button>
          </div>
        </div>
        
        <div className="user-info-section">
          <h2>Личная информация</h2>
          <div className="info-card">
            <div className="info-row">
              <div className="info-label">Имя</div>
              <div className="info-value">{user.firstname}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Фамилия</div>
              <div className="info-value">{user.lastname}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Email</div>
              <div className="info-value">{user.email}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Имя пользователя</div>
              <div className="info-value">{user.username}</div>
            </div>
            <div className="info-row">
              <div className="info-label">Дата рождения</div>
              <div className="info-value">{new Date(user.dateOfBirth).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding: 0;
          background-color: #f9f9f9;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, sans-serif;
        }
        
        .account-container {
          width: 100%;
          max-width: 900px;
          padding: 30px;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          background-color: #fff;
          margin: 30px auto;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        .account-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
        }
        
        h1 {
          font-size: 2rem;
          margin: 0;
          color: #333;
        }
        
        h2 {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #444;
          border-left: 4px solid #43A047;
          padding-left: 10px;
        }
        
        .home-button {
          padding: 10px 20px;
          background-color: #43A047;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 16px;
          transition: all 0.2s;
          border: none;
          font-weight: 500;
        }
        
        .home-button:hover {
          background-color: #388E3C;
          box-shadow: 0 4px 8px rgba(67, 160, 71, 0.2);
          transform: translateY(-1px);
        }
        
        .logout-button {
          padding: 10px 20px;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .logout-button:hover {
          background-color: #d32f2f;
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f5f7fa;
          border-radius: 10px;
          border: 1px solid #eaeaea;
        }
        
        .profile-avatar {
          margin-right: 24px;
        }
        
        .avatar-placeholder {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: #43A047;
          color: white;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 28px;
          font-weight: 600;
        }
        
        .profile-details {
          flex: 1;
        }
        
        .user-name {
          font-size: 24px;
          margin: 0 0 5px;
          border-left: none;
          padding-left: 0;
        }
        
        .user-email {
          color: #666;
          margin: 0 0 15px;
          font-size: 16px;
        }
        
        .edit-button {
          padding: 8px 16px;
          background-color: #43A047;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .edit-button:hover {
          background-color: #388E3C;
        }
        
        .user-info-section {
          margin-top: 40px;
        }
        
        .info-card {
          border-radius: 8px;
          border: 1px solid #eaeaea;
          overflow: hidden;
        }
        
        .info-row {
          display: flex;
          border-bottom: 1px solid #eaeaea;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          width: 200px;
          padding: 16px 20px;
          background-color: #f5f7fa;
          font-weight: 500;
        }
        
        .info-value {
          flex: 1;
          padding: 16px 20px;
        }
        
        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          font-size: 18px;
        }
        
        @media (max-width: 768px) {
          .account-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }
          
          .user-profile {
            flex-direction: column;
            align-items: flex-start;
            text-align: center;
          }
          
          .profile-avatar {
            margin-right: 0;
            margin-bottom: 15px;
            align-self: center;
          }
          
          .info-row {
            flex-direction: column;
          }
          
          .info-label {
            width: 100%;
            padding: 10px 15px;
          }
          
          .info-value {
            padding: 10px 15px;
            background-color: #fff;
          }
        }
      `}</style>
    </div>
  );
} 