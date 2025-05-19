'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiProxy from '../../utils/apiProxy';
import Navbar from '../../components/Navbar';
import Link from 'next/link';

export default function AdminUsersPage() {
  const router = useRouter();
  
  // Состояния
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Модальные окна
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Эффект для проверки авторизации и получения информации о пользователе
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/login?redirect=' + encodeURIComponent('/admin/users'));
          return;
        }
        
        const user = JSON.parse(userData);
        const hasAdminRole = user.roles && (user.roles.includes('ADMIN') || user.roles.includes('SUPER_ADMIN'));
        
        if (!hasAdminRole) {
          setError('У вас нет прав для доступа к этой странице');
          return;
        }
        
        setIsAdmin(true);
        loadUsers(0, pageSize);
      } catch (err) {
        console.error('Ошибка при проверке авторизации:', err);
        setError('Произошла ошибка при проверке доступа');
      }
    };
    
    checkAuth();
  }, [router, pageSize]);
  
  // Загрузка пользователей
  const loadUsers = async (page, size, query = '') => {
    setLoading(true);
    try {
      let response;
      if (query.trim()) {
        response = await apiProxy.get(`/users/search?query=${encodeURIComponent(query)}&page=${page}&size=${size}`);
      } else {
        response = await apiProxy.get(`/users/all?page=${page}&size=${size}`);
      }
      
      setUsers(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(page);
    } catch (err) {
      console.error('Ошибка при загрузке пользователей:', err);
      setError('Не удалось загрузить список пользователей');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик поиска
  const handleSearch = (e) => {
    e.preventDefault();
    loadUsers(0, pageSize, searchQuery);
  };
  
  // Обработчик изменения статуса пользователя (бан/разбан)
  const handleStatusChange = async (userId) => {
    try {
      const response = await apiProxy.get(`/users/status/${userId}`);
      
      // Обновляем пользователя в списке
      setUsers(users.map(user => 
        user.id === userId ? response : user
      ));
    } catch (err) {
      console.error('Ошибка при изменении статуса пользователя:', err);
      alert('Не удалось изменить статус пользователя');
    }
  };
  
  // Обработчик добавления роли
  const handleAddRole = async (userId, roleName) => {
    try {
      // Находим пользователя по ID, чтобы получить его username
      const userToUpdate = users.find(user => user.id === userId);
      if (!userToUpdate || !userToUpdate.username) {
        throw new Error('Пользователь не найден');
      }
      
      const response = await apiProxy.post('/users/roles/add', {
        username: userToUpdate.username,
        roleName
      });
      
      // Обновляем пользователя в списке
      setUsers(users.map(user => 
        user.id === userId ? response : user
      ));
      
      setShowRoleModal(false);
    } catch (err) {
      console.error('Ошибка при добавлении роли:', err);
      alert('Не удалось добавить роль пользователю');
    }
  };
  
  // Обработчик удаления роли
  const handleRemoveRole = async (userId, roleName) => {
    try {
      // Находим пользователя по ID, чтобы получить его username
      const userToUpdate = users.find(user => user.id === userId);
      if (!userToUpdate || !userToUpdate.username) {
        throw new Error('Пользователь не найден');
      }
      
      const response = await apiProxy.post('/users/roles/remove', {
        username: userToUpdate.username,
        roleName
      });
      
      // Обновляем пользователя в списке
      setUsers(users.map(user => 
        user.id === userId ? response : user
      ));
    } catch (err) {
      console.error('Ошибка при удалении роли:', err);
      alert('Не удалось удалить роль у пользователя');
    }
  };
  
  // Обработчик удаления пользователя
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Вы действительно хотите удалить этого пользователя? Это действие нельзя отменить.')) {
      return;
    }
    
    try {
      await apiProxy.delete(`/users/delete/${userId}`);
      
      // Удаляем пользователя из списка
      setUsers(users.filter(user => user.id !== userId));
      alert('Пользователь успешно удален');
    } catch (err) {
      console.error('Ошибка при удалении пользователя:', err);
      alert('Не удалось удалить пользователя');
    }
  };
  
  // Функция для определения статуса пользователя
  const getUserStatusLabel = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'Активен';
      case 'BANNED':
        return 'Заблокирован';
      case 'DELETED':
        return 'Удален';
      default:
        return status || 'Неизвестно';
    }
  };
  
  // Функция для определения класса статуса
  const getStatusClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'BANNED':
        return 'status-banned';
      case 'DELETED':
        return 'status-deleted';
      default:
        return '';
    }
  };
  
  if (error && !isAdmin) {
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
            <h2>Доступ запрещен</h2>
            <p>{error}</p>
            <Link href="/" className="primary-button">
              На главную
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
        <div className="admin-header">
          <h1>Управление пользователями</h1>
          <div className="admin-actions">
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени или email..."
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Загрузка пользователей...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{error}</span>
          </div>
        ) : (
          <div className="users-container">
            <div className="user-count">
              <span>Всего пользователей: {totalElements}</span>
            </div>
            
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Имя пользователя</th>
                    <th>Email</th>
                    <th>Имя</th>
                    <th>Роли</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.firstname} {user.lastname}</td>
                      <td className="roles-cell">
                        {user.roles?.map(role => (
                          <span key={role} className="role-badge">
                            {role}
                            <button 
                              className="remove-role-btn"
                              onClick={() => handleRemoveRole(user.id, role)}
                              title="Удалить роль"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <button 
                          className="add-role-btn"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          title="Добавить роль"
                        >
                          +
                        </button>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusClass(user.status)}`}>
                          {getUserStatusLabel(user.status)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <button 
                          onClick={() => handleStatusChange(user.id)}
                          className="action-button"
                          title={user.status === 'BANNED' ? 'Разблокировать' : 'Заблокировать'}
                        >
                          {user.status === 'BANNED' ? 'Разблокировать' : 'Заблокировать'}
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="action-button delete"
                          title="Удалить пользователя"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Пагинация */}
            <div className="pagination">
              <button 
                onClick={() => loadUsers(0, pageSize, searchQuery)}
                disabled={currentPage === 0}
                className="pagination-button"
              >
                &laquo;
              </button>
              
              <button 
                onClick={() => loadUsers(currentPage - 1, pageSize, searchQuery)}
                disabled={currentPage === 0}
                className="pagination-button"
              >
                &lsaquo;
              </button>
              
              <span className="pagination-info">
                Страница {currentPage + 1} из {totalPages}
              </span>
              
              <button 
                onClick={() => loadUsers(currentPage + 1, pageSize, searchQuery)}
                disabled={currentPage >= totalPages - 1}
                className="pagination-button"
              >
                &rsaquo;
              </button>
              
              <button 
                onClick={() => loadUsers(totalPages - 1, pageSize, searchQuery)}
                disabled={currentPage >= totalPages - 1}
                className="pagination-button"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Модальное окно для добавления роли */}
      {showRoleModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Добавление роли</h3>
              <button onClick={() => setShowRoleModal(false)} className="close-button">
                &times;
              </button>
            </div>
            <div className="modal-body">
              <p>Выберите роль для пользователя {selectedUser.username}:</p>
              <div className="role-buttons">
                <button onClick={() => handleAddRole(selectedUser.id, 'USER')} className="role-button">
                  USER
                </button>
                <button onClick={() => handleAddRole(selectedUser.id, 'ADMIN')} className="role-button admin">
                  ADMIN
                </button>
                <button onClick={() => handleAddRole(selectedUser.id, 'SUPER_ADMIN')} className="role-button super-admin">
                  SUPER_ADMIN
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        .admin-header {
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
        
        .search-form {
          display: flex;
          max-width: 400px;
        }
        
        .search-input {
          padding: 10px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px 0 0 6px;
          width: 300px;
          font-size: 15px;
        }
        
        .search-button {
          background-color: #43A047;
          color: white;
          border: none;
          border-radius: 0 6px 6px 0;
          padding: 0 16px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .search-button:hover {
          background-color: #388E3C;
        }
        
        .users-container {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        
        .user-count {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 15px;
          color: #6b7280;
        }
        
        .users-table-wrapper {
          overflow-x: auto;
        }
        
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .users-table th,
        .users-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          font-size: 14px;
        }
        
        .users-table th {
          background-color: #f9fafb;
          color: #4b5563;
          font-weight: 600;
        }
        
        .users-table tr:last-child td {
          border-bottom: none;
        }
        
        .roles-cell {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
        }
        
        .role-badge {
          background-color: #e5e7eb;
          color: #4b5563;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 12px;
          display: inline-flex;
          align-items: center;
        }
        
        .remove-role-btn {
          background-color: transparent;
          color: #6b7280;
          border: none;
          width: 16px;
          height: 16px;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: 4px;
        }
        
        .remove-role-btn:hover {
          color: #ef4444;
        }
        
        .add-role-btn {
          background-color: #43A047;
          color: white;
          border: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .add-role-btn:hover {
          background-color: #388E3C;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .status-active {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .status-banned {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        
        .status-deleted {
          background-color: #f3f4f6;
          color: #6b7280;
        }
        
        .actions-cell {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .action-button {
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background-color: #f3f4f6;
          color: #4b5563;
          transition: all 0.2s;
        }
        
        .action-button:hover {
          background-color: #e5e7eb;
        }
        
        .action-button.delete {
          color: #ef4444;
        }
        
        .action-button.delete:hover {
          background-color: #fee2e2;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          gap: 8px;
          border-top: 1px solid #e5e7eb;
        }
        
        .pagination-button {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          background-color: white;
          color: #4b5563;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .pagination-button:hover:not(:disabled) {
          background-color: #f3f4f6;
        }
        
        .pagination-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .pagination-info {
          margin: 0 10px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .loading-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 48px;
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
        
        .error-message {
          background-color: #fef2f2;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin: 20px 0;
          border-left: 4px solid #dc2626;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 12px;
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
          border: none;
          padding: 0;
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
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background-color: white;
          border-radius: 8px;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          animation: modalFadeIn 0.3s;
        }
        
        @keyframes modalFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .modal-header {
          padding: 16px 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #2d3748;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
        }
        
        .modal-body {
          padding: 24px;
        }
        
        .role-buttons {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        
        .role-button {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          background-color: #f3f4f6;
          color: #4b5563;
          transition: all 0.2s;
        }
        
        .role-button:hover {
          background-color: #e5e7eb;
        }
        
        .role-button.admin {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .role-button.admin:hover {
          background-color: #bfdbfe;
        }
        
        .role-button.super-admin {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        
        .role-button.super-admin:hover {
          background-color: #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }
          
          .search-form {
            width: 100%;
            max-width: none;
          }
          
          .search-input {
            width: 100%;
          }
          
          .users-table th,
          .users-table td {
            padding: 8px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
} 