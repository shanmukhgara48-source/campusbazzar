'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken } from '@/lib/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    // Verify the token has `isAdmin: true` by decoding the JWT payload locally.
    // The backend enforces the signature — this client-side check just prevents
    // an unnecessary redirect flash for expired tokens.
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expired = payload.exp && payload.exp < Math.floor(Date.now() / 1000);
      if (!payload.isAdmin || expired) {
        router.replace('/login');
        return;
      }
    } catch {
      router.replace('/login');
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          Verifying access...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
