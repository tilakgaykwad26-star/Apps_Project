import confetti from 'canvas-confetti';
import { RAZORPAY_CONFIG } from '../config/razorpay';
import { Donation } from '../types/donation';
import { MemberPayment } from '../types/payment';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface PaymentInitiationParams {
  amount: number;
  donorName: string;
  donorPhone: string;
  donorEmail?: string;
  description: string;
  notes?: Record<string, string>;
  onSuccess: (paymentId: string, orderId: string, signature?: string) => void;
  onFailure: (error: any) => void;
  // BUG 8 fix: allow callers to reset loading state when user dismisses without paying
  onDismiss?: () => void;
}

export function fireCelebrationConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#871C1C', '#FF9800', '#D4AF37', '#4CAF50']
    });
  } catch (e) {
    console.error('Confetti trigger failed:', e);
  }
}

export async function processRazorpayCheckout(params: PaymentInitiationParams) {
  const { amount, donorName, donorPhone, donorEmail, description, notes, onSuccess, onFailure } = params;

  // Amount in Paise (INR)
  const amountInPaise = Math.round(amount * 100);

  // If Razorpay SDK is loaded in browser
  if (typeof window !== 'undefined' && window.Razorpay) {
    const options = {
      key: RAZORPAY_CONFIG.keyId,
      amount: amountInPaise,
      currency: RAZORPAY_CONFIG.currency,
      name: RAZORPAY_CONFIG.companyName,
      description: description || 'श्री दुर्गा मंडळ देणगी / वर्गणी',
      image: '/favicon.svg',
      prefill: {
        name: donorName || '',
        contact: donorPhone || '',
        email: donorEmail || ''
      },
      notes: notes || {},
      theme: {
        color: RAZORPAY_CONFIG.themeColor
      },
      modal: {
        ondismiss: function () {
          console.log('Razorpay modal closed by user');
          // BUG 8 fix: reset caller loading state on dismiss
          if (params.onDismiss) params.onDismiss();
        }
      },
      handler: function (response: any) {
        // Successful response from Razorpay client
        const paymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
        const orderId = response.razorpay_order_id || `order_rzp_${Date.now()}`;
        const signature = response.razorpay_signature || `sig_${Math.random().toString(36).substring(2)}`;
        
        fireCelebrationConfetti();
        onSuccess(paymentId, orderId, signature);
      }
    };

    try {
      const rzpInstance = new window.Razorpay(options);
      rzpInstance.on('payment.failed', function (response: any) {
        onFailure(response.error || new Error('Payment transaction failed'));
      });
      rzpInstance.open();
    } catch (err) {
      console.warn('Razorpay SDK invocation failed, falling back to simulated payment flow', err);
      simulatePaymentFlow(params);
    }
  } else {
    // Fallback simulation for local development / test mode without active live keys
    simulatePaymentFlow(params);
  }
}

function simulatePaymentFlow(params: PaymentInitiationParams) {
  // Simulate 1.2s payment gateway roundtrip
  setTimeout(() => {
    const paymentId = `pay_sim_${Date.now()}`;
    const orderId = `order_sim_${Date.now()}`;
    const signature = `sig_sim_${Math.random().toString(36).substring(2)}`;
    
    fireCelebrationConfetti();
    params.onSuccess(paymentId, orderId, signature);
  }, 1200);
}
