import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Personal Finance Tracker',
  description: 'Track income, expenses, and spending patterns',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Nav />
          <main style={{ flex: 1, marginLeft: '220px', padding: '2rem' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}