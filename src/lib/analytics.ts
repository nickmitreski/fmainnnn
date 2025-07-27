import { posthog, trackEvent, identifyUser } from './posthog';

// Enhanced analytics tracking with comprehensive data collection
export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private sessionStartTime: number;
  private pageStartTime: number;
  private userProperties: Record<string, any> = {};
  private featureUsage: Record<string, number> = {};

  constructor() {
    this.sessionStartTime = Date.now();
    this.pageStartTime = Date.now();
    this.initializeTracking();
  }

  static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  private initializeTracking() {
    // Track session start
    this.trackSessionStart();
    
    // Track page performance
    this.trackPagePerformance();
    
    // Track user properties
    this.trackUserProperties();
    
    // Track device and browser info
    this.trackDeviceInfo();
    
    // Track referrer and traffic sources
    this.trackTrafficSource();
  }

  // Session and Page Tracking
  private trackSessionStart() {
    trackEvent('session_started', {
      timestamp: new Date().toISOString(),
      session_id: this.generateSessionId(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      color_depth: screen.colorDepth,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      cookies_enabled: navigator.cookieEnabled,
      online_status: navigator.onLine,
    });
  }

  private trackPagePerformance() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        trackEvent('page_performance', {
          page_load_time: perfData.loadEventEnd - perfData.loadEventStart,
          dom_content_loaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          first_paint: perfData.responseStart - perfData.requestStart,
          time_to_interactive: perfData.domInteractive - perfData.fetchStart,
          total_page_size: perfData.transferSize,
          cache_hit: perfData.transferSize === 0,
        });
      }
    }
  }

  private trackUserProperties() {
    const properties = {
      user_id: this.generateUserId(),
      is_first_visit: !localStorage.getItem('has_visited'),
      visit_count: parseInt(localStorage.getItem('visit_count') || '0') + 1,
      last_visit: localStorage.getItem('last_visit'),
      current_visit: new Date().toISOString(),
      session_duration: 0,
      pages_viewed: 1,
      total_clicks: 0,
      total_scrolls: 0,
      preferred_theme: localStorage.getItem('theme') || 'system',
      preferred_language: navigator.language,
    };

    // Update localStorage
    localStorage.setItem('has_visited', 'true');
    localStorage.setItem('visit_count', properties.visit_count.toString());
    localStorage.setItem('last_visit', properties.current_visit);

    this.userProperties = properties;
    identifyUser(properties.user_id, properties);
  }

  private trackDeviceInfo() {
    trackEvent('device_info', {
      device_type: this.getDeviceType(),
      browser: this.getBrowserInfo(),
      os: this.getOSInfo(),
      is_mobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
      is_tablet: /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent),
      is_desktop: !(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)),
      connection_type: this.getConnectionType(),
      memory_info: this.getMemoryInfo(),
      hardware_concurrency: navigator.hardwareConcurrency,
    });
  }

  private trackTrafficSource() {
    const referrer = document.referrer;
    const urlParams = new URLSearchParams(window.location.search);
    
    trackEvent('traffic_source', {
      referrer: referrer || 'direct',
      referrer_domain: referrer ? new URL(referrer).hostname : 'direct',
      utm_source: urlParams.get('utm_source'),
      utm_medium: urlParams.get('utm_medium'),
      utm_campaign: urlParams.get('utm_campaign'),
      utm_term: urlParams.get('utm_term'),
      utm_content: urlParams.get('utm_content'),
      landing_page: window.location.pathname,
      full_url: window.location.href,
    });
  }

  // Feature Usage Tracking
  public trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    const key = `${feature}_${action}`;
    this.featureUsage[key] = (this.featureUsage[key] || 0) + 1;

    trackEvent('feature_used', {
      feature,
      action,
      usage_count: this.featureUsage[key],
      ...properties,
    });
  }

  // UI Interaction Tracking
  public trackUIInteraction(element: string, action: string, properties?: Record<string, any>) {
    trackEvent('ui_interaction', {
      element,
      action,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // Game/Emulator Usage Tracking
  public trackGameUsage(game: string, action: string, properties?: Record<string, any>) {
    trackEvent('game_used', {
      game,
      action,
      session_duration: Date.now() - this.sessionStartTime,
      ...properties,
    });
  }

  // Error Tracking
  public trackError(error: Error, context?: Record<string, any>) {
    trackEvent('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context,
    });
  }

  // Performance Tracking
  public trackPerformance(metric: string, value: number, properties?: Record<string, any>) {
    trackEvent('performance_metric', {
      metric,
      value,
      unit: 'ms',
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // User Journey Tracking
  public trackUserJourney(step: string, properties?: Record<string, any>) {
    trackEvent('user_journey', {
      step,
      journey_progress: this.calculateJourneyProgress(step),
      session_duration: Date.now() - this.sessionStartTime,
      pages_viewed: this.userProperties.pages_viewed,
      ...properties,
    });
  }

  // Scroll Tracking
  public trackScroll(depth: number, direction: 'up' | 'down') {
    trackEvent('scroll_activity', {
      scroll_depth: depth,
      scroll_direction: direction,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }

  // Form Interaction Tracking
  public trackFormInteraction(form: string, action: string, properties?: Record<string, any>) {
    trackEvent('form_interaction', {
      form,
      action,
      page: window.location.pathname,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  // API Call Tracking
  public trackAPICall(api: string, method: string, status: number, duration: number, properties?: Record<string, any>) {
    trackEvent('api_call', {
      api,
      method,
      status,
      duration,
      success: status >= 200 && status < 300,
      timestamp: new Date().toISOString(),
      ...properties,
    });
  }

  public getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  public getClickCount(): number {
    return this.userProperties.total_clicks || 0;
  }

  // Page View Tracking with Enhanced Data
  public trackPageView(page: string, properties?: Record<string, any>) {
    const pageDuration = Date.now() - this.pageStartTime;
    this.userProperties.pages_viewed++;
    
    trackEvent('page_viewed', {
      page,
      page_duration: pageDuration,
      total_session_duration: Date.now() - this.sessionStartTime,
      pages_viewed_in_session: this.userProperties.pages_viewed,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      ...properties,
    });

    this.pageStartTime = Date.now();
  }

  // Session End Tracking
  public trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    trackEvent('session_ended', {
      session_duration: sessionDuration,
      pages_viewed: this.userProperties.pages_viewed,
      total_clicks: this.userProperties.total_clicks,
      total_scrolls: this.userProperties.total_scrolls,
      features_used: Object.keys(this.featureUsage),
      timestamp: new Date().toISOString(),
    });
  }

  // Utility Methods
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateUserId(): string {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'Mac';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Unknown';
  }

  private getBrowserInfo(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSInfo(): string {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    return 'Unknown';
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection?.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private getMemoryInfo(): Record<string, any> {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        used_js_heap_size: memory.usedJSHeapSize,
        total_js_heap_size: memory.totalJSHeapSize,
        js_heap_size_limit: memory.jsHeapSizeLimit,
      };
    }
    return {};
  }

  private calculateJourneyProgress(step: string): number {
    const journeySteps = [
      'landing_page_view',
      'feature_exploration',
      'game_played',
      'admin_access',
      'api_usage',
    ];
    const stepIndex = journeySteps.indexOf(step);
    return stepIndex >= 0 ? ((stepIndex + 1) / journeySteps.length) * 100 : 0;
  }
}

// Export singleton instance
export const analytics = AnalyticsTracker.getInstance();

// Auto-track page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    trackEvent('page_hidden', {
      timestamp: new Date().toISOString(),
      session_duration: Date.now() - analytics['sessionStartTime'],
    });
  } else {
    trackEvent('page_visible', {
      timestamp: new Date().toISOString(),
    });
  }
});

// Auto-track before unload
window.addEventListener('beforeunload', () => {
  analytics.trackSessionEnd();
});

// Auto-track scroll events (throttled)
let scrollTimeout: NodeJS.Timeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
    analytics.trackScroll(scrollDepth, 'down');
  }, 100);
});

// Auto-track clicks
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  if (target) {
    analytics.trackUIInteraction(
      target.tagName.toLowerCase(),
      'click',
      {
        element_id: target.id,
        element_class: target.className,
        element_text: target.textContent?.substring(0, 50),
        page: window.location.pathname,
      }
    );
  }
});

// Auto-track form submissions
document.addEventListener('submit', (event) => {
  const form = event.target as HTMLFormElement;
  if (form) {
    analytics.trackFormInteraction(
      form.id || form.className || 'unknown_form',
      'submit',
      {
        form_action: form.action,
        form_method: form.method,
        page: window.location.pathname,
      }
    );
  }
});

// Export convenience functions
export const trackFeatureUsage = (feature: string, action: string, properties?: Record<string, any>) => {
  analytics.trackFeatureUsage(feature, action, properties);
};

export const trackGameUsage = (game: string, action: string, properties?: Record<string, any>) => {
  analytics.trackGameUsage(game, action, properties);
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  analytics.trackError(error, context);
};

export const trackPageView = (page: string, properties?: Record<string, any>) => {
  analytics.trackPageView(page, properties);
};

export const trackAPICall = (api: string, method: string, status: number, duration: number, properties?: Record<string, any>) => {
  analytics.trackAPICall(api, method, status, duration, properties);
};

// Session and click tracking utilities
export const getSessionDuration = (): number => {
  return analytics.getSessionDuration();
};

export const getClickCount = (): number => {
  return analytics.getClickCount();
};