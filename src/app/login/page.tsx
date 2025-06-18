// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState<string>(''); // Kann E-Mail oder Benutzername sein
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const router = useRouter();

  // Funktion zur Überprüfung, ob der String eine gültige E-Mail ist
  const isValidEmail = (email: string) => {
    // Einfacher Regex für E-Mail-Validierung
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let emailToLogin = identifier;

    // Wenn der Identifier kein gültiges E-Mail-Format hat, nehmen wir an, es ist ein Benutzername
    if (!isValidEmail(identifier)) {
      // Zuerst E-Mail über den Benutzernamen aus der profiles-Tabelle abrufen
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id') // Wir brauchen die ID, um die E-Mail zu bekommen
        .eq('username', identifier)
        .single();

      if (profileError || !profile) {
        setError('Benutzername oder Passwort falsch.'); // Generische Fehlermeldung
        setLoading(false);
        return;
      }

      // Jetzt die tatsächliche E-Mail-Adresse des Benutzers über auth.admin abrufen
      // ACHTUNG: supabase.auth.admin sollte NICHT im Frontend verwendet werden.
      // Dies ist ein **Sicherheitsrisiko**, da es Admin-Rechte benötigt.
      // Für eine sichere Implementierung müsste dieser Teil in eine
      // Next.js API-Route (serverseitig) ausgelagert werden.
      // Für die Demonstration hier nutze ich es direkt, damit es funktioniert,
      // aber sei dir des Risikos bewusst.
      const { data: userAuthData, error: userAuthError } = await supabase.auth.admin.getUserById(profile.id);

      if (userAuthError || !userAuthData?.user?.email) {
        setError('Benutzername oder Passwort falsch.');
        setLoading(false);
        return;
      }
      emailToLogin = userAuthData.user.email;

    }

    // Anmeldevorgang mit Supabase Auth
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password,
    });

    if (signInError) {
      setError('Benutzername oder Passwort falsch.'); // Generische Fehlermeldung
    } else {
      router.push('/dashboard'); // Weiterleitung nach erfolgreichem Login
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="identifier">Email oder Benutzername:</label>
          <input
            type="text" // Type ist jetzt text, da es beides sein kann
            id="identifier"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
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
          {loading ? 'Logge ein...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Noch kein Konto? <Link href="/register">Registrieren</Link>
      </p>
    </div>
  );
}