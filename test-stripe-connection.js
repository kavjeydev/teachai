const Stripe = require('stripe');

// Test your Stripe connection
require('dotenv').config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  console.log('🧪 Testing Stripe connection...\n');

  try {
    // Test 1: List products
    console.log('1. Testing product listing...');
    const products = await stripe.products.list({ limit: 3 });
    console.log(`✅ Found ${products.data.length} products`);

    // Test 2: List prices
    console.log('2. Testing price listing...');
    const prices = await stripe.prices.list({ limit: 3 });
    console.log(`✅ Found ${prices.data.length} prices`);

    // Test 3: Create a simple checkout session (without metadata)
    console.log('3. Testing checkout session creation...');
    if (prices.data.length > 0) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel',
      });
      console.log(`✅ Checkout session created: ${session.id}`);
    }

    console.log('\n🎉 All tests passed! Your Stripe integration is working correctly.');
    console.log('\nYour test price IDs:');
    prices.data.forEach(price => {
      if (price.metadata && price.metadata.tier) {
        console.log(`${price.metadata.tier}: ${price.id}`);
      }
    });

  } catch (error) {
    console.error('❌ Stripe connection test failed:', error.message);
    console.error('\nPossible issues:');
    console.error('- Check your test secret key is correct');
    console.error('- Make sure you\'re in test mode on Stripe dashboard');
    console.error('- Verify your internet connection');
  }
}

testStripeConnection();
