import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element not found");
}

console.log("Starting React app...");

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("React app rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: system-ui; text-align: center; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #4C1A4F 0%, #0A0E37 50%, #C8B7E3 100%); color: #E9D7A6;">
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">Error Loading App</h1>
      <p style="margin-bottom: 1rem;">Please refresh the page or check the console for details.</p>
      <pre style="text-align: left; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; overflow: auto; max-width: 600px;">
        ${error instanceof Error ? error.message : String(error)}
      </pre>
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 12px 24px; background: #E9D7A6; color: #0A0E37; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
}

