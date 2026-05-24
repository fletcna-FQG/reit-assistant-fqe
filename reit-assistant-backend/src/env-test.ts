console.log('🔍 1. Script started');

try {
  console.log('🔍 2. Importing dotenv...');
  import('dotenv').then(() => console.log('✅ dotenv loaded'));
  
  console.log('🔍 3. Importing env config...');
  import('./config/env').then((envModule) => {
    console.log('✅ env config loaded successfully');
    console.log('📦 Config object:', envModule.config);
  }).catch(err => {
    console.error('❌ Failed to load env config:', err);
  });
} catch (err) {
  console.error('❌ Unexpected error:', err);
}