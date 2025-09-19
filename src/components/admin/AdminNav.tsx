'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
  { name: 'Content', href: '/admin/content', icon: '📝' },
  { name: 'Embeddings', href: '/admin/embeddings', icon: '🧠' },
  { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
  { name: 'Database', href: '/admin/database', icon: '🗄️' },
];

export default function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    setIsLoggingOut(true);
    try {
      await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      
      router.push('/admin/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="bg-background border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/admin/dashboard" className="flex-shrink-0">
              <h1 className="text-foreground text-lg font-serif font-semibold">
                Digital Twin Admin
              </h1>
            </Link>
            
            <div className="hidden md:flex space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 text-sm font-sans transition-colors border-b-2 ${
                      isActive
                        ? 'text-foreground border-foreground font-medium'
                        : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted'
                    }`}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              target="_blank"
              className="text-muted-foreground hover:text-foreground text-sm font-sans transition-colors"
            >
              View Site
            </Link>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-foreground text-background hover:bg-secondary px-4 py-2 text-sm font-sans font-medium disabled:opacity-50 transition-colors"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-sans transition-colors ${
                    isActive
                      ? 'text-foreground font-medium border-l-2 border-foreground pl-4'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}