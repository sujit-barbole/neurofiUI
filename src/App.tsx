import { Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage/LandingPage'
import Login from './pages/Login/Login'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

export default App
