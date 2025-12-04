import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
// Initialize Web Vitals tracking (optional, requires web-vitals package)
// import { initWebVitals } from "./lib/webVitals";
// initWebVitals();

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Unregister all old service workers first
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Unregister old versions that might be intercepting API calls
        if (registration.scope.includes(window.location.origin)) {
          await registration.unregister();
          console.log('Unregistered old service worker');
        }
      }
      
      // Clear old caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName.startsWith('atelier-cache-')) {
              return caches.delete(cacheName);
            }
          })
        );
      }
      
      // Register new service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      console.log('SW registered:', reg.scope);
    } catch (err) {
      console.log('SW registration failed:', err);
    }
  });
}

// Optional: detect successful install
window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
});

createRoot(document.getElementById("root")!).render(<App />);
