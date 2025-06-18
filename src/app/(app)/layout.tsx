// src/app/(app)/layout.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabase'; // <-- KORREKTER PFAD FÜR (app)/layout.tsx
import { User } from '@supabase/supabase-js';

// Typdefinition für Profil
interface UserProfile {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

// Sidebar Komponente
const Sidebar = ({ userProfile, handleLogout, currentPath }: { userProfile: UserProfile | null; handleLogout: () => void; currentPath: string; }) => {
  // Hilfsfunktion, um aktive Links hervorzuheben
  const isActive = (path: string) => currentPath.startsWith(path);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">RockfordV Panel</h2>
        {userProfile && (
          <p className="sidebar-welcome">Willkommen, <br />
            <span className="sidebar-username">{userProfile.username || userProfile.id}!</span>
          </p>
        )}
        {userProfile?.is_admin && <span className="admin-badge">Admin</span>}
      </div>

      <nav className="sidebar-nav">
        <Link href="/dashboard" className={`sidebar-nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
          Dashboard
        </Link>
        <div className="sidebar-section-title">Community</div>
        <Link href="/proposals/new" className={`sidebar-nav-item ${isActive('/proposals/new') ? 'active' : ''}`}>
          Neuer Vorschlag
        </Link>
        <Link href="/proposals/my" className={`sidebar-nav-item ${isActive('/proposals/my') ? 'active' : ''}`}>
          Meine Vorschläge
        </Link>
        <Link href="/proposals/all" className={`sidebar-nav-item ${isActive('/proposals/all') ? 'active' : ''}`}>
          Alle Vorschläge
        </Link>

        {userProfile?.is_admin && (
          <>
            <div className="sidebar-section-title">Admin-Bereich</div>
            <Link href="/admin/proposals/review" className={`sidebar-nav-item ${isActive('/admin/proposals/review') ? 'active' : ''}`}>
              Vorschläge überprüfen
            </Link>
            <Link href="/admin/users" className={`sidebar-nav-item ${isActive('/admin/users') ? 'active' : ''}`}>
              Benutzer verwalten
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="sidebar-logout-button">
          Logout
        </button>
      </div>
    </aside>
  );
};

// Hauptlayout für geschützte Seiten
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // Um den aktuellen Pfad zu bekommen für aktive Links
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserAndProfile = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login'); // Umleiten, wenn nicht angemeldet
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
        setUserProfile({ id: user.id, username: user.email || 'Unbekannt', is_admin: false, created_at: '' });
      } else if (profile) {
        setUserProfile(profile);
      } else {
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
    return (
      <div className="full-page-loader">
        <p>Lade Inhalte...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar userProfile={userProfile} handleLogout={handleLogout} currentPath={pathname} />
      <main className="app-content">
        {children} {/* Hier werden die jeweiligen Seiteninhalte gerendert */}
      </main>
    </div>
  );
}