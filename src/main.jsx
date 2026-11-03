import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { ShopProvider } from './context/ShopContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ConfirmProvider } from './context/ConfirmContext.jsx';
import '../style.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
          <ShopProvider>
            <App />
          </ShopProvider>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
