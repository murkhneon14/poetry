import React, { useState } from 'react';
import toast from 'react-hot-toast';

const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
const baseUrl = 'https://loyal-ocelot-394.convex.site';

const subscriptionPlans = {
  poet: {
    name: 'Poet',
    price: 499,
    description: 'Basic plan for poets.',
    planId: 'plan_Qjb7LgzjcDPb9e'
  },
  patron: {
    name: 'Patron',
    price: 599,
    description: 'Premium plan with extra features.',
    planId: 'plan_Qjb8cWcJvA2OG2'
  },
} as const;

type PlanType = keyof typeof subscriptionPlans;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (retryCount = 0): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    // If already loaded, resolve immediately
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      return resolve(true);
    }

    // If we've already tried too many times, give up
    if (retryCount >= 3) {
      console.error('Max retries reached for loading Razorpay script');
      return resolve(false);
    }

    // Create script element
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        console.log('Razorpay script loaded successfully');
        resolve(true);
      } else {
        console.error('Razorpay object not available after script load');
        // Retry after a delay
        setTimeout(() => loadRazorpayScript(retryCount + 1).then(resolve), 1000);
      }
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      // Retry after a delay
      setTimeout(() => loadRazorpayScript(retryCount + 1).then(resolve), 1000);
    };
    
    document.body.appendChild(script);
  });
};

interface SubscriptionPlansProps {
  isDark?: boolean;
  onClose?: () => void;
}

export const SubscriptionPlans: React.FC<SubscriptionPlansProps> = ({ isDark = false, onClose }) => {
  const [loading, setLoading] = useState<PlanType | null>(null);

  const createRazorpaySubscription = async (planId: string) => {
    const url = `${baseUrl}/create-razorpay-subscription`;
    console.log('Creating subscription with plan ID:', planId);
    
    try {
      console.log('Sending request to:', url);
      const requestBody = {
        planId: planId,
        plan_id: planId,
        customer_notify: 1,
        total_count: 12,
        quantity: 1,
        customer: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        }
      };
      
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText };
        }
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Subscription response:', responseData);
      
      if (!responseData || !responseData.id) {
        throw new Error('Invalid response from subscription service');
      }
      
      return responseData;
    } catch (error) {
      console.error('Error in createRazorpaySubscription:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create subscription. Please try again.'
      );
    }
  };

  const displayRazorpay = async (plan: PlanType) => {
    setLoading(plan);
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Failed to load Razorpay. Please try again.');
      }

      const planDetails = subscriptionPlans[plan];
      if (!planDetails) {
        throw new Error(`Invalid plan: ${plan}`);
      }

      console.log('Creating subscription for plan:', planDetails);
      const subscription = await createRazorpaySubscription(planDetails.planId);
      
      if (!subscription?.id) {
        throw new Error('Failed to create subscription: Invalid response from server');
      }

      console.log('Subscription created:', subscription);
      
      const options = {
        key: razorpayKey,
        name: 'Poetry Platform',
        description: `${planDetails.name} Subscription`,
        image: 'https://your-logo-url.png',
        subscription_id: subscription.id,
        theme: {
          color: isDark ? '#7C3AED' : '#4F46E5',
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999',
        },
        notes: {
          plan: planDetails.name,
          subscription_id: subscription.id,
        },
        // Handle successful payment
        handler: function (response: any) {
          console.log('Payment successful:', response);
          toast.success('Subscription successful!');
          if (onClose) onClose();
        },
        // Handle modal close
        modal: {
          ondismiss: function() {
            console.log('Payment modal was dismissed');
            toast('Payment was cancelled', { icon: 'ℹ️' });
            setLoading(null);
          },
          escape: true,
          confirm_close: true,
          backdropclose: true
        },
        // Handle payment failure
        'payment.failed': function(response: any) {
          console.error('Payment failed:', response.error);
          toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
        },
        // Handle subscription errors
        'subscription.failed': function(response: any) {
          console.error('Subscription creation failed:', response.error);
          toast.error(`Subscription failed: ${response.error?.description || 'Unknown error'}`);
        },
      };

      console.log('Opening Razorpay with options:', options);
      const paymentObject = new window.Razorpay(options);
      
      // Additional event listeners for better error handling
      paymentObject.on('payment.failed', function(response: any) {
        console.error('Payment failed event:', response.error);
        toast.error(`Payment failed: ${response.error?.description || 'Unknown error'}`);
      });

      paymentObject.on('payment.authorized', function(response: any) {
        console.log('Payment authorized:', response);
      });

      paymentObject.open();
      
    } catch (error: any) {
      console.error('Error in payment process:', error);
      toast.error(error instanceof Error ? error.message : 'Error processing payment');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Choose Your Plan</h2>
      <div className="grid gap-4">
        {Object.entries(subscriptionPlans).map(([key, plan]) => (
          <div key={key} className="border rounded p-4">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p>{plan.description}</p>
            <p className="mt-2 text-lg font-bold">₹{plan.price}</p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              onClick={() => displayRazorpay(key as PlanType)}
              disabled={loading === key}
            >
              {loading === key ? 'Processing...' : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;
