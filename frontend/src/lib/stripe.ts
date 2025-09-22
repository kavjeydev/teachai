import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Pricing configuration
export const PRICING_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceId: null,
    features: {
      chats: 1,
      storage: '50MB',
      credits: 500, // 500k tokens
      models: ['gpt-4o-mini'],
      graphEditing: false,
      apiAccess: false,
    },
    limits: {
      maxChats: 1,
      maxStorageMB: 50,
      monthlyCredits: 500,
    }
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 39,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: {
      chats: 10,
      storage: '1GB',
      credits: 10000, // 10M tokens
      models: ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku'],
      graphEditing: true,
      apiAccess: true,
    },
    limits: {
      maxChats: 10,
      maxStorageMB: 1024,
      monthlyCredits: 10000,
    }
  },
  TEAM: {
    id: 'team',
    name: 'Team',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID,
    features: {
      chats: 25,
      storage: '5GB',
      credits: 30000, // 30M tokens
      models: ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-sonnet'],
      graphEditing: true,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
    },
    limits: {
      maxChats: 25,
      maxStorageMB: 5120,
      monthlyCredits: 30000,
    }
  },
  STARTUP: {
    id: 'startup',
    name: 'Startup',
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID,
    features: {
      chats: 'Unlimited',
      storage: '20GB',
      credits: 100000, // 100M tokens
      models: ['gpt-4o-mini', 'gpt-4o', 'claude-3-haiku', 'claude-3-sonnet', 'claude-3-opus'],
      graphEditing: true,
      apiAccess: true,
      prioritySupport: true,
      advancedAnalytics: true,
      customBranding: true,
      webhookSupport: true,
    },
    limits: {
      maxChats: -1, // Unlimited
      maxStorageMB: 20480,
      monthlyCredits: 100000,
    }
  }
};

// Credit system configuration (GPT-4o-mini as 1x baseline)
export const MODEL_MULTIPLIERS = {
  // OpenAI Models
  'gpt-4o-mini': 1,         // Baseline: 1 credit = 1000 tokens
  'gpt-3.5-turbo': 0.7,     // 0.7x of 4o-mini
  'gpt-4': 18,              // 18x more expensive than 4o-mini
  'gpt-4-turbo': 12,        // 12x more expensive than 4o-mini
  'gpt-4o': 15,             // 15x more expensive than 4o-mini

  // Anthropic Claude Models
  'claude-3-haiku': 1,      // Similar to 4o-mini
  'claude-3-sonnet': 8,     // 8x more expensive than 4o-mini
  'claude-3-opus': 20,      // 20x more expensive than 4o-mini
  'claude-3.5-sonnet': 10,  // 10x more expensive than 4o-mini

  // Google Gemini Models
  'gemini-pro': 3,          // 3x more expensive than 4o-mini
  'gemini-ultra': 12,       // 12x more expensive than 4o-mini
  'gemini-1.5-pro': 4,      // 4x more expensive than 4o-mini

  // Open Source Models (cheaper)
  'llama-3': 0.5,           // 0.5x cheaper than 4o-mini
  'llama-3.1': 0.6,         // 0.6x of 4o-mini
  'mistral-7b': 0.5,        // 0.5x cheaper than 4o-mini
  'mixtral-8x7b': 0.8,      // 0.8x of 4o-mini
};

// Credit pack options (priced at same rate as subscription tiers)
export const CREDIT_PACKS = {
  SMALL: {
    id: 'credits-5k',
    name: '5K Credits',
    credits: 5000,
    price: 20, // Same rate as Pro tier: $39/10K = $3.90 per 1K, so 5K = $19.50 ≈ $20
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID,
    description: '~5M tokens on GPT-4o-mini',
  },
  MEDIUM: {
    id: 'credits-15k',
    name: '15K Credits',
    credits: 15000,
    price: 50, // Same rate as Team tier: $99/30K = $3.30 per 1K, so 15K = $49.50 ≈ $50
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID,
    description: '~15M tokens on GPT-4o-mini',
    popular: true,
  },
  LARGE: {
    id: 'credits-50k',
    name: '50K Credits',
    credits: 50000,
    price: 100, // Same rate as Startup tier: $199/100K = $1.99 per 1K, so 50K = $99.50 ≈ $100
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID,
    description: '~50M tokens on GPT-4o-mini',
  },
};

// Utility functions
export const calculateCreditsUsed = (tokens: number, model: string): number => {
  const multiplier = MODEL_MULTIPLIERS[model as keyof typeof MODEL_MULTIPLIERS] || 1;
  return Math.ceil((tokens / 1000) * multiplier);
};

export const formatCredits = (credits: number): string => {
  if (credits >= 1000000) {
    return `${(credits / 1000000).toFixed(1)}M`;
  } else if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}K`;
  } else if (credits >= 10) {
    return credits.toFixed(1);
  } else {
    return credits.toFixed(2); // Show 2 decimals for small amounts
  }
};

export const formatTokens = (credits: number, model: string = 'gpt-4o-mini'): string => {
  const multiplier = MODEL_MULTIPLIERS[model as keyof typeof MODEL_MULTIPLIERS] || 1;
  const tokens = (credits / multiplier) * 1000;

  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M tokens`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  }
  return `${tokens} tokens`;
};
