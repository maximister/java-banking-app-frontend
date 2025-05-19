'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsLoggedIn(true);
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Проверяем, есть ли у пользователя роль ADMIN или SUPER_ADMIN
        if (parsedUser.roles && (parsedUser.roles.includes('ADMIN') || parsedUser.roles.includes('SUPER_ADMIN'))) {
          setIsAdmin(true);
        }
      } catch (error) {
        console.error('Ошибка при парсинге данных пользователя:', error);
      }
    } else {
      setIsLoggedIn(false);
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    router.push('/login');
  };

  // Определяем активный пункт меню
  const isActive = (path) => {
    return pathname === path || pathname?.startsWith(path + '/') ? 'active-nav-link' : '';
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          JBank
        </Link>
        
        {isLoggedIn ? (
          <>
            <div className="nav-links">
              <Link href="/" className={`nav-link ${isActive('/')}`}>
                Главная
              </Link>
              <Link href="/accounts" className={`nav-link ${isActive('/accounts')}`}>
                Счета
              </Link>
              <Link href="/cards" className={`nav-link ${isActive('/cards')}`}>
                Карты
              </Link>
              <Link href="/transactions" className={`nav-link ${isActive('/transactions')}`}>
                Транзакции
              </Link>
              {isAdmin && (
                <Link href="/admin/users" className={`nav-link admin-link ${isActive('/admin')}`}>
                  Администрирование
                </Link>
              )}
            </div>
            
            <div className="nav-auth">
              <div className="user-menu">
                <Link href="/personal-account" className={`nav-link ${isActive('/personal-account')}`}>
                  <span className="user-name">{user?.firstname || 'Пользователь'}</span>
                </Link>
                <button onClick={handleLogout} className="logout-btn">
                  Выйти
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="nav-links">
              <Link href="/" className={`nav-link ${isActive('/')}`}>
                Главная
              </Link>
            </div>
            
            <div className="nav-auth">
              <Link href="/login" className="login-btn">
                Войти
              </Link>
              <Link href="/register" className="register-btn">
                Регистрация
              </Link>
            </div>
          </>
        )}
      </div>
      
      <style jsx>{`
        .navbar {
          background-color: white;
          border-bottom: 1px solid #e0e0e0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 2rem;
          height: 64px;
        }
        
        .nav-logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #43A047;
          text-decoration: none;
          flex-shrink: 0;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        
        .nav-link {
          text-decoration: none;
          color: #555;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 0.5rem 0;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }
        
        .nav-link:hover {
          color: #43A047;
        }
        
        .nav-link.admin-link {
          color: #1d4ed8;
        }
        
        .nav-link.admin-link:hover {
          color: #1e40af;
        }
        
        .active-nav-link {
          color: #43A047;
          border-bottom: 2px solid #43A047;
        }
        
        .active-nav-link.admin-link {
          color: #1d4ed8;
          border-bottom: 2px solid #1d4ed8;
        }
        
        .nav-auth {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-shrink: 0;
        }
        
        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .user-name {
          font-weight: 500;
        }
        
        .logout-btn {
          padding: 0.5rem 1rem;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: background-color 0.2s;
        }
        
        .logout-btn:hover {
          background-color: #d32f2f;
        }
        
        .login-btn, .register-btn {
          padding: 0.5rem 1rem;
          text-decoration: none;
          border-radius: 4px;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        
        .login-btn {
          color: #43A047;
          background-color: transparent;
          border: 1px solid #43A047;
        }
        
        .login-btn:hover {
          background-color: rgba(67, 160, 71, 0.1);
        }
        
        .register-btn {
          background-color: #43A047;
          color: white;
          border: none;
        }
        
        .register-btn:hover {
          background-color: #388E3C;
        }
        
        @media (max-width: 768px) {
          .nav-container {
            padding: 0 1rem;
          }
          
          .nav-links {
            gap: 1rem;
          }
          
          .nav-link {
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 600px) {
          .nav-container {
            overflow-x: auto;
            padding: 0 0.5rem;
          }
          
          .nav-links {
            gap: 0.5rem;
            padding: 0 0.5rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar; 