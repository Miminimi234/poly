"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function BreedingPage() {
  const router = useRouter();

  useEffect(() => {
    // Breeding feature removed — redirect to dashboard
    router.replace('/dashboard');
  }, [router]);

  return null;
}
