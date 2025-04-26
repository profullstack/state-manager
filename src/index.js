/**
 * Simple State Manager - A Svelte-inspired reactive state management system
 * 
 * This provides a simpler API for state management compared to traditional implementations.
 * It uses JavaScript Proxies to create a reactive state object that automatically
 * triggers updates when properties change.
 */

// Store a global reference to all created stores
const stores = new Map();

/**
 * Create a reactive store with the given initial state
 * @param {string} name - Unique name for this store
 * @param {object} initialState - Initial state object
 * @returns {object} - Store object with state and methods
 */
export function createStore(name, initialState = {}) {
  if (stores.has(name)) {
    console.warn(`Store with name "${name}" already exists. Returning existing store.`);
    return stores.get(name);
  }
  
  // Track all subscribers
  const subscribers = new Map();
  
  // Track all property-specific subscribers
  const propSubscribers = new Map();
  
  // The actual state object
  let stateObj = { ...initialState };
  
  // Create a proxy to track state access and changes
  const state = new Proxy(stateObj, {
    get(target, prop) {
      // Just return the value
      return target[prop];
    },
    
    set(target, prop, value) {
      const oldValue = target[prop];
      
      // Update the value
      target[prop] = value;
      
      // Only notify if the value actually changed
      if (oldValue !== value) {
        // Notify property-specific subscribers
        if (propSubscribers.has(prop)) {
          propSubscribers.get(prop).forEach(callback => {
            try {
              callback(value, oldValue);
            } catch (error) {
              console.error(`Error in subscriber callback for ${prop}:`, error);
            }
          });
        }
        
        // Notify global subscribers
        subscribers.forEach(callback => {
          try {
            callback({ [prop]: value }, prop);
          } catch (error) {
            console.error('Error in global subscriber callback:', error);
          }
        });
      }
      
      return true;
    }
  });
  
  // Create the store object
  const store = {
    // The reactive state object
    state,
    
    // Get the current state value
    get(prop) {
      return state[prop];
    },
    
    // Set a state value
    set(prop, value) {
      state[prop] = value;
      return value;
    },
    
    // Update multiple state values at once
    update(updates) {
      Object.entries(updates).forEach(([key, value]) => {
        state[key] = value;
      });
    },
    
    // Subscribe to all state changes
    subscribe(callback) {
      const id = Symbol();
      subscribers.set(id, callback);
      
      // Return unsubscribe function
      return () => {
        subscribers.delete(id);
      };
    },
    
    // Subscribe to changes for a specific property
    on(prop, callback) {
      if (!propSubscribers.has(prop)) {
        propSubscribers.set(prop, new Map());
      }
      
      const id = Symbol();
      propSubscribers.get(prop).set(id, callback);
      
      // Return unsubscribe function
      return () => {
        if (propSubscribers.has(prop)) {
          propSubscribers.get(prop).delete(id);
        }
      };
    },
    
    // Get a snapshot of the current state
    getState() {
      return { ...stateObj };
    }
  };
  
  // Store the store
  stores.set(name, store);
  
  return store;
}

/**
 * Get an existing store by name
 * @param {string} name - Name of the store to get
 * @returns {object|null} - The store object or null if not found
 */
export function getStore(name) {
  return stores.get(name) || null;
}

/**
 * Create a default global store
 */
export const defaultStore = createStore('default', {});

/**
 * Create a mixin for web components to easily connect to a store
 * @param {object} store - The store to connect to
 * @returns {function} - A mixin function
 */
export function StoreConnector(store = defaultStore) {
  return (BaseClass) => {
    return class extends BaseClass {
      constructor() {
        super();
        this._unsubscribers = [];
        this._boundElements = new Map();
      }
      
      // Connect an element to a state property
      bindElement(element, prop, formatter = (v) => v) {
        if (!element) return;
        
        // Store the original element content as a template if it contains ${prop} syntax
        let template = null;
        if (element.textContent && element.textContent.includes('${')) {
          template = element.textContent;
        }
        
        const updateElement = (value) => {
          if (template) {
            // Replace all ${propName} occurrences with actual values
            let content = template;
            content = content.replace(/\${([^}]+)}/g, (match, propName) => {
              return propName === prop ? formatter(value) : match;
            });
            element.textContent = content;
          } else {
            element.textContent = formatter(value);
          }
        };
        
        // Initial update
        updateElement(store.state[prop]);
        
        // Subscribe to changes
        const unsub = store.on(prop, updateElement);
        this._unsubscribers.push(unsub);
        
        // Store the binding
        this._boundElements.set(element, { prop, unsub });
        
        return this;
      }
      
      // Bind an input element to a state property (two-way binding)
      bindInput(input, prop) {
        if (!input) return;
        
        // Set initial value
        input.value = store.state[prop] || '';
        
        // Listen for input changes
        const handler = () => {
          store.state[prop] = input.value;
        };
        
        input.addEventListener('input', handler);
        
        // Subscribe to state changes
        const unsub = store.on(prop, (value) => {
          if (input.value !== value) {
            input.value = value;
          }
        });
        
        this._unsubscribers.push(unsub);
        this._unsubscribers.push(() => input.removeEventListener('input', handler));
        
        return this;
      }
      
      // Connect to specific state properties and update when they change
      connect(props, callback) {
        if (!Array.isArray(props)) {
          props = [props];
        }
        
        // Create a handler that checks if any of the watched props changed
        const handler = (update, changedProp) => {
          if (props.includes(changedProp)) {
            callback(store.state);
          }
        };
        
        // Subscribe to state changes
        const unsub = store.subscribe(handler);
        this._unsubscribers.push(unsub);
        
        // Initial call
        callback(store.state);
        
        return this;
      }
      
      // Clean up all subscriptions when the element is removed
      disconnectedCallback() {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
        
        // Call the parent disconnectedCallback if it exists
        if (super.disconnectedCallback) {
          super.disconnectedCallback();
        }
      }
    };
  };
}

/**
 * Create a reactive element that automatically updates when state changes
 * @param {string} tagName - The tag name for the custom element
 * @param {object} options - Options for the element
 * @param {object} store - The store to connect to
 */
export function defineReactiveElement(tagName, options, store = defaultStore) {
  const { template, styles, props = [] } = options;
  
  class ReactiveElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._unsubscribers = [];
    }
    
    connectedCallback() {
      this.render();
      this.setupBindings();
    }
    
    disconnectedCallback() {
      this._unsubscribers.forEach(unsub => unsub());
      this._unsubscribers = [];
    }
    
    render() {
      // Create a template element
      const templateEl = document.createElement('template');
      
      // Add styles and content
      templateEl.innerHTML = `
        <style>${styles || ''}</style>
        ${typeof template === 'function' ? template(store.state) : template}
      `;
      
      // Clear and append
      this.shadowRoot.innerHTML = '';
      this.shadowRoot.appendChild(templateEl.content.cloneNode(true));
    }
    
    setupBindings() {
      // Find all elements with data-bind attribute
      const boundElements = this.shadowRoot.querySelectorAll('[data-bind]');
      boundElements.forEach(el => {
        const prop = el.getAttribute('data-bind');
        if (props.includes(prop)) {
          // Update element when state changes
          const updateEl = () => {
            el.textContent = store.state[prop];
          };
          
          // Initial update
          updateEl();
          
          // Subscribe to changes
          const unsub = store.on(prop, updateEl);
          this._unsubscribers.push(unsub);
        }
      });
      
      // Find all inputs with data-model attribute (two-way binding)
      const modelElements = this.shadowRoot.querySelectorAll('[data-model]');
      modelElements.forEach(el => {
        const prop = el.getAttribute('data-model');
        if (props.includes(prop)) {
          // Set initial value
          el.value = store.state[prop] || '';
          
          // Listen for input changes
          const handler = () => {
            store.state[prop] = el.value;
          };
          
          el.addEventListener('input', handler);
          
          // Subscribe to state changes
          const unsub = store.on(prop, (value) => {
            if (el.value !== value) {
              el.value = value;
            }
          });
          
          this._unsubscribers.push(unsub);
          this._unsubscribers.push(() => el.removeEventListener('input', handler));
        }
      });
      
      // Find all elements with data-click attribute
      const clickElements = this.shadowRoot.querySelectorAll('[data-click]');
      clickElements.forEach(el => {
        const actionName = el.getAttribute('data-click');
        if (typeof this[actionName] === 'function') {
          el.addEventListener('click', this[actionName].bind(this));
        }
      });
    }
  }
  
  // Define the custom element
  customElements.define(tagName, ReactiveElement);
  
  return ReactiveElement;
}

// Export a default instance
export default {
  createStore,
  getStore,
  defaultStore,
  StoreConnector,
  defineReactiveElement
};