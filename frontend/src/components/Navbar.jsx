import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // If using React Router
import { useAuthContext } from '../context/AuthContext'; // Import your AuthContext

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { setAuthUser } = useAuthContext(); // Get setAuthUser from context
  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
     
      localStorage.removeItem('CodeSync_token');
      setAuthUser(null);
      //navigate('/login' , {replace : true}); // Redirect to login page after logout
    } catch (error) {
      console.log(error);
    }
    console.log('User logged out');
  };

  return (
    <nav className="bg-gray-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="text-2xl font-bold text-blue-500">CodeSync</div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-6 items-center">
          <Link to="/" className="hover:text-blue-400 transition">Home</Link>
          <Link to="/profile" className="hover:text-blue-400 transition">Profile</Link>
          <button
            onClick={handleLogout}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="focus:outline-none"
          >
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
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2">
          <Link to="/" className="block hover:text-blue-400 transition">Home</Link>
          <Link to="/profile" className="block hover:text-blue-400 transition">Profile</Link>
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
