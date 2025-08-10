import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import './i18n';
import { Toaster } from '@/components/ui/toaster';

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-lg font-semibold text-foreground">Carregando...</div>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<LoadingFallback />}>
      <App />
      <Toaster />
    </Suspense>
  </React.StrictMode>
);