import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { ToastProvider } from './components/ToastProvider';

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Removed React.StrictMode for better performance in development
  <ToastProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ToastProvider>
);