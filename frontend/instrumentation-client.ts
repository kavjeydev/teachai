import posthog from 'posthog-js'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only', // Only create profiles for identified users
    autocapture: true, // Automatically capture clicks, form submissions, etc.
    capture_pageview: true, // Automatically capture page views
    capture_pageleave: true, // Capture when users leave pages
  });
}

