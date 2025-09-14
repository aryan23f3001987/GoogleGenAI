import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiReact } from 'react-icons/si';
import { FiMenu } from 'react-icons/fi';

const Navbar = ({ currentPage, user }) => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed left-1/2 top-4 transform -translate-x-1/2 z-50 w-full max-w-2xl px-2 ">
      <div className="flex items-center justify-between gap-6 bg-black/80 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-3 shadow-lg">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-white font-semibold text-lg hover:scale-105 transition-transform">
          <SiReact className="w-6 h-6 text-cyan-400" />
          <span>My App</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-6 font-light text-base">
          <li>
            <Link
              to="/journal"
              className={`relative transition-colors duration-200 ${
                currentPage === 'journal'
                  ? 'text-white font-semibold'
                  : 'text-white/80 hover:text-white'
              } group`}
            >
              Journal
              <span className={`absolute left-0 -bottom-1 h-0.5 rounded bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-200 ${currentPage === 'journal' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>
          </li>
          <li>
            <Link
              to="/chatbot"
              className={`relative transition-colors duration-200 ${
                currentPage === 'chatbot'
                  ? 'text-white font-semibold'
                  : 'text-white/80 hover:text-white'
              } group`}
            >
              Chatbot
              <span className={`absolute left-0 -bottom-1 h-0.5 rounded bg-gradient-to-r from-cyan-400 to-fuchsia-500 transition-all duration-200 ${currentPage === 'chatbot' ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </Link>
          </li>
          {/* Removed login/profile route from Navbar */}
        </ul>

        {/* Visit Github Button */}
        <a
          href="https://github.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-block px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white font-medium transition hover:from-fuchsia-500 hover:to-cyan-400"
        >
          Visit Github
        </a>

        {/* Hamburger */}
        <button
          className="md:hidden text-white text-2xl"
          onClick={() => setOpen(!open)}
          aria-label="Open menu"
        >
          <FiMenu />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden mt-2 bg-black/90 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg px-6 py-4 flex flex-col gap-4 animate-fade-in">
          <Link
            to="/journal"
            className={`transition-colors duration-200 ${
              currentPage === 'journal'
                ? 'text-white font-semibold'
                : 'text-white/80 hover:text-white'
            }`}
            onClick={() => setOpen(false)}
          >
            Journal
          </Link>
          <Link
            to="/chatbot"
            className={`transition-colors duration-200 ${
              currentPage === 'chatbot'
                ? 'text-white font-semibold'
                : 'text-white/80 hover:text-white'
            }`}
            onClick={() => setOpen(false)}
          >
            Chatbot
          </Link>
          {/* Removed login/profile route from mobile menu */}
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 text-white font-medium transition hover:from-fuchsia-500 hover:to-cyan-400"
          >
            Visit Github
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
