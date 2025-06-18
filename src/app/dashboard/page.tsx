// src/app/(app)/dashboard/page.tsx
'use client';

// Wichtiger Hinweis: user und userProfile kommen jetzt aus dem (app)/layout.tsx context
// Für eine korrekte Typisierung hier könnte man React Context oder zustand/jotai verwenden.
// Für Einfachheit rufen wir hier getUser direkt auf, um sicherzustellen, dass die Daten verfügbar sind.
// In einem größeren Projekt würde man einen Global State Manager nutzen.

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase'; // Korrigierter Pfad
import { User } from '@supabase/supabase-js';

// Typdefinition für Profil
interface UserProfile {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile) {
          setUserProfile(profile);
        } else if (error) {
          console.error("Error fetching profile in dashboard:", error.message);
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  if (loading) {
    return <div className="content-area"><p>Lade Dashboard-Inhalte...</p></div>;
  }

  const displayName = userProfile?.username || user?.email || 'RockfordV-Bürger';

  return (
    <div className="content-area dashboard-content">
      <h1 className="dashboard-title">Willkommen, {displayName}!</h1>
      <p className="welcome-message">Dein Zugang zum RockfordV-Wirtschaftspanel.</p>
      {userProfile?.is_admin && <p className="admin-status">(Du bist ein Administrator)</p>}

      {/* Hier könnten weitere Dashboard-Widgets oder Statistiken stehen */}
      <p style={{marginTop: '30px', fontSize: '1.1em', color: 'var(--color-text-light)'}}>
        Wähle eine Option aus der Seitenleiste, um fortzufahren.
      </p>
    </div>
  );
}