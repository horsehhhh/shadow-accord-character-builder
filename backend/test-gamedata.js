// Test the game data API specifically
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// Import and mount the gamedata routes
const gamedataRoutes = require('./routes/gamedata');
app.use('/api/gamedata', gamedataRoutes);

const PORT = 3001; // Use different port to avoid conflicts

const server = app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log('\nTesting game data endpoints:');
  console.log(`📊 All game data: http://localhost:${PORT}/api/gamedata`);
  console.log(`⚔️  Factions: http://localhost:${PORT}/api/gamedata/factions`);
  console.log(`🏛️  Skills: http://localhost:${PORT}/api/gamedata/skills`);
  console.log('\nPress Ctrl+C to stop the test server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

// Keep the process alive for testing
console.log('🚀 Starting game data test server...');
