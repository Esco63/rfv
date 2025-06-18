// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js'; // Importieren für den Typ User

export default function RegisterPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>(''); // Neuer State für Benutzername
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (!username.trim()) {
      setError('Bitte gib einen Benutzernamen ein.');
      setLoading(false);
      return;
    }

    // 1. Benutzer bei Supabase Auth registrieren
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const newUser = signUpData.user;

    if (newUser) {
      // 2. Das vom Trigger ERSTELLTE Profil mit dem gewählten Benutzernamen AKTUALISIEREN
      // Hier nutzen wir die RLS-Policy "Users can update their own profile"
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ username: username.trim() }) // Hier aktualisieren wir den Benutzernamen
        .eq('id', newUser.id); // Aktualisiere das Profil des neu registrierten Benutzers

      if (profileUpdateError) {
        console.error("Fehler beim Aktualisieren des Benutzernamens:", profileUpdateError.message);
        // Wenn der Benutzername bereits vergeben ist (UNIQUE-Constraint)
        if (profileUpdateError.code === '23505') { // PostgreSQL Unique Violation Error Code
            setError(`Dieser Benutzername "${username.trim()}" ist bereits vergeben. Bitte wähle einen anderen.`);
        } else {
            setError(`Fehler beim Speichern des Benutzernamens: ${profileUpdateError.message}.`);
        }
        setLoading(false);
        return;
      }

      setSuccessMessage('Registrierung erfolgreich! Bitte überprüfe deine E-Mails zur Bestätigung (falls aktiviert). Du wirst gleich zur Login-Seite weitergeleitet.');
      setTimeout(() => {
        router.push('/login');
      }, 4000); // 4 Sekunden Wartezeit, um die Nachricht zu lesen
    } else {
        setError('Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.');
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
          <label htmlFor="username">Benutzername:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3} // Mindestlänge für Benutzername
            maxLength={20} // Maximallänge
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
            minLength={6} // Mindestlänge für Supabase Standard
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
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