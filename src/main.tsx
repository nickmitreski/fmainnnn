import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/skeuomorphic-ios.css';
import { PostHogProvider } from 'posthog-js/react';
import { posthog } from './lib/posthog';
import { initAnalytics } from './lib/analytics';

// Initialize analytics
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <PostHogProvider client={posthog}>
    <App />
  </PostHogProvider>
);