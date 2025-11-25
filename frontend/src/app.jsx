import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from './pages/HomePage'
import UploadPage from './pages/UploadPage'
import ResultsPage from './pages/ResultsPage'
import ResultDetailsPage from './pages/ResultDetailsPage'
import SimulatorPage from './pages/SimulatorPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-dark-text">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<UploadPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/results/:id" element={<ResultDetailsPage />} />
          <Route path="/simulator" element={<SimulatorPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App