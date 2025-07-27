import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/skeuomorphic-ios.css';
import { PostHogProvider } from 'posthog-js/react';
import { posthog } from './lib/posthog';
import { analytics } from './lib/analytics';

// Analytics is automatically initialized when the module is imported
// The analytics singleton is already available

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </StrictMode>
);