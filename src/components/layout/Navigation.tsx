
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, ListChecks, History } from 'lucide-react'; 

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/submissions', label: 'Submissions', icon: ListChecks },
  { href: '/previous-submissions', label: 'Previous Entries', icon: History },
];

interface NavigationProps {
  onLinkClick?: () => void; // Optional callback for when a link is clicked
}

export function Navigation({ onLinkClick }: NavigationProps) {
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <nav className="bg-transparent p-0 md:bg-card/70 md:backdrop-blur-sm md:p-4 md:rounded-lg md:shadow-lg"> {/* Adjust background for sheet vs potential desktop */}
      <ul className="flex flex-col space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/home' && pathname === '/');
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleLinkClick} // Call the handler to close the sheet
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
