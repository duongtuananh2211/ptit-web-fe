import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import ReadinessChecker from './components/ReadinessChecker.tsx';
import { HorusVisClientProvider } from './contexts/HorusVisClientProvider.tsx';
import './i18n/config'; // Initialize i18n
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReadinessChecker>
        <HorusVisClientProvider>
          <App />
        </HorusVisClientProvider>
      </ReadinessChecker>
    </ErrorBoundary>
  </StrictMode>
);
