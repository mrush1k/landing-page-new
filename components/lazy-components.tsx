/**
 * Lazy-loaded component wrappers for performance optimization
 * Heavy components are loaded on-demand to reduce initial bundle size
 */

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div>
  </div>
);

// Chatbot - Heavy component with AI features
export const LazyAiChatbot = dynamic(
  () => import('@/components/ai-chatbot').then(mod => mod.AiChatbot),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Tutorial components - Only load when needed
export const LazyTutorialPopup = dynamic(
  () => import('@/components/tutorial-popup').then(mod => mod.TutorialPopup),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyTutorialLibrary = dynamic(
  () => import('@/components/tutorial-library').then(mod => mod.TutorialLibrary),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

export const LazyTutorialVideo = dynamic(
  () => import('@/components/tutorial-video').then(mod => mod.TutorialVideo),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Chart components - Heavy recharts library (use existing lazy-chart components)
// Import from lazy-chart.tsx directly instead

// Calendar - Date picker with large dependency (use existing lazy-calendar)
// Import from lazy-calendar.tsx directly instead

// PDF viewer/generator - Heavy jsPDF library (use existing lazy-pdf)
// Import from lazy-pdf.tsx directly instead

// Color picker - Only needed in settings
export const LazyColorPicker = dynamic(
  () => import('@/components/color-picker').then(mod => mod.ColorPicker),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Voice invoice - Speech recognition features
export const LazyVoiceInvoice = dynamic(
  () => import('@/components/voice-invoice'),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Diagnostic dashboard - Dev only
export const LazyDiagnosticDashboard = dynamic(
  () => import('@/components/diagnostic-dashboard').then(mod => mod.DiagnosticDashboard),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Email tracking status
export const LazyEmailTrackingStatus = dynamic(
  () => import('@/components/email-tracking-status').then(mod => mod.EmailTrackingStatus),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Onboarding flow - First-time user experience
export const LazyOnboardingFlow = dynamic(
  () => import('@/components/onboarding-flow').then(mod => mod.OnboardingFlow),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);

// Social login buttons - OAuth providers
export const LazySocialLoginButtons = dynamic(
  () => import('@/components/social-login-buttons').then(mod => mod.SocialLoginButtons),
  {
    loading: () => <div className="space-y-2 opacity-50">Loading social login...</div>,
    ssr: false,
  }
);

// Google One Tap - Third-party auth
export const LazyGoogleOneTap = dynamic(
  () => import('@/components/google-one-tap'),
  {
    ssr: false,
  }
);

// Contactless payments - Payment integration
export const LazyContactlessPayments = dynamic(
  () => import('@/components/contactless-payments').then(mod => mod.ContactlessPayments),
  {
    loading: () => <LoadingFallback />,
    ssr: false,
  }
);
