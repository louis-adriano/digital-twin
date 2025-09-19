'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
            Admin Access
          </h1>
          <p className="text-muted-foreground font-sans font-light">
            Enter your credentials to access the digital twin admin panel
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="password" className="block text-sm font-sans font-medium text-foreground mb-2">
              Administrator Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="Enter admin password"
              className="w-full px-4 py-3 border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent font-sans"
              disabled={isLoading}
            />
            {errors.password && (
              <p className="mt-2 text-sm text-destructive font-sans">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <div className="bg-card border border-destructive/20 p-4">
              <p className="text-sm text-destructive font-sans">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-foreground text-background hover:bg-secondary py-3 px-4 font-sans font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Access Admin Panel'}
            </button>
          </div>
          
          <div className="text-center">
            <a
              href="/"
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Return to Portfolio
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}