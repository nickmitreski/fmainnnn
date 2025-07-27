import { posthog, trackEvent, identifyUser } from './posthog';

// Simplified analytics tracking without DOM event listeners
export class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private sessionStartTime: number;
  private userProperties: Record<string, any> = {};

  constructor() {
    this.sessionStartTime = Date.now();
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
    
    // Track user properties
    this.trackUserProperties();
  }

  private trackSessionStart() {
    trackEvent('session_started', {
      timestamp: new Date().toISOString(),
      session_id: this.generateSessionId(),
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
    });
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

  public trackFeatureUsage(feature: string, action: string, properties?: Record<string, any>) {
    trackEvent('feature_usage', {
      feature,
      action,
      ...properties,
    });
  }

  public trackUIInteraction(element: string, action: string, properties?: Record<string, any>) {
    trackEvent('ui_interaction', {
      element,
      action,
      ...properties,
    });
  }

  public trackGameUsage(game: string, action: string, properties?: Record<string, any>) {
    trackEvent('game_usage', {
      game,
      action,
      ...properties,
    });
  }

  public trackError(error: Error, context?: Record<string, any>) {
    trackEvent('error', {
      error_message: error.message,
      error_stack: error.stack,
      ...context,
    });
  }

  public trackPerformance(metric: string, value: number, properties?: Record<string, any>) {
    trackEvent('performance', {
      metric,
      value,
      ...properties,
    });
  }

  public trackUserJourney(step: string, properties?: Record<string, any>) {
    trackEvent('user_journey', {
      step,
      progress: this.calculateJourneyProgress(step),
      ...properties,
    });
  }

  public trackScroll(depth: number, direction: 'up' | 'down') {
    trackEvent('scroll', {
      depth,
      direction,
      page: window.location.pathname,
    });
  }

  public trackFormInteraction(form: string, action: string, properties?: Record<string, any>) {
    trackEvent('form_interaction', {
      form,
      action,
      ...properties,
    });
  }

  public trackAPICall(api: string, method: string, status: number, duration: number, properties?: Record<string, any>) {
    trackEvent('api_call', {
      api,
      method,
      status,
      duration,
      ...properties,
    });
  }

  public getSessionDuration(): number {
    return Math.floor((Date.now() - this.sessionStartTime) / 1000);
  }

  public getClickCount(): number {
    return this.userProperties.total_clicks || 0;
  }

  public trackPageView(page: string, properties?: Record<string, any>) {
    trackEvent('page_view', {
      page,
      referrer: document.referrer,
      ...properties,
    });
  }

  public trackSessionEnd() {
    trackEvent('session_ended', {
      session_duration: this.getSessionDuration(),
      pages_viewed: this.userProperties.pages_viewed || 1,
      total_clicks: this.getClickCount(),
    });
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUserId(): string {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  private calculateJourneyProgress(step: string): number {
    const journeySteps = [
      'page_load',
      'first_interaction',
      'feature_discovery',
      'engagement',
      'conversion',
      'api_usage',
    ];
    const stepIndex = journeySteps.indexOf(step);
    return stepIndex >= 0 ? ((stepIndex + 1) / journeySteps.length) * 100 : 0;
  }
}

// Export singleton instance
export const analytics = AnalyticsTracker.getInstance();

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