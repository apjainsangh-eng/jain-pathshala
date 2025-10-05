import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // This must be before App import
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);