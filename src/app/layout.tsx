// src/app/layout.tsx
import './globals.css'; // DIES IST DER KORREKTE PFAD

export const metadata = {
  title: 'Community Panel - RockfordV',
  description: 'Your community\'s economy suggestion panel for RockfordV.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}