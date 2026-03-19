/**
 * Razorpay payment service — WebView-based checkout (Expo-compatible).
 *
 * Setup:
 *   npx expo install react-native-webview
 *
 * Configuration:
 *   Set EXPO_PUBLIC_RAZORPAY_KEY_ID in your .env file:
 *     EXPO_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXXX
 *
 * For production:
 *   - Replace rzp_test_ key with rzp_live_ key
 *   - Create Razorpay orders server-side (Firebase Cloud Function) and pass
 *     the returned order_id as RazorpayOptions.orderId for signature verification
 */

// ─── Config ──────────────────────────────────────────────────────────────────

export const RAZORPAY_KEY_ID: string =
  (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID as string) ?? '';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RazorpayOptions {
  /** Amount in whole rupees (service converts to paise internally). */
  amount: number;
  currency?: string;
  /** Shown as merchant name in the checkout sheet. */
  name: string;
  description: string;
  /** Merchant logo URL (optional). */
  image?: string;
  /**
   * Razorpay order_id — required for production signature verification.
   * Create the order via a Firebase Cloud Function / your backend.
   */
  orderId?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
}

export type RazorpayWebMessage =
  | { type: 'PAYMENT_SUCCESS'; payment_id: string; order_id: string; signature: string }
  | { type: 'PAYMENT_FAILED';  code: string; description: string }
  | { type: 'PAYMENT_CANCELLED' };

// ─── HTML generator ───────────────────────────────────────────────────────────

/**
 * Returns an HTML string to be loaded in a react-native-webview.
 * Razorpay's checkout.js is loaded from their CDN; the handler/failure
 * callbacks post a JSON message back to React Native via
 * window.ReactNativeWebView.postMessage().
 */
export function generateCheckoutHTML(options: RazorpayOptions): string {
  const amountInPaise = options.amount * 100;
  const currency      = options.currency ?? 'INR';
  const themeColor    = '#1a5c3a';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Payment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; background: #f0efeb;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .card {
      background: #fff; border-radius: 16px; padding: 32px 24px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.1); text-align: center;
      max-width: 320px; width: 90%;
    }
    .spinner {
      width: 44px; height: 44px;
      border: 3px solid #e0e0e0;
      border-top-color: ${themeColor};
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .title { font-size: 16px; font-weight: 600; color: #222; margin-bottom: 8px; }
    .sub   { font-size: 13px; color: #888; line-height: 1.5; }
    .amount {
      font-size: 22px; font-weight: 700; color: ${themeColor};
      margin: 16px 0 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <div class="title">Secure Payment</div>
    <div class="amount">₹${options.amount.toLocaleString('en-IN')}</div>
    <div class="sub">Opening Razorpay checkout…<br/>Do not press back</div>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    function postToRN(data) {
      try { window.ReactNativeWebView.postMessage(JSON.stringify(data)); }
      catch(e) { console.error('postMessage failed', e); }
    }

    window.addEventListener('load', function () {
      var options = {
        key:         ${JSON.stringify(RAZORPAY_KEY_ID)},
        amount:      ${amountInPaise},
        currency:    ${JSON.stringify(currency)},
        name:        ${JSON.stringify(options.name)},
        description: ${JSON.stringify(options.description)},
        image:       ${JSON.stringify(options.image ?? '')},
        ${options.orderId ? `order_id: ${JSON.stringify(options.orderId)},` : ''}
        prefill: {
          name:    ${JSON.stringify(options.buyerName  ?? '')},
          email:   ${JSON.stringify(options.buyerEmail ?? '')},
          contact: ${JSON.stringify(options.buyerPhone ?? '')}
        },
        notes: {},
        theme: { color: ${JSON.stringify(themeColor)} },
        modal: {
          backdropclose: false,
          escape:        false,
          ondismiss: function () {
            postToRN({ type: 'PAYMENT_CANCELLED' });
          }
        },
        handler: function (response) {
          postToRN({
            type:       'PAYMENT_SUCCESS',
            payment_id: response.razorpay_payment_id,
            order_id:   response.razorpay_order_id  || '',
            signature:  response.razorpay_signature  || ''
          });
        }
      };

      var rzp = new Razorpay(options);

      rzp.on('payment.failed', function (response) {
        postToRN({
          type:        'PAYMENT_FAILED',
          code:        response.error.code,
          description: response.error.description
        });
      });

      // Small delay so the loading card is visible briefly
      setTimeout(function () { rzp.open(); }, 400);
    });
  </script>
</body>
</html>`;
}
