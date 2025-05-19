'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Перенаправляем на новую страницу личного кабинета
    router.push('/personal-account');
  }, [router]);

  return (
    <div className="container">
      <div className="redirect-message">
        <h2>Перенаправление...</h2>
        <p>Переход на страницу личного кабинета</p>
      </div>
      
      <style jsx>{`
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: #f9f9f9;
        }
        
        .redirect-message {
          padding: 40px;
          text-align: center;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        
        h2 {
          color: #43A047;
          margin-bottom: 10px;
        }
        
        p {
          color: #666;
        }
      `}</style>
    </div>
  );
} 