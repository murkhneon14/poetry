import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

// Handle POST /create-razorpay-order
http.route({
  path: "/create-razorpay-order",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const { amount, currency, plan } = await request.json();
    
    // Get Razorpay keys from environment
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Convert amount to paise (smallest currency unit for INR)
    const amountInPaise = Math.round(amount * 100);
    
    const orderData = {
      amount: amountInPaise, // Razorpay expects amount in paise
      currency: currency || 'INR', // Default to INR
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        plan: plan,
        platform: 'web',
        original_amount: amount // Store original amount for reference
      }
    };

    try {
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
        },
        body: JSON.stringify(orderData)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Razorpay API error:', data);
        return new Response(
          JSON.stringify({ error: data.error?.description || 'Failed to create order' }),
          { status: response.status, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment order' }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  })
});

export default http;
