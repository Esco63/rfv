// src/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container">
      <h1>Willkommen im Community Vorschlagspanel!</h1>
      <p>Hier kannst du Vorschläge für unsere Wirtschaft machen.</p>
      <nav>
        <Link href="/login">Login</Link>
        <Link href="/register">Registrieren</Link>
      </nav>
    </div>
  );
}