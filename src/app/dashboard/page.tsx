// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; // Korrekter Pfad zum Supabase-Client
import { User } from '@supabase/supabase-js'; // Typ-Import für User

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    const checkUserAndAdminStatus = async () => {
      setLoading(true); // Setze loading am Anfang des Effekts auf true
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login'); // Keine Session, zur Login-Seite umleiten
        return;
      }

      setUser(user);

      // Prüfe den Admin-Status aus der profiles Tabelle
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        // Auch wenn ein Fehler auftritt, ist der Benutzer kein Admin
        setIsAdmin(false);
      } else if (profile && profile.is_admin) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false); // Setze loading am Ende des Effekts auf false
    };

    checkUserAndAdminStatus();

    // Optional: Listener für Auth-Zustandsänderungen
    // Beachte die Korrektur hier: .data.subscription.unsubscribe()
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user || null);
          // Re-check admin status on sign in
          checkUserAndAdminStatus(); // Erneut prüfen, falls sich der Benutzer anmeldet
        }
      }
    );

    return () => {
      // Wichtig: Korrigierte Zeile für .unsubscribe()
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    }
    // useRouter.push('/login') wird durch onAuthStateChange ausgelöst
    setLoading(false);
  };

  if (loading) {
    return <div className="container"><p>Lade Benutzerdaten...</p></div>;
  }

  return (
    <div className="container">
      <h2>Willkommen, {user?.email}!</h2>
      <p>Du bist im geschützten Dashboard-Bereich.</p>
      {isAdmin && <p style={{ color: 'green', fontWeight: 'bold' }}>(Du bist ein Admin)</p>}

      <button onClick={handleLogout} disabled={loading}>
        {loading ? 'Logge aus...' : 'Logout'}
      </button>

      <div style={{ marginTop: '30px' }}>
        <h3>Aktionen:</h3>
        <p>
          <Link href="/proposals/new">Neuen Vorschlag einreichen</Link>
        </p>
        <p>
          <Link href="/proposals">Alle Vorschläge ansehen</Link>
        </p>

        {isAdmin && (
          <div style={{ borderTop: '1px solid #eee', paddingTop: '20px', marginTop: '20px' }}>
            <h3>Admin-Bereich:</h3>
            <p>
              <Link href="/admin/proposals/review">Vorschläge zur Überprüfung</Link>
            </p>
            <p>
              <Link href="/admin/users">Benutzer verwalten</Link> {/* Später implementieren */}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}