// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>(''); // Neuer State für Benutzername
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>(''); // Für Erfolgsmeldungen

  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Prüfen, ob der Benutzername leer ist
    if (!username.trim()) {
      setError('Bitte gib einen Benutzernamen ein.');
      setLoading(false);
      return;
    }

    // 1. Benutzer bei Supabase Auth registrieren
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const newUser = data.user;

    if (newUser) {
      // 2. Benutzername in die profiles-Tabelle eintragen
      // Hier nutzen wir die von uns erstellte RLS-Policy "Users can create their own profile"
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id, // Die ID des gerade registrierten Benutzers
          username: username.trim(),
        });

      if (profileError) {
        // Falls der Benutzername schon existiert oder ein anderer Profilfehler auftritt
        // Wichtig: Supabase Auth-Konto wurde bereits erstellt, müsste man bei einem echten Projekt behandeln
        // z.B. auth.admin.deleteUser(newUser.id) oder Benutzer auffordern, den Nutzernamen zu ändern
        setError(`Fehler beim Speichern des Benutzernamens: ${profileError.message}. Versuche einen anderen Benutzernamen.`);
        // Optional: Den eben erstellten Auth-Nutzer löschen, falls Profilerstellung fehlschlägt
        await supabase.auth.admin.deleteUser(newUser.id); // ACHTUNG: Admin-Rechte nur im Backend nutzen! Hier nur zu Testzwecken oder für API Route.
                                                        // Für Frontend müsste man den Fehler anders abfangen oder diesen Schritt auslagern.
        setLoading(false);
        return;
      }

      setSuccessMessage('Registrierung erfolgreich! Bitte überprüfe deine E-Mails zur Bestätigung. Du wirst danach zur Login-Seite weitergeleitet.');
      // Nach kurzer Zeit zur Login-Seite weiterleiten
      setTimeout(() => {
        router.push('/login');
      }, 3000); // 3 Sekunden Wartezeit
    } else {
        // Sollte nicht passieren, da signUpError gehandhabt wird
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