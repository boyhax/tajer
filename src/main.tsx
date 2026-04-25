import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch setPointerCapture/releasePointerCapture to prevent crash in dnd-kit/Puck when pointerId is not active
if (typeof Element !== 'undefined') {
  const patch = (prop: string) => {
    const original = (Element.prototype as any)[prop];
    if (original) {
      (Element.prototype as any)[prop] = function (pointerId: number) {
        try {
          original.call(this, pointerId);
        } catch (e) {
          // Suppress "No active pointer with the given id is found" and related errors
          if (e instanceof Error && (
            e.name === 'NotFoundError' || 
            e.message.includes('pointer') || 
            e.message.includes('active pointer')
          )) {
            return;
          }
          throw e;
        }
      };
    }
  };
  patch('setPointerCapture');
  patch('releasePointerCapture');
}

// Global error filter for unhandled pointer capture exceptions that might bypass the prototype patch
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && event.reason.message.includes('setPointerCapture')) {
      event.preventDefault();
    }
  });
  window.addEventListener('error', (event) => {
    if (event.message && (
      event.message.includes('setPointerCapture') || 
      event.message.includes('active pointer')
    )) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
