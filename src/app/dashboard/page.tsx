// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// Typdefinition für Profil
interface UserProfile {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Fehler beim Abrufen des Profils:', profileError.message);
        // Fallback: Wenn Profil nicht gefunden, behandeln als Nicht-Admin
        setUserProfile({ id: user.id, username: user.email || 'Unbekannt', is_admin: false, created_at: '' });
      } else if (profile) {
        setUserProfile(profile);
      } else {
        // Falls kein Profil gefunden wird (was nach Registrierung nicht passieren sollte, aber als Fallback)
        setUserProfile({ id: user.id, username: user.email || 'Unbekannt', is_admin: false, created_at: '' });
      }
      
      setLoading(false);
    };

    checkUserAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user || null);
          checkUserAndProfile();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout Fehler:', error.message);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="container" style={{ textAlign: 'center' }}><p>Lade Benutzerdaten...</p></div>;
  }

  // Benutzername anzeigen, wenn verfügbar, sonst E-Mail
  const displayName = userProfile?.username || user?.email || 'RockfordV-Bürger';

  return (
    <div className="container dashboard-container">
      <h1 className="dashboard-title">Willkommen, {displayName}!</h1>
      <p className="welcome-message">Dein Zugang zum RockfordV-Wirtschaftspanel.</p>
      {userProfile?.is_admin && <p className="admin-status">(Du bist ein Administrator)</p>}

      {/* WRAPPER FÜR SEKTIONEN - Wichtig für nebeneinander Layout */}
      <div className="dashboard-sections-wrapper">
        <div className="dashboard-section community-section">
          <h3>Community-Aktionen</h3>
          <nav className="dashboard-nav">
            <Link href="/proposals/new" className="nav-item">
              Neuen Vorschlag einreichen
            </Link>
            <Link href="/proposals/my" className="nav-item">
              Meine Vorschläge ansehen
            </Link>
            <Link href="/proposals/all" className="nav-item">
              Alle Vorschläge ansehen
            </Link>
          </nav>
        </div>

        {userProfile?.is_admin && (
          <div className="dashboard-section admin-section">
            <h3>Admin-Bereich</h3>
            <nav className="dashboard-nav">
              <Link href="/admin/proposals/review" className="nav-item admin-nav-item">
                Vorschläge zur Überprüfung
              </Link>
              <Link href="/admin/users" className="nav-item admin-nav-item">
                Benutzer verwalten
              </Link>
            </nav>
          </div>
        )}
      </div> {/* ENDE WRAPPER */}

      <div className="dashboard-footer">
        <button onClick={handleLogout} disabled={loading}>
          Logout
        </button>
      </div>
    </div>
  );
}