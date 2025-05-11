# @profullstack/state-manager

Enhanced state manager with web component integration, persistence, and subscription management.

## Features

- **Path-Based State Access**: Access and update nested state using dot notation paths
- **Immutable Updates**: Immutable state updates to prevent unintended side effects
- **Persistence**: Configurable state persistence with multiple storage adapters
- **Web Component Integration**: Seamless integration with web components
- **Middleware Support**: Extensible middleware system for intercepting state changes
- **Selectors**: Memoized selectors for derived state
- **TypeScript Support**: Full TypeScript type definitions
- **Framework Agnostic**: Works with any framework or vanilla JavaScript

## Installation

```bash
npm install @profullstack/state-manager
```

## Basic Usage

```javascript
import { createStateManager } from '@profullstack/state-manager';

// Create a state manager with initial state
const stateManager = createStateManager({
  user: {
    name: 'John Doe',
    preferences: {
      theme: 'light'
    }
  },
  todos: [
    { id: 1, text: 'Learn state management', completed: false }
  ]
});

// Get state
const user = stateManager.getState('user');
const theme = stateManager.getState('user.preferences.theme');
const firstTodo = stateManager.getState('todos.0');

// Update state
stateManager.setState({
  'user.preferences.theme': 'dark'
});

// Update state with a function
stateManager.setState(state => ({
  todos: [
    ...state.todos,
    { id: 2, text: 'Build an app', completed: false }
  ]
}));

// Subscribe to state changes
const unsubscribe = stateManager.subscribe((state, changedPaths) => {
  console.log('State changed:', state);
  console.log('Changed paths:', changedPaths);
});

// Subscribe to specific path
const themeUnsubscribe = stateManager.subscribe((theme, path) => {
  console.log(`Theme changed to: ${theme}`);
}, 'user.preferences.theme');

// Unsubscribe when done
unsubscribe();
themeUnsubscribe();
```

## API Reference

### Creating a State Manager

```javascript
import { createStateManager } from '@profullstack/state-manager';

const stateManager = createStateManager(initialState, {
  // Whether to use immutable state (default: true)
  immutable: true,
  
  // Whether to enable persistence (default: false)
  enablePersistence: true,
  
  // Key for persistence storage (default: 'app_state')
  persistenceKey: 'my_app_state',
  
  // Persistence adapter (default: localStorage)
  persistenceAdapter: null,
  
  // Keys to persist (default: all)
  persistentKeys: ['user', 'settings'],
  
  // Whether to enable debug logging (default: false)
  debug: false
});
```

### State Operations

#### Getting State

```javascript
// Get entire state
const state = stateManager.getState();

// Get specific path
const user = stateManager.getState('user');

// Get nested path
const theme = stateManager.getState('user.preferences.theme');

// Get array item
const firstTodo = stateManager.getState('todos.0');

// Get with array path
const theme = stateManager.getState(['user', 'preferences', 'theme']);
```

#### Updating State

```javascript
// Update top-level properties
stateManager.setState({
  user: { name: 'Jane Doe' },
  loading: false
});

// Update nested properties
stateManager.setState({
  'user.preferences.theme': 'dark',
  'todos.0.completed': true
});

// Update with a function (for state that depends on previous state)
stateManager.setState(state => ({
  counter: state.counter + 1,
  todos: [...state.todos, { id: Date.now(), text: 'New todo', completed: false }]
}));

// Update with options
stateManager.setState({ loading: false }, {
  // Don't notify subscribers (default: false)
  silent: true,
  
  // Don't persist the update (default: false if persistence is enabled)
  persist: false
});
```

#### Resetting State

```javascript
// Reset to empty state
stateManager.resetState();

// Reset to new initial state
stateManager.resetState({
  user: { name: 'New User' },
  todos: []
});

// Reset with options
stateManager.resetState(newState, {
  // Don't notify subscribers (default: false)
  silent: true,
  
  // Don't persist the reset (default: false if persistence is enabled)
  persist: false
});
```

### Subscriptions

#### Subscribing to State Changes

```javascript
// Subscribe to all state changes
const unsubscribe = stateManager.subscribe((state, changedPaths) => {
  console.log('State changed:', state);
  console.log('Changed paths:', changedPaths);
});

// Subscribe to specific path
const userUnsubscribe = stateManager.subscribe((userData, path, fullState) => {
  console.log(`User changed: ${userData.name}`);
}, 'user');

// Subscribe to nested path
const themeUnsubscribe = stateManager.subscribe((theme, path, fullState) => {
  console.log(`Theme changed to: ${theme}`);
}, 'user.preferences.theme');

// Subscribe to multiple paths
const multiUnsubscribe = stateManager.subscribe((value, path, fullState) => {
  console.log(`Path ${path} changed to:`, value);
}, ['user.name', 'todos']);
```

#### Unsubscribing

```javascript
// Unsubscribe using the returned function
unsubscribe();
userUnsubscribe();

// Unsubscribe a specific callback from all subscriptions
stateManager.unsubscribe(myCallback);
```

### Selectors

```javascript
// Create a selector for derived state
const getCompletedTodos = stateManager.createSelector(state => {
  return state.todos.filter(todo => todo.completed);
});

// Use the selector
const completedTodos = getCompletedTodos();

// Create a selector with custom equality function
const getTodoById = stateManager.createSelector(
  (state, id) => state.todos.find(todo => todo.id === id),
  (a, b) => a && b && a.id === b.id && a.completed === b.completed
);

// Use the selector with arguments
const todo = getTodoById(1);
```

### Middleware

```javascript
import { createStateManager, createLoggerMiddleware } from '@profullstack/state-manager';

const stateManager = createStateManager(initialState);

// Create logger middleware
const logger = createLoggerMiddleware({
  logBefore: true,
  logAfter: true,
  logger: console.log
});

// Add middleware
stateManager.use('beforeUpdate', logger.beforeUpdate);
stateManager.use('afterUpdate', logger.afterUpdate);

// Add custom middleware
stateManager.use('beforeUpdate', (update, state) => {
  // Validate update
  if (update.user && !update.user.name) {
    throw new Error('User name is required');
  }
  return update;
});

// Remove middleware
const removeMiddleware = stateManager.use('afterUpdate', (state, changedPaths) => {
  // Do something after update
  return state;
});

removeMiddleware(); // Remove the middleware
```

### Persistence

```javascript
import { 
  createStateManager, 
  createLocalStorageAdapter,
  createSessionStorageAdapter,
  createIndexedDBAdapter
} from '@profullstack/state-manager';

// Use localStorage (default)
const stateManager1 = createStateManager(initialState, {
  enablePersistence: true,
  persistenceKey: 'app_state'
});

// Use sessionStorage
const stateManager2 = createStateManager(initialState, {
  enablePersistence: true,
  persistenceKey: 'app_state',
  persistenceAdapter: createSessionStorageAdapter()
});

// Use IndexedDB
const stateManager3 = createStateManager(initialState, {
  enablePersistence: true,
  persistenceKey: 'app_state',
  persistenceAdapter: createIndexedDBAdapter('myDB', 'state')
});

// Persist only specific keys
const stateManager4 = createStateManager(initialState, {
  enablePersistence: true,
  persistentKeys: ['user', 'settings']
});

// Manually save/load state
stateManager.persistence.save(state);
const savedState = stateManager.persistence.load();
stateManager.persistence.clear();
```

## Web Component Integration

### Creating Connected Components

```javascript
import { createStateManager } from '@profullstack/state-manager';

const stateManager = createStateManager(initialState);
const { createConnectedComponent } = stateManager.webComponents;

// Create a connected component
class TodoListElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  // Called when state changes
  stateChanged(state, path, fullState) {
    this.render();
  }
  
  // Render the component
  render() {
    const todos = this.getState('todos');
    
    this.shadowRoot.innerHTML = `
      <ul>
        ${todos.map(todo => `
          <li class="${todo.completed ? 'completed' : ''}">
            ${todo.text}
          </li>
        `).join('')}
      </ul>
    `;
  }
}

// Register the component
createConnectedComponent('todo-list', TodoListElement, {
  statePaths: ['todos'],
  mapStateToProps: state => ({
    completedCount: state.todos.filter(todo => todo.completed).length
  }),
  actions: {
    addTodo(text) {
      this.setState(state => ({
        todos: [
          ...state.todos,
          { id: Date.now(), text, completed: false }
        ]
      }));
    },
    toggleTodo(id) {
      this.setState(state => ({
        todos: state.todos.map(todo =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        )
      }));
    }
  }
});

// Use the component in HTML
// <todo-list></todo-list>
```

### Using the State Mixin

```javascript
import { createStateManager, StateMixin } from '@profullstack/state-manager';

const stateManager = createStateManager(initialState);
const withState = StateMixin(stateManager);

// Create a component with state
class MyComponent extends withState({
  statePaths: ['user'],
  mapStateToProps: state => ({
    userName: state.user.name,
    theme: state.user.preferences.theme
  })
})(HTMLElement) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }
  
  connectedCallback() {
    super.connectedCallback();
    this.render();
  }
  
  stateChanged(state, path, fullState) {
    this.render();
  }
  
  render() {
    this.shadowRoot.innerHTML = `
      <div class="theme-${this.theme}">
        <h1>Hello, ${this.userName}!</h1>
      </div>
    `;
  }
}

customElements.define('my-component', MyComponent);
```

### LitElement Integration

```javascript
import { LitElement, html } from 'lit';
import { createStateManager } from '@profullstack/state-manager';

const stateManager = createStateManager(initialState);
const { createLitElementConnector } = stateManager.webComponents;

// Create a LitElement connector
const withState = createLitElementConnector({
  statePaths: ['todos'],
  mapStateToProps: state => ({
    todos: state.todos,
    completedCount: state.todos.filter(todo => todo.completed).length
  })
});

// Create a LitElement component with state
class TodoList extends withState(LitElement) {
  static properties = {
    todos: { type: Array },
    completedCount: { type: Number }
  };
  
  render() {
    return html`
      <h2>Todo List (${this.completedCount}/${this.todos.length} completed)</h2>
      <ul>
        ${this.todos.map(todo => html`
          <li class="${todo.completed ? 'completed' : ''}">
            <input type="checkbox" ?checked=${todo.completed} @change=${() => this.toggleTodo(todo.id)}>
            ${todo.text}
          </li>
        `)}
      </ul>
      <button @click=${this.addTodo}>Add Todo</button>
    `;
  }
  
  addTodo() {
    this.setState(state => ({
      todos: [
        ...state.todos,
        { id: Date.now(), text: `New todo ${Date.now()}`, completed: false }
      ]
    }));
  }
  
  toggleTodo(id) {
    this.setState(state => ({
      todos: state.todos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    }));
  }
}

customElements.define('todo-list', TodoList);
```

## Examples

See the [examples](./examples) directory for complete usage examples.

## License

MIT