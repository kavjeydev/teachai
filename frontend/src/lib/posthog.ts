"use client";

import posthog from "posthog-js";

/**
 * PostHog utility functions for tracking events and identifying users
 */

export const isPostHogEnabled = () => {
  return typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY;
};

/**
 * Identify a user in PostHog
 * Call this when a user signs in
 */
export const identifyUser = (
  userId: string,
  properties?: Record<string, any>,
) => {
  if (!isPostHogEnabled()) return;

  try {
    posthog.identify(userId, {
      ...properties,
      // Add any default properties you want
    });
  } catch (error) {
    console.error("PostHog identify error:", error);
  }
};

/**
 * Capture a custom event in PostHog
 */
export const captureEvent = (
  eventName: string,
  properties?: Record<string, any>,
) => {
  if (!isPostHogEnabled()) return;

  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("PostHog capture error:", error);
  }
};

/**
 * Reset PostHog when user signs out
 */
export const resetPostHog = () => {
  if (!isPostHogEnabled()) return;

  try {
    posthog.reset();
  } catch (error) {
    console.error("PostHog reset error:", error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = (properties: Record<string, any>) => {
  if (!isPostHogEnabled()) return;

  try {
    posthog.setPersonProperties(properties);
  } catch (error) {
    console.error("PostHog setPersonProperties error:", error);
  }
};
