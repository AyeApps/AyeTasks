/**
 * AyeTasks Analytics Service (Google Analytics 4 / Telemetry)
 * 
 * Centralized telemetry for AyeTasks Web.
 * Operates safely on Platform.OS === 'web' without affecting native apps.
 */
import { Platform } from 'react-native';

const GA_MEASUREMENT_ID = process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID || '';
let isInitialized = false;

export const initGA = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (isInitialized) return;

  if ((window as any).gtag) {
    isInitialized = true;
    return;
  }

  if (!GA_MEASUREMENT_ID) {
    if (__DEV__) {
      console.log('[Analytics-Tasks] No EXPO_PUBLIC_GA_MEASUREMENT_ID provided. Local debug mode.');
    }
    isInitialized = true;
    return;
  }

  try {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;

    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      cookie_flags: 'SameSite=None;Secure',
    });

    isInitialized = true;
  } catch (err) {
    console.error('[Analytics-Tasks] Error initializing GA4:', err);
  }
};

export const trackPageView = (path = '/', title = 'AyeTasks') => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (!isInitialized) initGA();

  if ((window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
    });
  }

  if (__DEV__) {
    console.log(`[Analytics-Tasks] PageView: ${path} — "${title}"`);
  }
};

export const trackEvent = (eventName: string, params: Record<string, any> = {}) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  if (!isInitialized) initGA();

  if ((window as any).gtag && GA_MEASUREMENT_ID) {
    (window as any).gtag('event', eventName, params);
  }

  if (__DEV__) {
    console.log(`[Analytics-Tasks] Event: "${eventName}"`, params);
  }
};

export const trackAuthOpened = (source = 'landing_cta') => {
  trackEvent('auth_opened', { source });
};

export const trackLoginSuccess = (method = 'email') => {
  trackEvent('login', { method });
};

export const trackTaskCreated = () => {
  trackEvent('task_created');
};

export const trackTimerStart = () => {
  trackEvent('timer_start');
};

export default {
  initGA,
  trackPageView,
  trackEvent,
  trackAuthOpened,
  trackLoginSuccess,
  trackTaskCreated,
  trackTimerStart,
};
