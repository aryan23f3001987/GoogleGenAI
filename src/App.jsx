import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import LoginPage from './components/LoginPage';
import Journal from './components/Journal';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const userId = user ? user.uid : null;
  const handleLogout = () => signOut(auth);



  // Helper to get current page from location
  function CurrentPageWrapper() {
    const location = useLocation();
    let currentPage = location.pathname.replace('/', '') || 'journal';
    // Only show Navbar when logged in
    return user ? <Navbar currentPage={currentPage} user={user} /> : null;
  }

  return (
    <Router>
      <CurrentPageWrapper />
      <Routes>
        <Route path="/login" element={
          user ? <Navigate to="/journal" replace /> :
          <LoginPage
            auth={auth}
            db={db}
            user={user}
            userId={userId}
            onLogout={handleLogout}
          />
        } />
        <Route path="/journal" element={
          user ? <Journal user={user} db={db} onLogout={handleLogout} /> : <Navigate to="/login" replace />
        } />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/" element={<Navigate to={user ? "/journal" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
