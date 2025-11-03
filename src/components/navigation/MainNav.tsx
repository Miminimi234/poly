'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { name: 'DASHBOARD', href: '/dashboard' },
  { name: 'AGENTS', href: '/agents' },
  { name: 'RESEARCH', href: '/research' },
  { name: 'PREDICTIONS', href: '/predictions' },
  { name: 'LEADERBOARDS', href: '/leaderboards' },
  { name: 'BREEDING', href: '/breeding' },
  { name: 'WALLET', href: '/wallet' },
];

export function MainNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="mb-8 pb-6">
      <div className="flex items-center justify-between py-4">
        <Link href="/" className="text-3xl font-black gradient-text tracking-tight">
          POLY402
        </Link>
        
        <div className="flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item text-sm font-medium ${
                isActive(item.href) ? 'active' : ''
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
