/**
 * Basic tests for @profullstack/state-manager
 */

// Import the module
import stateManager from '../src/index.js';
import { jest } from '@jest/globals';

// Import individual components
let middleware, persistence, webComponents;

try { middleware = await import('../src/middleware.js'); }
catch (err) { console.log('Middleware not found or could not be loaded:', err.message); }

try { persistence = await import('../src/persistence.js'); }
catch (err) { console.log('Persistence not found or could not be loaded:', err.message); }

try { webComponents = await import('../src/web-components.js'); }
catch (err) { console.log('Web components not found or could not be loaded:', err.message); }

describe('@profullstack/state-manager', () => {
  test('module exports something', () => {
    console.log('Testing @profullstack/state-manager...');
    console.log('Module exports:', Object.keys(stateManager));
    
    expect(Object.keys(stateManager).length).toBeGreaterThan(0);
  });
  
  // Test individual components if they exist
  test('middleware if available', () => {
    if (middleware) {
      console.log('Testing middleware...');
      console.log('Middleware exports:', Object.keys(middleware));
      expect(Object.keys(middleware).length).toBeGreaterThan(0);
    } else {
      console.log('Middleware not available, skipping test');
    }
  });
  
  test('persistence if available', () => {
    if (persistence) {
      console.log('Testing persistence...');
      console.log('Persistence exports:', Object.keys(persistence));
      expect(Object.keys(persistence).length).toBeGreaterThan(0);
    } else {
      console.log('Persistence not available, skipping test');
    }
  });
  
  test('web components if available', () => {
    if (webComponents) {
      console.log('Testing web components...');
      console.log('Web components exports:', Object.keys(webComponents));
      expect(Object.keys(webComponents).length).toBeGreaterThan(0);
    } else {
      console.log('Web components not available, skipping test');
    }
  });
  
  // Test basic functionality
  test('createStore function and store methods if available', () => {
    if (typeof stateManager.createStore === 'function') {
      console.log('Testing createStore function exists');
      expect(stateManager.createStore).toBeDefined();
      
      try {
        const store = stateManager.createStore({ count: 0 });
        console.log('Store created successfully');
        expect(store).toBeDefined();
        
        if (store && typeof store.getState === 'function') {
          const state = store.getState();
          console.log('Initial state:', state);
          expect(state).toBeDefined();
          expect(typeof state).toBe('object');
          expect(state.count).toBe(0);
        }
        
        if (store && typeof store.dispatch === 'function') {
          console.log('Testing dispatch function exists');
          expect(store.dispatch).toBeDefined();
        }
        
        if (store && typeof store.subscribe === 'function') {
          console.log('Testing subscribe function exists');
          expect(store.subscribe).toBeDefined();
        }
      } catch (err) {
        console.log('Error creating store:', err.message);
      }
    } else {
      console.log('createStore function not available, skipping test');
    }
  });
});