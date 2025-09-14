import React, { useEffect, useState } from 'react';
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
    <div className="min-h-screen w-full bg-[#181a1b] flex flex-col items-center pt-36 pb-12 px-2 relative">
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
      <div className="w-full max-w-2xl bg-white/10 border border-white border-opacity-20 rounded-3xl shadow-2xl backdrop-blur-md p-8 mb-10">
        <h2 className="text-3xl font-bold text-white text-center mb-2 tracking-tight drop-shadow">My Journal</h2>
        <div className="flex justify-center mb-6">
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full"></div>
        </div>
        <form onSubmit={handleSave} className="flex flex-col space-y-4">
          <textarea
            className="w-full h-32 p-4 rounded-xl bg-[#23272e]/80 text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner placeholder-gray-400"
            placeholder="Write your thoughts here..."
            value={note}
            onChange={e => setNote(e.target.value)}
            required
          />
          <button
            type="submit"
            className="self-end bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-2 rounded-xl font-semibold shadow-lg hover:scale-105 hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            Save Note
          </button>
        </form>
      </div>
      <div className="w-full max-w-2xl space-y-6">
        {notes.length === 0 && (
          <div className="text-gray-400 text-center">No notes yet. Start writing your first diary entry!</div>
        )}
        {notes.map(n => (
          <div
            key={n.id}
            className="bg-white/10 border border-white border-opacity-10 rounded-2xl p-6 shadow-xl backdrop-blur-md transition hover:shadow-2xl hover:bg-white/20 group"
          >
            {editId === n.id ? (
              <>
                <textarea
                  className="w-full h-24 p-3 rounded-xl bg-[#23272e]/80 text-white border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-inner"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                />
                <div className="flex gap-2 justify-end mt-2">
                  <button
                    onClick={() => { setEditId(null); setEditText(''); }}
                    className="px-5 py-1.5 rounded-lg bg-gray-600/80 text-white hover:bg-gray-700/90 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEdit(n.id)}
                    className="px-5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold hover:from-indigo-600 hover:to-purple-700 transition"
                  >
                    Save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="whitespace-pre-wrap text-white text-lg mb-2">{n.text}</div>
                <div className="flex justify-between items-center text-xs text-gray-300 mt-2">
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
                      className="px-4 py-1 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 text-xs font-semibold transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="px-4 py-1 rounded-lg bg-red-500 text-white hover:bg-red-600 text-xs font-semibold transition"
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