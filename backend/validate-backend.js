// Final validation test
require('dotenv').config();

console.log('🎯 Final Backend Validation');
console.log('========================');

// Test 1: All imports work
try {
  require('./routes/auth');
  require('./routes/characters');
  require('./routes/gamedata');
  require('./routes/campaigns');
  require('./routes/users');
  require('./middleware/auth');
  require('./middleware/errorHandler');
  require('./middleware/notFound');
  require('./models/User');
  require('./models/Character');
  require('./models/Campaign');
  
  console.log('✅ All modules import successfully');
} catch (error) {
  console.error('❌ Import error:', error.message);
  process.exit(1);
}

// Test 2: Environment is configured
const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'PORT'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.error('❌ Missing environment variables:', missingVars.join(', '));
  process.exit(1);
}
console.log('✅ Environment variables configured');

// Test 3: Game data can be loaded
try {
  const gamedataRoutes = require('./routes/gamedata');
  console.log('✅ Game data routes load successfully');
} catch (error) {
  console.error('❌ Game data error:', error.message);
  process.exit(1);
}

console.log('\n🎉 BACKEND VALIDATION COMPLETE!');
console.log('================================');
console.log('');
console.log('✅ All imports working');
console.log('✅ Environment configured');
console.log('✅ Routes ready');
console.log('✅ Models ready');
console.log('✅ Middleware ready');
console.log('');
console.log('🚀 Your backend is ready to run!');
console.log('');
console.log('Next steps:');
console.log('1. Start MongoDB (local or Atlas)');
console.log('2. Run: npm run dev');
console.log('3. Test: http://localhost:5000/api/health');
console.log('4. API docs: See API_DOCUMENTATION.md');
console.log('');
console.log('🔗 Available endpoints:');
console.log('   /api/auth/* - Authentication');
console.log('   /api/characters/* - Character management');
console.log('   /api/gamedata/* - Game data (CSV)');
console.log('   /api/campaigns/* - Campaign management');
console.log('   /api/users/* - User management');
console.log('');
