import React, { useState, useEffect } from 'react';
import { authAPI, migrationUtils } from '../services/api';

const AuthComponent = ({ onAuthChange, onLoginSuccess }) => {
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
  const [user, setUser] = useState(migrationUtils.getCurrentUser());

  // Try to fetch user profile if authenticated but no user object
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && !user) {
        console.log('🔄 No user object found, fetching profile...');
        try {
          const response = await authAPI.getProfile();
          console.log('👤 Fetched user profile:', response.data);
          const userData = response.data.user || response.data;
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        } catch (err) {
          console.error('❌ Failed to fetch user profile:', err);
        }
      }
    };

    fetchUserProfile();
  }, [isAuthenticated, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let userData;
      if (isLogin) {
        const loginResponse = await authAPI.login(formData.email, formData.password);
        userData = loginResponse.user;
      } else {
        const registerResponse = await authAPI.register(formData.username, formData.email, formData.password);
        userData = registerResponse.user;
      }
      
      setIsAuthenticated(true);
      setUser(userData || migrationUtils.getCurrentUser()); // Update local user state
      onAuthChange(true);
      
      // Call the login success callback if provided
      if (onLoginSuccess) {
        try {
          await onLoginSuccess();
        } catch (error) {
          console.error('Error in login success callback:', error);
        }
      }
      
      setFormData({ username: '', email: '', password: '' });
    } catch (err) {
      let errorMessage = err.response?.data?.message || err.message || 'Authentication failed';
      
      // Handle version incompatibility errors
      if (err.isVersionError) {
        errorMessage = err.message;
        // Optionally show a more prominent version error
        alert(`❌ Version Incompatible\n\n${err.message}\n\nPlease download the latest version to continue using cloud features.`);
      }
      
      setError(errorMessage);
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
    if (isMinimized) {
      return (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          padding: '6px 10px',
          borderRadius: '15px',
          boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
          zIndex: 9999,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 'normal',
          opacity: '0.8'
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
        right: '10px',
        background: 'white',
        border: '1px solid #28a745',
        padding: '12px',
        borderRadius: '6px',
        boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
        zIndex: 9999,
        minWidth: '220px',
        opacity: '0.95'
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
        right: '10px',
        background: '#6c757d',
        color: 'white',
        border: 'none',
        padding: '6px 10px',
        borderRadius: '15px',
        boxShadow: '0 1px 5px rgba(0,0,0,0.1)',
        zIndex: 9999,
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'normal',
        opacity: '0.7'
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
      right: '10px',
      background: 'white',
      border: '1px solid #6c757d',
      padding: '12px',
      borderRadius: '6px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.08)',
      zIndex: 9999,
      minWidth: '280px',
      opacity: '0.95'
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
      
      {/* Optional Login Information */}
      <div style={{ 
        backgroundColor: '#e7f3ff', 
        border: '1px solid #b3d9ff',
        borderRadius: '4px',
        padding: '8px',
        marginBottom: '12px',
        fontSize: '11px',
        color: '#0066cc'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '3px' }}>ℹ️ Account Optional</div>
        <div>The app works fully without an account! Only create one if you want:</div>
        <div style={{ marginTop: '2px' }}>
          • 💾 Cloud sync across devices<br/>
          • 🔄 Character backup & restore<br/>
          • 🚀 Access from anywhere
        </div>
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
