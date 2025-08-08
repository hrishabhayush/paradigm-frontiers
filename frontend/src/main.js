import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import { Providers } from './lib/providers';
import './index.css';
createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(Providers, { children: _jsx(App, {}) }) }));
