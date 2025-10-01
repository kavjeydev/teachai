import { loadStripe, Stripe } from "@stripe/stripe-js";

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
    id: "free",
    name: "Free",
    subtitle: "Playground",
    price: 0,
    priceId: null,
    popular: false,
    description: "Let devs experiment and get hooked.",
    features: {
      credits: 500, // ~500k tokens
      projects: 1,
      graphNodes: 500,
      graphEdges: 1500,
      fileStorage: "250 MB total",
      maxFileSize: "25 MB per file",
      maxFiles: 50,
      teamMembers: 1,
      graphViz: "Basic (read-only)",
      metrics: "Limited (query count only)",
      graphEditing: false,
      branding: false,
      apiAccess: false,
      support: "Community Discord",
    },
    limits: {
      maxProjects: 1,
      maxStorageMB: 250,
      maxFileSizeMB: 25,
      maxFiles: 50,
      maxTeamMembers: 1,
      maxGraphNodes: 500,
      maxGraphEdges: 1500,
      monthlyCredits: 500,
      maxChats: 1, // New chat limit
    },
  },
  STARTER: {
    id: "starter",
    name: "Starter",
    subtitle: "$39/mo",
    price: 39,
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID,
    popular: true,
    description: "For indie devs or side projects with light users.",
    features: {
      credits: 10000, // ~10M tokens
      projects: 3,
      graphNodes: 5000,
      graphEdges: 15000,
      fileStorage: "2 GB total",
      maxFileSize: "50 MB per file",
      maxFiles: 200,
      teamMembers: 2,
      graphViz: "Editable",
      metrics: "Full (latency, token cost, hit rate)",
      graphEditing: true,
      promptCustomization: true,
      apiAccess: true,
      reactSDK: true,
      branding: false,
      support: "Email",
    },
    limits: {
      maxProjects: 3,
      maxStorageMB: 2048,
      maxFileSizeMB: 50,
      maxFiles: 200,
      maxTeamMembers: 2,
      maxGraphNodes: 5000,
      maxGraphEdges: 15000,
      monthlyCredits: 10000,
      maxChats: 3, // New chat limit
    },
  },
  SCALE: {
    id: "scale",
    name: "Scale",
    subtitle: "$199/mo",
    price: 199,
    priceId: process.env.NEXT_PUBLIC_STRIPE_SCALE_PRICE_ID,
    popular: false,
    description: "For startups in production with hundreds–thousands of users.",
    features: {
      credits: 100000, // ~100M tokens
      projects: 25,
      graphNodes: 100000,
      graphEdges: 300000,
      fileStorage: "40 GB total",
      maxFileSize: "150 MB per file",
      maxFiles: 5000,
      teamMembers: 10,
      graphViz: "Editable",
      metrics: "Full (latency, token cost, hit rate)",
      graphEditing: true,
      promptCustomization: true,
      versionedPrompts: true,
      templateSystem: true,
      customBranding: true,
      whiteLabel: true,
      analyticsExports: true,
      userQuotas: true,
      auditLogs: true,
      usageBreakdown: true,
      advancedRoles: true,
      permissions: true,
      priorityAPI: true,
      byoStorage: true,
      apiAccess: true,
      reactSDK: true,
      support: "Private Slack/Discord",
    },
    limits: {
      maxProjects: 25,
      maxStorageMB: 40960,
      maxFileSizeMB: 150,
      maxFiles: 5000,
      maxTeamMembers: 10,
      maxGraphNodes: 100000,
      maxGraphEdges: 300000,
      monthlyCredits: 100000,
      maxChats: 25, // New chat limit
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Custom",
    price: "Custom",
    priceId: null,
    popular: false,
    description:
      "For enterprises, compliance-heavy orgs, or very high-volume apps.",
    features: {
      credits: "Negotiable (millions of tokens)",
      projects: "Unlimited",
      graphNodes: "Millions",
      graphEdges: "Millions",
      fileStorage: "Custom / BYO storage",
      maxFileSize: "Custom",
      maxFiles: "Unlimited",
      teamMembers: "Unlimited",
      graphViz: "Editable",
      metrics: "Full (latency, token cost, hit rate)",
      graphEditing: true,
      promptCustomization: true,
      versionedPrompts: true,
      templateSystem: true,
      customBranding: true,
      whiteLabel: true,
      analyticsExports: true,
      userQuotas: true,
      auditLogs: true,
      usageBreakdown: true,
      advancedRoles: true,
      permissions: true,
      priorityAPI: true,
      byoStorage: true,
      sso: true,
      onPremise: true,
      vpcDeployment: true,
      compliance: true,
      dedicatedCSM: true,
      slaGuarantees: true,
      apiAccess: true,
      reactSDK: true,
      support: "Dedicated CSM + SLA guarantees",
    },
    limits: {
      maxProjects: -1,
      maxStorageMB: -1,
      maxFileSizeMB: -1,
      maxFiles: -1,
      maxTeamMembers: -1,
      maxGraphNodes: -1,
      maxGraphEdges: -1,
      monthlyCredits: -1,
      maxChats: -1, // Unlimited chats
    },
  },
};

// Credit system configuration (GPT-4o-mini as 1x baseline)
export const MODEL_MULTIPLIERS = {
  // OpenAI Models
  "gpt-4o-mini": 1, // Baseline: 1 credit = 1000 tokens
  "gpt-3.5-turbo": 0.7, // 0.7x of 4o-mini
  "gpt-4": 18, // 18x more expensive than 4o-mini
  "gpt-4-turbo": 12, // 12x more expensive than 4o-mini
  "gpt-4o": 15, // 15x more expensive than 4o-mini

  // Anthropic Claude Models
  "claude-3-haiku": 1, // Similar to 4o-mini
  "claude-3-sonnet": 8, // 8x more expensive than 4o-mini
  "claude-3-opus": 20, // 20x more expensive than 4o-mini
  "claude-3.5-sonnet": 10, // 10x more expensive than 4o-mini

  // Google Gemini Models
  "gemini-pro": 3, // 3x more expensive than 4o-mini
  "gemini-ultra": 12, // 12x more expensive than 4o-mini
  "gemini-1.5-pro": 4, // 4x more expensive than 4o-mini

  // Open Source Models (cheaper)
  "llama-3": 0.5, // 0.5x cheaper than 4o-mini
  "llama-3.1": 0.6, // 0.6x of 4o-mini
  "mistral-7b": 0.5, // 0.5x cheaper than 4o-mini
  "mixtral-8x7b": 0.8, // 0.8x of 4o-mini
};

// Credit pack options (priced at same rate as subscription tiers)
export const CREDIT_PACKS = {
  SMALL: {
    id: "credits-5k",
    name: "5K Credits",
    credits: 5000,
    price: 20, // Same rate as Starter tier: $39/10K = $3.90 per 1K, so 5K = $19.50 ≈ $20
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID,
    description: "~5M tokens on GPT-4o-mini",
  },
  MEDIUM: {
    id: "credits-15k",
    name: "15K Credits",
    credits: 15000,
    price: 50, // Same rate as Pro tier: $99/30K = $3.30 per 1K, so 15K = $49.50 ≈ $50
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID,
    description: "~15M tokens on GPT-4o-mini",
    popular: true,
  },
  LARGE: {
    id: "credits-50k",
    name: "50K Credits",
    credits: 50000,
    price: 100, // Same rate as Scale tier: $199/100K = $1.99 per 1K, so 50K = $99.50 ≈ $100
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID,
    description: "~50M tokens on GPT-4o-mini",
  },
  ENTERPRISE: {
    id: "credits-100k",
    name: "100K Credits",
    credits: 100000,
    price: 180, // Bulk discount: $199/100K = $1.99 per 1K, bulk rate = $1.80 per 1K
    priceId: process.env.NEXT_PUBLIC_STRIPE_CREDITS_100K_PRICE_ID,
    description: "~100M tokens on GPT-4o-mini",
  },
};

// Utility functions
export const calculateCreditsUsed = (tokens: number, model: string): number => {
  const multiplier =
    MODEL_MULTIPLIERS[model as keyof typeof MODEL_MULTIPLIERS] || 1;
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

export const formatTokens = (
  credits: number,
  model: string = "gpt-4o-mini",
): string => {
  const multiplier =
    MODEL_MULTIPLIERS[model as keyof typeof MODEL_MULTIPLIERS] || 1;
  const tokens = (credits / multiplier) * 1000;

  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M tokens`;
  } else if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K tokens`;
  }
  return `${tokens} tokens`;
};
