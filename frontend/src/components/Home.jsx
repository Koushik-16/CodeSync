import React, { useState , useEffect } from 'react';
import { useSocket } from '../context/Socket.jsx';
import { useAuthContext } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState('');
  const { socket } = useSocket();

  const baseURL = import.meta.env.MODE === "development" ? 'http://localhost:5000/' : "/";


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);


  const handleCreateInterview = async () => {
    setError(''); // Clear previous error
    try {
      const response = await axios.post(
        `${baseURL}api/interview/sessions`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        const code = response.data.code;
        // socket.emit('joinSession', { code, authUser });
        navigate(`/interview/sessions/${code}`, { state: { isHost: true } });
      } else {
        setError('Failed to create interview session. Please try again.');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Something went wrong');
    }
  };

  const handleJoinInterview = async () => {
    setError(''); // Clear previous error
    try {
      const response = await axios.post(
        `${baseURL}api/interview/sessions/${sessionCode}`,
        { sessionCode },
        { withCredentials: true }
      );

      if (response.data.success) {
        // socket.emit('joinSession', { code: sessionCode, authUser });
        navigate(`/interview/sessions/${sessionCode}`, {
          state: { isHost: false },
        });
      } else {
        setError(response.data.error || 'Failed to join interview session.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    }
  };

  return (
    <>
    <div className="pt-20 min-h-screen bg-gray-950 text-white px-4">
      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="bg-red-600 text-white px-4 py-3 rounded shadow text-center font-semibold">
            {error}
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-400 mb-4">Welcome to CodeSync</h1>
        <p className="text-gray-400 text-lg">Real-time collaborative coding & interview platform</p>
      </section>

      {/* Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* Card 1: Create Interview */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-blue-500/30 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Create New Interview</h2>
          <p className="text-gray-300 mb-6">Start a new live interview with real-time code collaboration.</p>
          <button  onClick={handleCreateInterview} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium w-full">
            Create Interview
          </button>
        </div>

        {/* Card 2: Join Interview */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-blue-500/30 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Join Interview</h2>
          <p className="text-gray-300 mb-4">Enter the code shared by the interviewer to join a session.</p>
          <input
            type="text"
            placeholder="Enter Code"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value)}
            className="w-full px-3 py-2 mb-4 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoinInterview}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium w-full"
          >
            Join Interview
          </button>
        </div>

        {/* Card 3: Schedule Interview
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-blue-500/30 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Schedule Interview</h2>
          <p className="text-gray-300 mb-6">Set a date and time to schedule interviews in advance.</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium w-full">
            Schedule Interview
          </button>
        </div> */}
      </section>
    </div>
    
    </>
  );
};

export default Home;
