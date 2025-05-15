
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, ListChecks, History, Edit3 } from 'lucide-react'; 

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/submissions', label: 'Submissions', icon: ListChecks },
  { href: '/previous-submissions', label: 'Previous Entries', icon: History },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-card/70 backdrop-blur-sm p-4 rounded-lg shadow-lg">
      <ul className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-md hover:bg-accent hover:text-accent-foreground transition-all duration-200 ease-in-out group',
                  isActive 
                    ? 'bg-[linear-gradient(to_right,var(--gradient-start-color),var(--gradient-end-color))] text-primary-foreground shadow-inner font-medium' 
                    : 'text-foreground/80 hover:shadow-sm'
                )}
              >
                <item.icon className={cn('h-5 w-5 transition-transform duration-300 group-hover:scale-110', isActive ? 'text-primary-foreground' : 'text-primary')} />
                <span className="text-sm">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

    