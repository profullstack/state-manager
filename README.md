# @profullstack/state-manager

A simplified state management system inspired by Svelte's reactivity model.

## Features

- Uses JavaScript Proxies to create reactive state objects
- Automatically triggers updates when properties change
- Provides a clean, intuitive API similar to Svelte's approach
- Includes utilities for binding elements directly to state properties
- Works with web components and vanilla JavaScript

## Installation

```bash
npm install @profullstack/state-manager
# or
pnpm add @profullstack/state-manager
# or
yarn add @profullstack/state-manager
```

## Usage

### Basic Usage

```javascript
import { createStore } from '@profullstack/state-manager';

// Create a store
const store = createStore('app', {
  count: 0,
  theme: 'light',
  user: { loggedIn: false }
});

// Update state directly
store.state.count++;
store.state.theme = 'dark';

// Get state
const { count, theme } = store.state;
console.log(count, theme); // 1, 'dark'

// Subscribe to changes
store.subscribe(({ count }) => {
  console.log('Count changed:', count);
});

// Subscribe to specific property changes
store.on('theme', (newTheme) => {
  console.log('Theme changed to:', newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
});
```

### With Web Components

```javascript
import { createStore, StoreConnector } from '@profullstack/state-manager';

// Create a store
const counterStore = createStore('counter', {
  count: 0,
  theme: 'light'
});

// Define a component that uses the store
class CounterBase extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Bind elements to state properties
    this.bindElement(
      this.shadowRoot.querySelector('.counter-value'),
      'count',
      (value) => `Counter: ${value}`
    );
  }
  
  render() {
    const { count } = counterStore.state;
    
    this.shadowRoot.innerHTML = `
      <div>
        <div class="counter-value">Counter: ${count}</div>
        <button id="increment">Increment</button>
      </div>
    `;
  }
  
  setupEventListeners() {
    this.shadowRoot.getElementById('increment').addEventListener('click', () => {
      counterStore.state.count++;
    });
  }
}

// Create the connected component using the StoreConnector mixin
const Counter = StoreConnector(counterStore)(CounterBase);

// Register the custom element
customElements.define('my-counter', Counter);
```

## API

### `createStore(name, initialState)`

Creates a new store with the given name and initial state.

- `name`: A unique name for the store
- `initialState`: The initial state object

Returns a store object with the following properties:

- `state`: The reactive state object
- `subscribe(callback)`: Subscribe to all state changes
- `on(property, callback)`: Subscribe to changes for a specific property
- `get(property)`: Get a state value
- `set(property, value)`: Set a state value
- `update(updates)`: Update multiple state values at once
- `getState()`: Get a snapshot of the current state

### `StoreConnector(store)`

A mixin factory that connects a web component to a store.

- `store`: The store to connect to

Returns a mixin function that adds the following methods to the component:

- `bindElement(element, property, formatter)`: Bind an element to a state property
- `bindInput(input, property)`: Bind an input element to a state property (two-way binding)
- `connect(properties, callback)`: Connect to specific state properties and update when they change

## License

MIT