import React, { useState, useEffect } from 'react';
import { gamedataAPI } from '../services/api';

const APITest = () => {
  const [testResults, setTestResults] = useState({
    health: 'Testing...',
    factions: 'Testing...',
    error: null
  });

  const runTests = async () => {
    setTestResults({
      health: 'Testing...',
      factions: 'Testing...',
      error: null
    });
    
    try {
      // Test 1: Health check (direct fetch since it's not in our API service)
      const healthResponse = await fetch('http://localhost:5000/api/health');
      const healthData = await healthResponse.json();
      
      // Test 2: Game data API
      const factions = await gamedataAPI.getFactions();
      
      setTestResults({
        health: `✅ Server Status: ${healthData.status}`,
        factions: `✅ Loaded ${factions.length} factions`,
        error: null
      });
    } catch (error) {
      setTestResults({
        health: '❌ Server connection failed',
        factions: '❌ API connection failed',
        error: error.message
      });
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      border: '2px solid #ccc', 
      padding: '15px', 
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 9999,
      minWidth: '300px'
    }}>
      <h3>🔗 Backend API Status</h3>
      <div>{testResults.health}</div>
      <div>{testResults.factions}</div>
      {testResults.error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          Error: {testResults.error}
        </div>
      )}
      <button 
        onClick={runTests}
        style={{
          marginTop: '10px',
          padding: '5px 10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🔄 Retest Connection
      </button>
      <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
        Backend: http://localhost:5000
      </div>
    </div>
  );
};

export default APITest;
