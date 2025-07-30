// Simple test to verify all imports work
console.log('Testing backend imports...');

try {
  // Test middleware imports
  const { auth, requireRole, optionalAuth, authorize } = require('./middleware/auth');
  console.log('✅ Auth middleware imported successfully');

  const { notFound } = require('./middleware/notFound');
  console.log('✅ NotFound middleware imported successfully');

  const { errorHandler } = require('./middleware/errorHandler');
  console.log('✅ ErrorHandler middleware imported successfully');

  // Test model imports
  const User = require('./models/User');
  console.log('✅ User model imported successfully');

  const Character = require('./models/Character');
  console.log('✅ Character model imported successfully');

  const Campaign = require('./models/Campaign');
  console.log('✅ Campaign model imported successfully');

  // Test route imports
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes imported successfully');

  const characterRoutes = require('./routes/characters');
  console.log('✅ Character routes imported successfully');

  const gamedataRoutes = require('./routes/gamedata');
  console.log('✅ Gamedata routes imported successfully');

  const campaignRoutes = require('./routes/campaigns');
  console.log('✅ Campaign routes imported successfully');

  const userRoutes = require('./routes/users');
  console.log('✅ User routes imported successfully');

  console.log('\n🎉 All imports successful! Backend is ready.');
  console.log('\nTo start the server:');
  console.log('1. Make sure MongoDB is running');
  console.log('2. Create .env file from .env.template');
  console.log('3. Run: npm run dev');

} catch (error) {
  console.error('❌ Import error:', error.message);
  console.error('\nStack trace:', error.stack);
}
