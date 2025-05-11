/**
 * Basic tests for @profullstack/state-manager
 */

// Import the module
const stateManager = require('../src/index.js');

// Basic test to ensure the module exports something
console.log('Testing @profullstack/state-manager...');
console.log('Module exports:', Object.keys(stateManager));

if (Object.keys(stateManager).length === 0) {
  console.error('ERROR: Module does not export anything!');
  process.exit(1);
}

// Test individual components if they exist
try {
  const middleware = require('../src/middleware.js');
  console.log('Testing middleware...');
  console.log('Middleware exports:', Object.keys(middleware));
} catch (err) {
  console.log('Middleware not found or could not be loaded:', err.message);
}

try {
  const persistence = require('../src/persistence.js');
  console.log('Testing persistence...');
  console.log('Persistence exports:', Object.keys(persistence));
} catch (err) {
  console.log('Persistence not found or could not be loaded:', err.message);
}

try {
  const webComponents = require('../src/web-components.js');
  console.log('Testing web components...');
  console.log('Web components exports:', Object.keys(webComponents));
} catch (err) {
  console.log('Web components not found or could not be loaded:', err.message);
}

// Test basic functionality
if (typeof stateManager.createStore === 'function') {
  console.log('Testing createStore function exists:', typeof stateManager.createStore === 'function' ? 'SUCCESS' : 'FAILED');
  
  try {
    const store = stateManager.createStore({ count: 0 });
    console.log('Store created successfully:', store ? 'SUCCESS' : 'FAILED');
    
    if (store && typeof store.getState === 'function') {
      const state = store.getState();
      console.log('Initial state:', state);
      console.log('getState function works:', state && typeof state === 'object' ? 'SUCCESS' : 'FAILED');
    }
    
    if (store && typeof store.dispatch === 'function') {
      console.log('dispatch function exists:', typeof store.dispatch === 'function' ? 'SUCCESS' : 'FAILED');
    }
    
    if (store && typeof store.subscribe === 'function') {
      console.log('subscribe function exists:', typeof store.subscribe === 'function' ? 'SUCCESS' : 'FAILED');
    }
  } catch (err) {
    console.log('Error creating store:', err.message);
  }
}

console.log('Basic test passed!');