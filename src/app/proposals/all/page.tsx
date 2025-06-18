// src/app/proposals/all/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../../../lib/supabase';
// import { User } from '@supabase/supabase-js'; // Nicht mehr benötigt

// Typdefinition für einen Vorschlag
interface Proposal {
  id: number;
  created_at: string;
  category: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
  status: 'pending' | 'approved' | 'completed';
  user_id: string;
}

export default function AllProposalsPage() {
  const router = useRouter();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchProposals = async () => {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Umleitung, falls nicht angemeldet
        return;
      }

      // Hole alle Vorschläge, die "approved" oder "completed" sind.
      const { data, error: fetchError } = await supabase
        .from('proposals')
        .select('*')
        .in('status', ['approved', 'completed']) // Nur genehmigte oder abgeschlossene
        .order('created_at', { ascending: false }); // Neueste zuerst

      if (fetchError) {
        console.error('Fehler beim Laden der Vorschläge:', fetchError.message);
        setError('Fehler beim Laden der Vorschläge.');
        setProposals([]);
      } else {
        setProposals(data || []);
      }
      setLoading(false);
    };

    fetchProposals();

    // Optional: Listener für Auth-Zustandsänderungen, um Daten neu zu laden
    // `_` als Präfix für ungenutzte Parameter, um Linter zu beruhigen
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, _session) => { // <-- HIER DIE ÄNDERUNG: `session` zu `_session` geändert.
                              // ACHTUNG: Ich habe es in der letzten Nachricht bereits hier angepasst.
                              // Wenn es immer noch meckert, müssen wir den ESLint-Regel deaktivieren.
                              // Der Fehler kommt also immer noch vom nicht aktualisierten Code.
        if (event === 'SIGNED_OUT') {
          router.push('/login');
        } else if (event === 'SIGNED_IN') {
          fetchProposals(); // Daten neu laden bei Anmeldung
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center' }}>
        <p>Lade Vorschläge...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <p className="error-message">{error}</p>
        <Link href="/dashboard">Zurück zum Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <nav style={{ marginBottom: '20px', textAlign: 'left' }}>
        <Link href="/dashboard">Zurück zum Dashboard</Link>
      </nav>
      <h2>Alle Vorschläge</h2>

      {proposals.length === 0 ? (
        <p>Es sind noch keine genehmigten oder abgeschlossenen Vorschläge vorhanden.</p>
      ) : (
        <div className="proposals-grid">
          {proposals.map((proposal) => (
            <div key={proposal.id} className="proposal-card">
              {proposal.image_url && (
                <div className="proposal-image-wrapper">
                  <Image
                    src={proposal.image_url}
                    alt={proposal.name}
                    width={300} // Beispielbreite
                    height={200} // Beispielhöhe
                    objectFit="cover" // Passt Bild an und schneidet ggf. ab
                  />
                </div>
              )}
              <div className="proposal-content">
                <h3>{proposal.name}</h3>
                <p><strong>Kategorie:</strong> {proposal.category}</p>
                <p><strong>Preis:</strong> ${proposal.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                {proposal.description && <p>{proposal.description}</p>}
                <p className={`proposal-status status-${proposal.status}`}>
                  Status: {proposal.status === 'approved' ? 'Genehmigt' : 'Abgeschlossen'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}