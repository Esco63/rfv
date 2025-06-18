// src/app/proposals/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase'; // Pfad zum Supabase-Client anpassen!
import Link from 'next/link';
import { User } from '@supabase/supabase-js'; // HINZUFÜGEN

const categories = ['Autos', 'Haus', 'Güter', 'Kleidung', 'Tattoos', 'Schmuck'];

export default function NewProposalPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // State für den angemeldeten Benutzer
  const [category, setCategory] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [price, setPrice] = useState<string>(''); // Preis als String für Flexibilität
  const [description, setDescription] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null); // Für den Dateiupload
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Effekt zum Prüfen des Benutzer-Logins beim Laden der Seite
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login'); // Zur Login-Seite umleiten, falls nicht angemeldet
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    } else {
      setImageFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    if (!user) {
      setError('Sie müssen angemeldet sein, um einen Vorschlag einzureichen.');
      setSubmitting(false);
      return;
    }

    let imageUrl: string | null = null;

    // 1. Bild hochladen (falls vorhanden)
    if (imageFile) {
      const fileExtension = imageFile.name.split('.').pop();
      const fileName = `<span class="math-inline">\{user\.id\}/</span>{Date.now()}.${fileExtension}`; // Eindeutiger Name

      const { error: uploadError } = await supabase.storage
        .from('proposal-images') // Der Bucket-Name, den wir gleich erstellen!
        .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false,
        });
    // KEINE ZUWEISUNG AN EINE 'data' VARIABLE

      if (uploadError) {
        console.error('Upload Error:', uploadError);
        setError(`Fehler beim Hochladen des Bildes: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
      imageUrl = `<span class="math-inline">\{process\.env\.NEXT\_PUBLIC\_SUPABASE\_URL\}/storage/v1/object/public/proposal\-images/</span>{fileName}`;
    }

    // 2. Vorschlag in die Datenbank einfügen
    const { error: dbError } = await supabase
      .from('proposals')
      .insert({
        category,
        name,
        price: parseFloat(price), // Preis in Zahl umwandeln
        description: description || null,
        image_url: imageUrl,
        user_id: user.id, // Die ID des angemeldeten Benutzers
        status: 'pending', // Initialer Status
      });

    if (dbError) {
      console.error('Database Error:', dbError);
      setError(`Fehler beim Speichern des Vorschlags: ${dbError.message}`);
    } else {
      setSuccessMessage('Vorschlag erfolgreich eingereicht! Er wird vom Admin überprüft.');
      // Formular zurücksetzen
      setCategory('');
      setName('');
      setPrice('');
      setDescription('');
      setImageFile(null);
      // Optional: Weiterleitung nach Erfolg
      // router.push('/dashboard');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="container"><p>Lade Benutzerdaten...</p></div>;
  }

  return (
    <div className="container">
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/dashboard">Zurück zum Dashboard</Link>
      </nav>
      <h2>Neuen Vorschlag einreichen</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="category">Kategorie:</label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Kategorie auswählen</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="name">Name des Vorschlags:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="price">Preis:</label>
          <input
            type="number" // Verwende number für Preiseingabe
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            step="0.01" // Ermöglicht Dezimalwerte
            required
          />
        </div>
        <div>
          <label htmlFor="description">Beschreibung (optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          ></textarea>
        </div>
        <div>
          <label htmlFor="image">Bild hochladen (optional):</label>
          <input
            type="file"
            id="image"
            accept="image/*" // Nur Bilder akzeptieren
            onChange={handleImageChange}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? 'Sende Vorschlag...' : 'Vorschlag absenden'}
        </button>
        <Link href="/dashboard" style={{ marginLeft: '10px' }}>
            <button type="button" style={{ backgroundColor: '#6c757d' }}>Abbrechen</button>
        </Link>
      </form>
    </div>
  );
}