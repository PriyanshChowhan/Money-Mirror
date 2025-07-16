import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Blobs */}
      <div className="absolute w-96 h-96 bg-purple-500 rounded-full opacity-20 blur-3xl top-10 left-10 animate-pulse"></div>
      <div className="absolute w-72 h-72 bg-indigo-500 rounded-full opacity-20 blur-2xl bottom-10 right-10 animate-bounce"></div>

      {/* Content */}
      <div className="text-center relative z-10 px-6">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-2xl text-white/80 mb-6">Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block px-6 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-100 transition">
          Go back home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
