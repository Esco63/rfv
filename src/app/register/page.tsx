// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; // Korrekter Pfad zum Supabase-Client

export default function RegisterPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      alert('Registrierung erfolgreich! Bitte überprüfe deine E-Mails zur Bestätigung (oder deaktiviere die Bestätigung in Supabase Auth Settings für Tests).');
      router.push('/login'); // Weiterleitung zur Login-Seite
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h2>Registrieren</h2>
      <form onSubmit={handleRegister}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Passwort:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registriere...' : 'Registrieren'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Bereits registriert? <Link href="/login">Login</Link>
      </p>
    </div>
  );
}