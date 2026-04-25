import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Patch setPointerCapture to prevent crash in dnd-kit/Puck when pointerId is not active
if (typeof Element !== 'undefined' && !!Element.prototype.setPointerCapture) {
  const originalSetPointerCapture = Element.prototype.setPointerCapture;
  Element.prototype.setPointerCapture = function (pointerId: number) {
    try {
      originalSetPointerCapture.call(this, pointerId);
    } catch (e) {
      // Suppress "No active pointer with the given id is found" error
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
