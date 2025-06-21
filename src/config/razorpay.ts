// This is a client-side config file
const razorpayConfig = {
  key_id: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  key_secret: import.meta.env.VITE_RAZORPAY_KEY_SECRET || '',
};

export const subscriptionPlans = {
  poet: {
    name: 'Poet',
    price: 29900, // in paise (₹299)
    interval: 'monthly',
    features: [
      'Unlimited poems',
      'Advanced analytics',
      'Custom themes',
      'Ad-free experience'
    ]
  },
  patron: {
    name: 'Patron',
    price: 59900, // in paise (₹599)
    interval: 'monthly',
    features: [
      'All Poet features',
      'Featured profile',
      'Early access to features',
      'Priority support'
    ]
  }
};

export default razorpayConfig;
