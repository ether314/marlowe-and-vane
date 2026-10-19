// Firebase wiring. Loaded lazily so the page paints before any network work begins.
// Reads: pieces and origins are public. Writes: visitors may only append newsletter sign-ups and bag
// reservations (see firestore.rules).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

let db;
const database = () => (db ??= getFirestore(initializeApp(firebaseConfig)));

export async function fetchCatalog() {
  const d = database();
  const [pieces, origins] = await Promise.all([getDocs(collection(d, 'pieces')), getDocs(collection(d, 'origins'))]);
  return {
    pieces: pieces.docs.map((s) => ({ ...s.data(), slug: s.id })),
    origins: origins.docs.map((s) => ({ ...s.data(), id: s.id })),
  };
}

export async function addSubscriber(email, source = 'site') {
  await addDoc(collection(database(), 'subscribers'), { email, source, createdAt: serverTimestamp() });
}

export async function addReservation({ name, email, note, items, subtotal }) {
  await addDoc(collection(database(), 'reservations'), {
    name,
    email,
    ...(note ? { note } : {}),
    items,
    subtotal,
    currency: 'USD',
    source: 'bag',
    createdAt: serverTimestamp(),
  });
}
