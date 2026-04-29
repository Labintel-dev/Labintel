import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

const IGNORED_CONSOLE_MESSAGES = [
  'Using DEFAULT root logger',
];

const IGNORED_ASYNC_LISTENER_MESSAGE =
  'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received';

const shouldIgnoreMessage = (value) => {
  const text = typeof value === 'string' ? value : value?.message || '';
  return (
    IGNORED_CONSOLE_MESSAGES.some((message) => text.includes(message)) ||
    text.includes(IGNORED_ASYNC_LISTENER_MESSAGE)
  );
};

const originalWarn = console.warn.bind(console);
console.warn = (...args) => {
  if (args.some(shouldIgnoreMessage)) return;
  originalWarn(...args);
};

window.addEventListener('error', (event) => {
  if (shouldIgnoreMessage(event.message) || shouldIgnoreMessage(event.error)) {
    event.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (shouldIgnoreMessage(event.reason)) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
