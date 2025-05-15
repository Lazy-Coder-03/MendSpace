
import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Header } from '@/components/layout/Header';
// Navigation is now part of the Header via a Sheet component

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
          {/* The two-column layout with a dedicated aside for navigation is removed. 
              Content will now naturally flow or can be centered as needed. */}
          <div className="flex-1"> {/* Ensure content takes up available space */}
            {children}
          </div>
        </main>
        <footer className="text-center py-6 text-muted-foreground text-sm border-t border-border mt-auto">
          © {new Date().getFullYear()} Mendspace. All rights reserved.
        </footer>
      </div>
    </AuthGuard>
  );
}
