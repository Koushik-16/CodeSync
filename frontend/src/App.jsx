import React, { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import "./App.css";
import Navbar from './components/Navbar';
import { useAuthContext } from './context/AuthContext';

// Lazy load components for code splitting
const Login = lazy(() => import('./components/Login'));
const Signup = lazy(() => import('./components/Signup'));
const Home = lazy(() => import('./components/Home'));
const Interview = lazy(() => import('./components/Interview'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="text-white text-xl">Loading...</div>
  </div>
);

function App() {
  const auth = useAuthContext();
  const authUser = auth?.authUser;

  return (
    <div>
      <Navbar />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
          <Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
          <Route path='/signup' element={authUser ? <Navigate to='/' /> : <Signup />} />
          <Route path='/interview/sessions/:code' element={authUser ? <Interview /> : <Navigate to={"/login"} />} />
          <Route path='*' element={<Navigate to={"/login"} />} />
        </Routes>
      </Suspense>
    </div>
  );
}

export default App;
