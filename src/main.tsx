import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';

const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID || 'dummy-client-id';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <GoogleOAuthProvider clientId={clientId}>
        <App />
      </GoogleOAuthProvider>
    </AuthProvider>
  </StrictMode>,
);

