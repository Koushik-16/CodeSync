import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setAuthUser(null); // Clear auth state
    localStorage.removeItem('authUser'); // If you're using localStorage
    navigate('/login' , {replace : true});
  };

  return (
    <nav className="bg-gray-900 text-white shadow-md fixed w-full z-50 top-0">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => navigate('/')}
          className="text-2xl font-bold text-blue-500 cursor-pointer"
        >
          CodeSync
        </div>

        {/* Desktop Links */}
        {authUser && (
          <div className="hidden md:flex space-x-6 items-center">
            <Link to="/" className="hover:text-blue-400 transition">Home</Link>
            {/* <Link to="/profile" className="hover:text-blue-400 transition">Profile</Link> */}
            <button
              onClick={handleLogout}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        )}

        {/* Mobile Hamburger */}
        {authUser && (
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2"
                viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Dropdown */}
      {authUser && isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link to="/" className="block hover:text-blue-400 transition">Home</Link>
          {/* <Link to="/profile" className="block hover:text-blue-400 transition">Profile</Link> */}
          <button
            onClick={handleLogout}
            className="block w-full text-left bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
