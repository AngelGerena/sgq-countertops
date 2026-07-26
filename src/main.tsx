import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './lib/AuthProvider';
import { SiteContentProvider } from './lib/SiteContentProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SiteContentProvider>
          <App />
        </SiteContentProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
