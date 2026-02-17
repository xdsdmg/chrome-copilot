import { DeepSeekProvider } from './src/api/providers/deepseek.js';

async function testDeepSeekProvider() {
  console.log('Testing DeepSeek provider...');
  
  // Test validation
  console.log('1. Testing validation...');
  try {
    DeepSeekProvider.validateInputs('sk-test', 'test prompt', 'deepseek-chat');
    console.log('✓ Validation passed for valid inputs');
  } catch (error) {
    console.error('✗ Validation failed:', error.message);
  }
  
  try {
    DeepSeekProvider.validateInputs('invalid', 'test', 'model');
    console.error('✗ Validation should have failed for invalid API key');
  } catch (error) {
    console.log('✓ Validation correctly rejected invalid API key');
  }
  
  // Test token estimation
  console.log('\n2. Testing token estimation...');
  const tokens = DeepSeekProvider.estimateTokens('Hello world');
  console.log(`✓ Estimated tokens for "Hello world": ${tokens}`);
  
  // Test available models
  console.log('\n3. Testing available models...');
  const models = DeepSeekProvider.getAvailableModels();
  console.log(`✓ Available models: ${models.map(m => m.name).join(', ')}`);
  
  // Test model info
  const modelInfo = DeepSeekProvider.getModelInfo('deepseek-chat');
  console.log(`✓ Model info for deepseek-chat:`, modelInfo);
  
  // Test connection with invalid API key (should fail with authentication error)
  console.log('\n4. Testing connection with invalid API key (expected to fail)...');
  try {
    await DeepSeekProvider.call('sk-invalidkey', 'Test prompt', 'deepseek-chat', { maxTokens: 10 });
    console.error('✗ API call should have failed with invalid key');
  } catch (error) {
    console.log(`✓ API call failed as expected: ${error.message}`);
  }
  
  console.log('\nAll tests completed!');
  console.log('\nNote: To test with real API key, set DEEPSEEK_API_KEY env var and run:');
  console.log('   node -e "import(\'./src/api/providers/deepseek.js\').then(m => m.DeepSeekProvider.testConnection(process.env.DEEPSEEK_API_KEY).then(console.log).catch(console.error))"');
}

testDeepSeekProvider().catch(console.error);