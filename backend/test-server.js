// Quick server test without MongoDB connection
console.log('Testing server startup...');

try {
  const express = require('express');
  console.log('✅ Express loaded');

  const cors = require('cors');
  console.log('✅ CORS loaded');

  const helmet = require('helmet');
  console.log('✅ Helmet loaded');

  const rateLimit = require('express-rate-limit');
  console.log('✅ Rate limiting loaded');

  require('dotenv').config();
  console.log('✅ Environment variables loaded');
  console.log('   PORT:', process.env.PORT || 'not set');
  console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'set' : 'not set');

  // Test route imports
  const authRoutes = require('./routes/auth');
  const characterRoutes = require('./routes/characters');
  const gamedataRoutes = require('./routes/gamedata');
  const campaignRoutes = require('./routes/campaigns');
  const userRoutes = require('./routes/users');
  console.log('✅ All routes loaded successfully');

  // Test middleware imports
  const { errorHandler } = require('./middleware/errorHandler');
  const { notFound } = require('./middleware/notFound');
  console.log('✅ Error handling middleware loaded');

  // Create basic app
  const app = express();
  app.use(express.json());
  
  // Test a simple endpoint
  app.get('/test', (req, res) => {
    res.json({ status: 'OK', message: 'Server is working!' });
  });

  console.log('\n🎉 Server configuration is valid!');
  console.log('\nTo start the full server with MongoDB:');
  console.log('1. Ensure MongoDB is running (local or Atlas)');
  console.log('2. Run: npm run dev');
  console.log('3. Test endpoint: http://localhost:5000/api/health');

} catch (error) {
  console.error('❌ Server test failed:', error.message);
  console.error('Stack trace:', error.stack);
}
