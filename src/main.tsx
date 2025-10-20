import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { store } from "./store";
import { initBackupAdapter } from "./lib/backupAdapter";

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
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
