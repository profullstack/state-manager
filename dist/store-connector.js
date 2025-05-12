/**
 * StoreConnector Component
 * 
 * A web component that connects to the state manager and provides state to its children.
 * This component can be used to connect any part of the DOM to the state manager.
 */

import { createWebComponentIntegration } from './web-components.js';
import defaultStateManager from './index.js';

/**
 * StoreConnector class
 * A web component that connects to the state manager and provides state to its children.
 * @extends HTMLElement
 */
export class StoreConnector extends HTMLElement {
  constructor() {
    super();
    this._stateManager = defaultStateManager;
    this._statePath = '';
    this._unsubscribe = null;
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.innerHTML = '<slot></slot>';
  }

  /**
   * Observed attributes
   * @returns {string[]} Array of attribute names to observe
   */
  static get observedAttributes() {
    return ['path'];
  }

  /**
   * Called when an observed attribute changes
   * @param {string} name - Attribute name
   * @param {string} oldValue - Old attribute value
   * @param {string} newValue - New attribute value
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'path' && oldValue !== newValue) {
      this._statePath = newValue;
      this._subscribeToState();
    }
  }

  /**
   * Called when the element is added to the DOM
   */
  connectedCallback() {
    this._subscribeToState();
  }

  /**
   * Called when the element is removed from the DOM
   */
  disconnectedCallback() {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }
  }

  /**
   * Subscribe to state changes
   * @private
   */
  _subscribeToState() {
    // Unsubscribe if already subscribed
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = null;
    }

    // Subscribe to state changes
    if (this._statePath) {
      this._unsubscribe = this._stateManager.subscribe(
        this._handleStateChange.bind(this),
        this._statePath
      );

      // Initial state update
      const state = this._stateManager.getState(this._statePath);
      this._updateState(state);
    }
  }

  /**
   * Handle state changes
   * @param {any} state - New state
   * @private
   */
  _handleStateChange(state) {
    this._updateState(state);
  }

  /**
   * Update state and dispatch event
   * @param {any} state - New state
   * @private
   */
  _updateState(state) {
    // Dispatch state-change event
    const event = new CustomEvent('state-change', {
      detail: { state },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);

    // Update data attributes for simple state values
    if (typeof state === 'object' && state !== null) {
      Object.entries(state).forEach(([key, value]) => {
        if (typeof value !== 'object' || value === null) {
          this.setAttribute(`data-${key}`, value);
        }
      });
    }
  }

  /**
   * Get state from the state manager
   * @returns {any} The current state
   */
  getState() {
    return this._stateManager.getState(this._statePath);
  }

  /**
   * Update state in the state manager
   * @param {Object|Function} update - Object to merge with state or function that returns an update object
   * @param {Object} options - Update options
   * @returns {Object} The new state
   */
  setState(update, options) {
    if (this._statePath) {
      // If path is specified, update only that part of the state
      const fullUpdate = {};
      const pathParts = this._statePath.split('.');
      let current = fullUpdate;

      // Build the nested object structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        current[pathParts[i]] = {};
        current = current[pathParts[i]];
      }

      // Set the value at the final path
      if (typeof update === 'function') {
        const currentState = this._stateManager.getState(this._statePath);
        current[pathParts[pathParts.length - 1]] = update(currentState);
      } else {
        current[pathParts[pathParts.length - 1]] = update;
      }

      return this._stateManager.setState(fullUpdate, options);
    } else {
      // If no path, update the entire state
      return this._stateManager.setState(update, options);
    }
  }
}

// Define the custom element
if (!customElements.get('store-connector')) {
  customElements.define('store-connector', StoreConnector);
}

export default StoreConnector;