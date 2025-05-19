'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Проверка авторизации
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login?redirect=' + encodeURIComponent('/admin'));
      return;
    }
    
    try {
      const user = JSON.parse(userData);
      const hasAdminRole = user.roles && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN'));
      
      if (!hasAdminRole) {
        router.push('/');
        return;
      }
      
      // Перенаправляем на страницу управления пользователями
      router.push('/admin/users');
    } catch (err) {
      console.error('Ошибка при проверке авторизации:', err);
      router.push('/');
    }
  }, [router]);

  // Отображаем страницу загрузки при перенаправлении
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Загрузка панели администратора...</p>
      
      <style jsx>{`
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
      `}</style>
    </div>
  );
} 