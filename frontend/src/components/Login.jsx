import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setAuthUser } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);

  const baseURL = import.meta.env.MODE === "development" ? 'http://localhost:5000/' : "/";

  // console.log(baseURL);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${baseURL}api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await res.json();
      //console.log(data);
      if (data.error) {
        throw new Error(data.error);
      }
      
      if(data?._id) {
        localStorage.setItem("CodeSync_token", JSON.stringify(data));
        setAuthUser(data);
        navigate('/');
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 text-white rounded-2xl p-8 shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center">Welcome Back</h2>

        {/* Error Message */}
        {error && (
          <div className="mb-4">
            <div className="bg-red-600 text-white px-4 py-3 rounded shadow text-center font-semibold">
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm mb-1" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="password">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="w-full px-4 py-2 rounded-lg bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-sm text-gray-400 hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-white transition"
          >
            Log In
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-400">
          Don't have an account? <span className="text-blue-500 hover:underline cursor-pointer"> <Link to={'/signup'}>Sign up </Link></span>
        </p>
      </div>
    </div>
  );
}
