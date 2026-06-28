import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#e0e0e0',
            border: '1px solid #2a2a2a',
          },
          success: { iconTheme: { primary: '#2ed573', secondary: '#1a1a1a' } },
          error: { iconTheme: { primary: '#ff4757', secondary: '#1a1a1a' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
