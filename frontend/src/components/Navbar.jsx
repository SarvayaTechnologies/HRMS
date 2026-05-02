import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-10 py-6 bg-transparent absolute top-0 w-full z-50">
      <div>
        <Link to="/">
          <img src="/logo.png" alt="HRValy" className="h-10 md:h-12 object-contain w-auto" />
        </Link>
      </div>
      <div className="flex gap-4">
        <Link to="/login" className="text-white font-medium px-6 py-2 border border-white/20 rounded-full hover:bg-white/10 transition">Sign In</Link>
        <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition">
          Sign Up
        </Link>
      </div>
    </nav>
  );
}