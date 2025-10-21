import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import AppErrorBoundary from "./components/debug/AppErrorBoundary";
import { store } from "./store";
import { initBackupAdapter } from "./lib/backupAdapter";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

// Global error handlers
window.addEventListener('error', (e) => {
  console.error('[unhandled:error]', e.error || e.message, e);
  sessionStorage.setItem('lastCrash', JSON.stringify({ 
    type: 'error', 
    message: String(e.message), 
    stack: String(e.error?.stack || ''), 
    href: location.href, 
    at: new Date().toISOString() 
  }));
});

window.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
  console.error('[unhandled:rejection]', e.reason);
  sessionStorage.setItem('lastCrash', JSON.stringify({ 
    type: 'rejection', 
    message: String(e.reason), 
    href: location.href, 
    at: new Date().toISOString() 
  }));
});

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
);

// Initialize backup adapter after render
// This will restore from cloud if localStorage is empty, then start auto-backup
initBackupAdapter(store.getState())
  .then(({ forceBackup }) => {
    // Export forceBackup for future use (e.g., Settings button)
    (window as any).__forceBackup = forceBackup;
  })
  .catch(err => {
    console.warn('[backup] init error', err);
  });
