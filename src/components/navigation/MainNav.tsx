'use client';

// ASCII logo removed from navbar per request
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navItems = [
  { name: 'DASHBOARD', href: '/dashboard' },
  { name: 'MARKETS', href: '/markets' },
  { name: 'AGENTS', href: '/agents' },
  { name: 'RESEARCH', href: '/research' },
  { name: 'PREDICTIONS', href: '/predictions' },
  { name: 'LEADERBOARDS', href: '/leaderboards' },
  { name: 'BREEDING', href: '/breeding' },
  { name: 'WALLET', href: '/wallet' },
];

export function MainNav() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname.startsWith('/dashboard');
    }
    return pathname.startsWith(href);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav className="mb-8 pb-4 border-b-2 border-gray">
        <div className="flex items-center justify-between">
          <Link href="/landing" className="font-bold" onClick={closeMenu}>
            {/* ASCII logo removed; simple text placeholder shown instead */}
            <span className="font-sans text-sm">POLY</span>
          </Link>

          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="hamburger"
            type="button"
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>

          <div className={`flex gap-6 text-xs nav-links ${menuOpen ? 'open' : ''}`}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={closeMenu}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {menuOpen && (
        <>
          <div
            className="mobile-overlay"
            onClick={closeMenu}
            aria-hidden="true"
          />

          <aside className={`mobile-sidebar ${menuOpen ? 'open' : ''}`} aria-hidden={!menuOpen}>
            <div className="mobile-sidebar-inner">
              <div className="mobile-sidebar-header">
                <div className="mobile-sidebar-title">
                  <h2>Navigation</h2>
                </div>
                <button
                  className="close-button"
                  aria-label="Close menu"
                  onClick={closeMenu}
                  type="button"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>

              <nav className="mobile-nav">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
