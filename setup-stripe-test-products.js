const Stripe = require('stripe');

// Test secret key for development (updated with your actual key)
require('dotenv').config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function setupStripeTestProducts() {
  console.log('🧪 Setting up Trainly Stripe TEST products...\n');

  try {
    // Create subscription products
    const products = [
      {
        name: 'Trainly Pro (Test)',
        description: 'Professional AI development with 10M tokens included - TEST MODE',
        price: 3900, // $39.00 in cents
        interval: 'month',
        tier: 'pro'
      },
      {
        name: 'Trainly Team (Test)',
        description: 'Advanced features with 30M tokens and priority support - TEST MODE',
        price: 9900, // $99.00 in cents
        interval: 'month',
        tier: 'team'
      },
      {
        name: 'Trainly Startup (Test)',
        description: 'Unlimited chats with 100M tokens for power users - TEST MODE',
        price: 19900, // $199.00 in cents
        interval: 'month',
        tier: 'startup'
      }
    ];

    const subscriptionPrices = {};

    for (const productData of products) {
      console.log(`Creating ${productData.name}...`);

      // Create product
      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: {
          tier: productData.tier,
          type: 'subscription',
          environment: 'test'
        }
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: productData.price,
        currency: 'usd',
        recurring: {
          interval: productData.interval,
        },
        metadata: {
          tier: productData.tier,
          credits: productData.tier === 'pro' ? '10000' :
                  productData.tier === 'team' ? '30000' : '100000',
          environment: 'test'
        }
      });

      subscriptionPrices[productData.tier] = price.id;
      console.log(`✅ ${productData.name}: ${price.id}`);
    }

    // Create credit pack products
    const creditPacks = [
      {
        name: '5K AI Credits (Test)',
        description: '~5M tokens on GPT-4o-mini - TEST MODE',
        price: 2000, // $20.00 in cents
        credits: 5000
      },
      {
        name: '15K AI Credits (Test)',
        description: '~15M tokens on GPT-4o-mini - TEST MODE',
        price: 5000, // $50.00 in cents
        credits: 15000
      },
      {
        name: '50K AI Credits (Test)',
        description: '~50M tokens on GPT-4o-mini - TEST MODE',
        price: 10000, // $100.00 in cents
        credits: 50000
      }
    ];

    const creditPackPrices = {};

    for (const packData of creditPacks) {
      console.log(`Creating ${packData.name}...`);

      // Create product
      const product = await stripe.products.create({
        name: packData.name,
        description: packData.description,
        metadata: {
          type: 'credits',
          credits: packData.credits.toString(),
          environment: 'test'
        }
      });

      // Create price
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: packData.price,
        currency: 'usd',
        metadata: {
          credits: packData.credits.toString(),
          environment: 'test'
        }
      });

      creditPackPrices[`credits_${packData.credits}`] = price.id;
      console.log(`✅ ${packData.name}: ${price.id}`);
    }

    // Output test environment variables
    console.log('\n🧪 TEST Environment Setup Complete!\n');
    console.log('Add these TEST variables to your .env.local for development:\n');
    console.log('# Stripe TEST Configuration (for localhost development)');
    console.log('STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE');
    console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE');
    console.log('');
    console.log('# TEST Subscription Price IDs');
    console.log(`NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=${subscriptionPrices.pro}`);
    console.log(`NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID=${subscriptionPrices.team}`);
    console.log(`NEXT_PUBLIC_STRIPE_STARTUP_PRICE_ID=${subscriptionPrices.startup}`);
    console.log('');
    console.log('# TEST Credit Pack Price IDs');
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_5K_PRICE_ID=${creditPackPrices.credits_5000}`);
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_15K_PRICE_ID=${creditPackPrices.credits_15000}`);
    console.log(`NEXT_PUBLIC_STRIPE_CREDITS_50K_PRICE_ID=${creditPackPrices.credits_50000}`);
    console.log('');
    console.log('🔗 Next steps:');
    console.log('1. Get your TEST API keys from: https://dashboard.stripe.com/test/apikeys');
    console.log('2. Replace the placeholder keys above with your actual test keys');
    console.log('3. Set up test webhook endpoint in Stripe dashboard');
    console.log('4. Test with card: 4242 4242 4242 4242');

  } catch (error) {
    console.error('❌ Error setting up Stripe test products:', error);
  }
}

console.log('⚠️  IMPORTANT: Replace the test secret key at the top of this file with your actual test key from:');
console.log('   https://dashboard.stripe.com/test/apikeys\n');

setupStripeTestProducts();
