'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Show nothing while loading
  return <div />;
}