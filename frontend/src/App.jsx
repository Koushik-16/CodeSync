import React from 'react'
import Login from './components/Login'
import { Route, Routes , Navigate } from 'react-router-dom'
import Home from './components/Home'
import "./App.css"
import Navbar from './components/Navbar'
import { useAuthContext } from './context/AuthContext'
import Signup from './components/Signup'

function App() {
	const auth = useAuthContext();
  const authUser = auth?.authUser;
	return (
		<div>
		  <Navbar />
			<Routes>
				<Route path='/' element={authUser ? <Home /> : <Navigate to={"/login"} />} />
				<Route path='/login' element={authUser ? <Navigate to='/' /> : <Login />} />
				<Route path='/signup' element={authUser ? <Navigate to='/' /> : <Signup />} />
			</Routes>
		
		</div>
	);
}

export default App;
