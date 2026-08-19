'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/entry', label: 'Add Entry' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/analytics', label: 'Analytics' },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, width: '220px', height: '100vh',
      background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem', zIndex: 100,
    }}>
      <div style={{ marginBottom: '2.5rem', paddingLeft: '0.5rem' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Ledger</div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Personal Finance
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} style={{
              display: 'flex', alignItems: 'center', padding: '0.6rem 0.75rem',
              borderRadius: '8px', fontSize: '0.875rem',
              fontWeight: active ? 500 : 400,
              color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: active ? 'var(--bg-raised)' : 'transparent',
              textDecoration: 'none',
            }}>
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}