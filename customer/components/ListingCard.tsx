import Link from 'next/link';
import { ApiListing } from '@/lib/api';

const CONDITION_COLORS: Record<string, string> = {
  new:        'bg-green-900 text-green-300',
  like_new:   'bg-blue-900 text-blue-300',
  good:       'bg-yellow-900 text-yellow-300',
  fair:       'bg-orange-900 text-orange-300',
  poor:       'bg-red-900 text-red-300',
};

export default function ListingCard({ listing }: { listing: ApiListing }) {
  const img = listing.images?.[0];
  const conditionLabel = listing.condition?.replace('_', ' ') ?? '';

  return (
    <Link href={`/listings/${listing.id}`} className="group block bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-primary-500 transition-all hover:-translate-y-0.5">
      <div className="aspect-square bg-gray-800 overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-700">📦</div>
        )}
      </div>
      <div className="p-3">
        <p className="text-white font-semibold text-sm truncate">{listing.title}</p>
        <p className="text-primary-400 font-bold mt-1">₹{listing.price.toLocaleString()}</p>
        <div className="flex items-center justify-between mt-2">
          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${CONDITION_COLORS[listing.condition] ?? 'bg-gray-800 text-gray-400'}`}>
            {conditionLabel}
          </span>
          <span className="text-xs text-gray-500">{listing.category}</span>
        </div>
        {listing.status === 'sold' && (
          <div className="mt-2 text-center text-xs font-bold text-red-400 bg-red-950 rounded-lg py-0.5">SOLD</div>
        )}
      </div>
    </Link>
  );
}
