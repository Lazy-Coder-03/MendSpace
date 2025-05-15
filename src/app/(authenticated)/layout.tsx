import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
              <Navigation />
            </aside>
            <div className="flex-1 overflow-x-auto">
              {children}
            </div>
          </div>
        </main>
        <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border mt-auto">
          © {new Date().getFullYear()} Mendspace. All rights reserved.
        </footer>
      </div>
    </AuthGuard>
  );
}
