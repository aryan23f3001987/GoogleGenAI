import React, { useEffect, useState } from 'react';
import './journal-animated-bg.css';
import Particles from './Particles';
import { collection, addDoc, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, serverTimestamp } from 'firebase/firestore';

const Journal = ({ user, db, onLogout }) => {
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'journalNotes'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user, db]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    await addDoc(collection(db, 'journalNotes'), {
      uid: user.uid,
      text: note,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setNote('');
  };

  const handleEdit = async (id) => {
    await updateDoc(doc(db, 'journalNotes', id), {
      text: editText,
      updatedAt: serverTimestamp(),
    });
    setEditId(null);
    setEditText('');
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'journalNotes', id));
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center pt-36 pb-12 px-2 relative journal-animated-bg">
      {/* Particles Background */}
      <div className="absolute inset-0 w-full h-full z-0 ">
        <Particles particleCount={200} particleSpread={10} speed={0.12} alphaParticles={true} moveParticlesOnHover={true} className="!w-full !h-full" />
      </div>
  {/* Profile button top right */}
  <div className="absolute top-6 right-8 z-20 flex items-center gap-2">
        <div className="bg-white/10 px-3 py-1 rounded-full text-white text-sm font-medium flex items-center gap-2 shadow">
          <span className="font-semibold">{user.email}</span>
          <button
            onClick={onLogout}
            className="ml-2 px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>

  {/* Main Journal Input Card styled as a diary */}
  <div className="w-full max-w-2xl relative z-10 flex justify-center">
  <div className="relative w-full bg-[#23272e]/90 border-4 border-[#d1cdc6] rounded-[32px] shadow-2xl p-0 overflow-hidden diary-paper transition-transform duration-300 hover:scale-105">
      {/* Spiral binding effect */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between z-20 px-2 py-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-3 h-3 bg-[#bfae8e] rounded-full mb-4 shadow-inner border border-[#e0ddd5]" style={{marginBottom: i !== 7 ? '1.5rem' : 0}}></div>
        ))}
      </div>
      {/* SVG Feather Quill */}
      <div className="absolute top-8 right-10 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-[#bfae8e] opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-[#9d9890] text-center mb-2 tracking-tight drop-shadow pt-8 pb-2 font-serif">My Diary</h2>
      <div className="flex justify-center mb-4">
        <div className="h-1 w-24 bg-gradient-to-r from-yellow-400 via-orange-300 to-pink-300 rounded-full"></div>
      </div>
      <form onSubmit={handleSave} className="flex flex-col space-y-4 px-8 pb-8">
        <div className="relative">
          {/* Lined paper effect */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border-b border-dashed border-[#e0cfa9] opacity-60" style={{top: `${(i+1)*2.2}rem`, position: 'absolute', left: 0, right: 0}}></div>
            ))}
          </div>
          <textarea
            className="w-full h-40 p-6 pt-8 rounded-2xl bg-transparent text-[#e0cfa9] font-mono text-lg border-none focus:outline-none resize-none shadow-none placeholder-[#bfae8e] relative z-10 tracking-wide"
            style={{
              fontFamily: '"Indie Flower", "Comic Sans MS", cursive, sans-serif',
              lineHeight: '2.2rem',
              background: 'transparent',
              boxShadow: 'none',
              border: 'none',
            }}
            placeholder="Dear Diary, today I..."
            value={note}
            onChange={e => setNote(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="self-end bg-gradient-to-r from-yellow-400 to-pink-300 text-[#7c5e2a] px-8 py-2 rounded-xl font-bold shadow-lg transition-transform duration-200 hover:scale-105 hover:from-yellow-500 hover:to-pink-400 focus:outline-none focus:ring-2 focus:ring-yellow-300 font-serif"
          style={{ transition: 'transform 0.2s, background 0.3s' }}
        >
          Save Entry
        </button>
      </form>
    </div>
  </div>

  {/* List of Journal Entries */}
  <div className="w-full max-w-2xl space-y-6 z-10">
        {notes.length === 0 && (
          <div className="text-gray-400 text-center">No notes yet. Start writing your first diary entry!</div>
        )}
        {notes.map(n => (
          <div
            key={n.id}
            className="relative bg-[#23272e]/90 border-4 border-[#74726e] rounded-[28px] p-8 shadow-xl overflow-hidden transition-all duration-300 group hover:shadow-2xl hover:-translate-y-1 hover:bg-[#23272e]/95 transform rotate-[-1deg] hover:rotate-0 diary-paper"
            style={{ fontFamily: '"Indie Flower", "Comic Sans MS", cursive, sans-serif', lineHeight: '2.2rem' }}
          >
            {/* Lined paper effect for notes */}
            <div className="absolute inset-0 z-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border-b border-dashed border-[#7c5e2a] opacity-40" style={{top: `${(i+1)*2.2}rem`, position: 'absolute', left: 0, right: 0}}></div>
              ))}
            </div>
            {editId === n.id ? (
              <>
                <textarea
                  className="w-full h-24 p-3 rounded-xl bg-transparent text-[#e0cfa9] font-mono text-lg border-none focus:outline-none resize-none shadow-none placeholder-[#bfae8e] relative z-10 tracking-wide"
                  style={{
                    fontFamily: '"Indie Flower", "Comic Sans MS", cursive, sans-serif',
                    lineHeight: '2.2rem',
                    background: 'transparent',
                    boxShadow: 'none',
                    border: 'none',
                  }}
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => { setEditId(null); setEditText(''); }}
                    className="px-5 py-1.5 rounded-lg bg-gray-700/80 text-[#e0cfa9] hover:bg-gray-800/90 transition font-serif"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEdit(n.id)}
                    className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-yellow-400 to-pink-300 text-[#7c5e2a] font-bold hover:from-yellow-500 hover:to-pink-400 transition font-serif"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="whitespace-pre-wrap text-[#e0cfa9] text-lg mb-2 relative z-10">{n.text}</div>
                <div className="flex justify-between items-center text-xs text-[#bfae8e] mt-2 relative z-10 font-serif">
                  <span>
                    Last edited: {
                      n.updatedAt && typeof n.updatedAt.toDate === 'function'
                        ? n.updatedAt.toDate().toLocaleString()
                        : n.updatedAt && n.updatedAt.seconds
                          ? new Date(n.updatedAt.seconds * 1000).toLocaleString()
                          : 'Just now'
                    }
                  </span>
                  <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition">
                    <button
                      onClick={() => { setEditId(n.id); setEditText(n.text); }}
                      className="px-4 py-1 rounded-lg bg-yellow-400 text-[#7c5e2a] hover:bg-yellow-500 text-xs font-bold transition font-serif"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="px-4 py-1 rounded-lg bg-pink-300 text-[#7c5e2a] hover:bg-pink-400 text-xs font-bold transition font-serif"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Journal;