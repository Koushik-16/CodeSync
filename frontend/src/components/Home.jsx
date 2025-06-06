import React, { useState } from 'react';

const Home = () => {
  const [code, setCode] = useState('');

  const handleJoin = () => {
    
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-950 text-white px-4">
      {/* Welcome Section */}
      <section className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-400 mb-4">Welcome to CodeSync</h1>
        <p className="text-gray-400 text-lg">Real-time collaborative coding & interview platform</p>
      </section>

      {/* Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Card 1: Create Interview */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-blue-500/30 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Create New Interview</h2>
          <p className="text-gray-300 mb-6">Start a new live interview with real-time code collaboration.</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium w-full">
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
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full px-3 py-2 mb-4 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleJoin}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium w-full"
          >
            Join Interview
          </button>
        </div>

        {/* Card 3: Schedule Interview */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-blue-500/30 transition duration-300">
          <h2 className="text-xl font-semibold mb-4 text-blue-400">Schedule Interview</h2>
          <p className="text-gray-300 mb-6">Set a date and time to schedule interviews in advance.</p>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-white font-medium w-full">
            Schedule Interview
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
