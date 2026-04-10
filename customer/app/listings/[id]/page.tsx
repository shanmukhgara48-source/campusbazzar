'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listingsApi, offersApi, razorpayApi, ApiListing } from '@/lib/api';
import { useAuth } from '@/lib/auth';

declare global {
  interface Window { Razorpay: any; }
}

export default function ListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [listing, setListing]       = useState<ApiListing | null>(null);
  const [loading, setLoading]       = useState(true);
  const [imgIndex, setImgIndex]     = useState(0);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerNote, setOfferNote]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState<string | null>(null);
  const [showOffer, setShowOffer]   = useState(false);

  useEffect(() => {
    listingsApi.get(id)
      .then(({ listing }) => setListing(listing))
      .finally(() => setLoading(false));
  }, [id]);

  function showMsg(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleBuyNow() {
    if (!user) { router.push('/login'); return; }
    if (!listing) return;
    setSubmitting(true);
    try {
      // Load Razorpay script
      if (!window.Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const { orderId, keyId } = await razorpayApi.createOrder(listing.price * 100, listing.id);
      const rzp = new window.Razorpay({
        key: keyId,
        amount: listing.price * 100,
        currency: 'INR',
        name: 'CampusBazaar',
        description: listing.title,
        order_id: orderId,
        handler: async (response: any) => {
          await listingsApi.buyNow(listing.id, {
            paymentMethod: 'online',
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
          showMsg('Purchase successful!');
          setTimeout(() => router.push('/profile'), 1500);
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#0284c7' },
      });
      rzp.open();
    } catch (e: any) {
      showMsg(e.message ?? 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOffer(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    const amount = Number(offerAmount);
    if (!amount || amount <= 0) { showMsg('Enter a valid offer amount'); return; }
    setSubmitting(true);
    try {
      await offersApi.create(listing!.id, amount, offerNote || undefined);
      showMsg('Offer sent!');
      setShowOffer(false);
      setOfferAmount('');
      setOfferNote('');
    } catch (e: any) {
      showMsg(e.message ?? 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-900 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-900 rounded animate-pulse" />
            <div className="h-6 bg-gray-900 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-900 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <div className="text-center py-20 text-gray-400">Listing not found.</div>;
  }

  const isSold = listing.status === 'sold';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-3 rounded-xl shadow-xl border border-gray-700">
          {toast}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
            {listing.images?.[imgIndex] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.images[imgIndex]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl text-gray-700">📦</div>
            )}
          </div>
          {listing.images?.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {listing.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={img}
                  alt=""
                  onClick={() => setImgIndex(i)}
                  className={`w-16 h-16 rounded-lg object-cover cursor-pointer flex-shrink-0 border-2 transition-colors ${i === imgIndex ? 'border-primary-500' : 'border-gray-700'}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <span className="text-xs text-gray-500 uppercase tracking-wide">{listing.category}</span>
            <h1 className="text-2xl font-bold text-white mt-1">{listing.title}</h1>
            <p className="text-3xl font-bold text-primary-400 mt-2">₹{listing.price.toLocaleString()}</p>
          </div>

          <div className="flex gap-2">
            <span className="text-xs px-3 py-1 bg-gray-800 rounded-full text-gray-300 capitalize">
              {listing.condition?.replace('_', ' ')}
            </span>
            {listing.department && (
              <span className="text-xs px-3 py-1 bg-gray-800 rounded-full text-gray-300">{listing.department}</span>
            )}
          </div>

          <p className="text-gray-300 text-sm leading-relaxed">{listing.description}</p>

          {listing.sellerName && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-lg">
                {listing.sellerName[0]}
              </span>
              <span>Sold by <strong className="text-white">{listing.sellerName}</strong></span>
            </div>
          )}

          {isSold ? (
            <div className="bg-red-950 border border-red-800 rounded-xl px-4 py-3 text-red-400 text-center font-semibold">
              This item has been sold
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <button
                onClick={handleBuyNow}
                disabled={submitting}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors text-base"
              >
                {submitting ? 'Processing...' : 'Buy Now'}
              </button>

              <button
                onClick={() => setShowOffer(!showOffer)}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-colors text-base border border-gray-700"
              >
                Make an Offer
              </button>

              {/* Offer form */}
              {showOffer && (
                <form onSubmit={handleOffer} className="bg-gray-900 rounded-xl p-4 border border-gray-700 space-y-3">
                  <label className="block text-xs text-gray-400 font-medium">Your offer (₹)</label>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={e => setOfferAmount(e.target.value)}
                    placeholder={`Max ${listing.price}`}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                  <input
                    type="text"
                    value={offerNote}
                    onChange={e => setOfferNote(e.target.value)}
                    placeholder="Message to seller (optional)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
                  >
                    {submitting ? 'Sending...' : 'Send Offer'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
