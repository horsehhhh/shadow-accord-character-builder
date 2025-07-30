import React, { useState } from 'react';
import { authAPI, migrationUtils } from '../services/api';

const AuthComponent = ({ onAuthChange }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(migrationUtils.isAuthenticated());
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await authAPI.login(formData.email, formData.password);
      } else {
        await authAPI.register(formData.username, formData.email, formData.password);
      }
      
      setIsAuthenticated(true);
      onAuthChange(true);
      setFormData({ username: '', email: '', password: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authAPI.logout();
    setIsAuthenticated(false);
    onAuthChange(false);
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (isAuthenticated) {
    const user = migrationUtils.getCurrentUser();
    
    if (isMinimized) {
      return (
        <div style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          padding: '8px 12px',
          borderRadius: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 9999,
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
        onClick={() => setIsMinimized(false)}
        title="Click to expand"
        >
          👤 {user?.username?.substring(0, 3)}...
        </div>
      );
    }
    
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'white',
        border: '2px solid #28a745',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 9999,
        minWidth: '250px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0 }}>👤 Welcome, {user?.username}!</h4>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '0',
              color: '#666'
            }}
            title="Minimize"
          >
            ➖
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
          Characters are now saved to the cloud
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: '5px 10px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  // Show minimized login button when not authenticated
  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        padding: '8px 12px',
        borderRadius: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: 9999,
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
      onClick={() => setIsMinimized(false)}
      title="Click to expand login"
      >
        🔐 Login
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      background: 'white',
      border: '2px solid #007bff',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      minWidth: '300px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0 }}>🔐 {isLogin ? 'Login' : 'Register'}</h4>
        <button
          onClick={() => setIsMinimized(true)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '0',
            color: '#666'
          }}
          title="Minimize"
        >
          ➖
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div style={{ marginBottom: '10px' }}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '5px',
                marginBottom: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
        )}
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '5px',
              marginBottom: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '5px',
              marginBottom: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        {error && (
          <div style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '10px'
          }}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
      <button
        onClick={() => {
          setIsLogin(!isLogin);
          setError('');
          setFormData({ username: '', email: '', password: '' });
        }}
        style={{
          width: '100%',
          padding: '5px',
          backgroundColor: 'transparent',
          color: '#007bff',
          border: '1px solid #007bff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        {isLogin ? 'Need an account? Register' : 'Have an account? Login'}
      </button>
      <div style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>
        Create an account to save characters to the cloud and share them with others!
      </div>
    </div>
  );
};

export default AuthComponent;
