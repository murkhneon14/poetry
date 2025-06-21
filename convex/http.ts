import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

// Convex-safe Base64 encoder
function toBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

// POST /create-razorpay-subscription
export const createRazorpaySubscription = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Parse the request body
  let requestBody;
  try {
    requestBody = await request.json();
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));
  } catch (error) {
    console.error('Error parsing request body:', error);
    return new Response(
      JSON.stringify({ error: 'Invalid request body' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  const planId = requestBody.planId || requestBody.plan_id || requestBody.plan;
  
  if (!planId) {
    console.error('Missing plan ID in request:', requestBody);
    return new Response(
      JSON.stringify({ 
        error: 'Plan ID is required',
        receivedBody: requestBody 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Get Razorpay credentials from environment variables
  console.log('Environment variables:', {
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? '***' : 'NOT SET',
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET ? '***' : 'NOT SET'
  });
  
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return new Response(
      JSON.stringify({ error: "Missing Razorpay credentials" }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        } 
      }
    );
  }

  const subscriptionData = {
    plan_id: planId,
    customer_notify: 1,
    total_count: 12, // For example, 12 months
    quantity: 1,
  };

  try {
    const response = await fetch("https://api.razorpay.com/v1/subscriptions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${toBase64(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify(subscriptionData),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data?.error?.description || "Subscription creation failed" }), {
        status: response.status,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "Subscription request failed", details: error.message }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  }
});

// OPTIONS handler for CORS preflight
export const handleOptions = httpAction(async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
});

// Create HTTP router
const http = httpRouter();

// Add CORS headers to all responses
const withCors = (handler: any) => {
  return httpAction(async (ctx, request) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    try {
      const response = await handler(ctx, request);
      // Add CORS headers to the actual response
      const headers = new Headers(response.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('Error in HTTP handler:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  });
};

// Apply CORS to all routes
http.route({
  path: "/create-razorpay-subscription",
  method: "POST",
  handler: withCors(createRazorpaySubscription),
});

// Keep the OPTIONS handler for preflight
http.route({
  path: "/create-razorpay-subscription",
  method: "OPTIONS",
  handler: handleOptions,
});

export default http;
