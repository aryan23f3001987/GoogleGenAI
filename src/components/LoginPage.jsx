import React, { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { FcGoogle } from 'react-icons/fc';
import Galaxy from './Galaxy';

const LoginPage = ({ onNavigate, auth, db, user, userId, onLogout }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Clear state on form type change
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [isRegistering, isForgotPassword]);

  const handleAuthAction = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userDocRef = doc(db, `users/${userCredential.user.uid}/profile`);
        await setDoc(userDocRef, { name, email, created: new Date() });
        setSuccess('Registration successful! You are now logged in.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setSuccess('Login successful!');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccess('');
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setSuccess('Signed in with Google successfully!');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    setError('');
    setSuccess('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent! Check your inbox.');
      setIsForgotPassword(false);
      setEmail('');
    } catch (err) {
      setError(err.message);
    }
  };

  // --- Main Render ---
  return (
    <div className="relative min-h-screen w-full overflow-hidden" style={{ background: 'black' }}>
      {/* Galaxy as background */}
      <div className="absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={240}
        />
      </div>
      {/* Centered Login Container */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md bg-transparent border border-white border-opacity-60 p-8 rounded-2xl shadow-2xl backdrop-blur-md space-y-6">
          {user ? (
            <>
              <svg className="text-indigo-500 w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              <h1 className="text-3xl font-bold text-white text-center">Welcome!</h1>
              <p className="text-gray-200 text-center">You are logged in as:</p>
              <p className="text-indigo-300 font-mono break-words text-sm text-center">{user.email}</p>
              <div className="w-full text-left text-sm text-gray-300">
                <p className="font-semibold">Your User ID:</p>
                <p className="font-mono break-all mt-1">{userId}</p>
              </div>
              <button
                onClick={onLogout}
                className="w-full bg-red-500 text-white font-semibold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-center text-white">
                {isRegistering ? 'Create Account' : (isForgotPassword ? 'Reset Password' : 'Welcome Back')}
              </h1>
              {error && <p className="bg-red-100 bg-opacity-80 text-red-700 p-3 rounded-lg text-sm text-center">{error}</p>}
              {success && <p className="bg-green-100 bg-opacity-80 text-green-700 p-3 rounded-lg text-sm text-center">{success}</p>}

              <form onSubmit={handleAuthAction} className="space-y-4">
                {isRegistering && (
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Name"
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white bg-opacity-70 text-black"
                      required
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white bg-opacity-70 text-black"
                    required
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                {!isForgotPassword && (
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white bg-opacity-70 text-black"
                      required
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2h2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2h2zm2-2a3 3 0 116 0v2H7V7zm6 3a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm text-gray-200">
                  {!isForgotPassword && (
                    <label className="flex items-center cursor-pointer">
                      <input type="checkbox" className="form-checkbox text-indigo-600 rounded-sm" />
                      <span className="ml-2">Remember me</span>
                    </label>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(!isForgotPassword)}
                    className="text-indigo-300 hover:underline"
                  >
                    {isForgotPassword ? 'Back to Login' : 'Forgot your password?'}
                  </button>
                </div>

                {isForgotPassword ? (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    Send Reset Email
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {isRegistering ? 'Register' : 'Login'}
                  </button>
                )}
              </form>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-300 text-sm">Or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="w-full bg-white bg-opacity-80 border border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <FcGoogle className="w-5 h-5" />
                <span>Login with Google</span>
              </button>

              <div className="text-center text-sm text-gray-200 mt-4">
                <p>
                  {isRegistering ? (
                    <>Already have an account?{' '}
                      <button
                        onClick={() => setIsRegistering(false)}
                        className="text-indigo-300 hover:underline font-semibold"
                      >
                        Login
                      </button>
                    </>
                  ) : (
                    <>Don't have an account?{' '}
                      <button
                        onClick={() => setIsRegistering(true)}
                        className="text-indigo-300 hover:underline font-semibold"
                      >
                        Register
                      </button>
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
