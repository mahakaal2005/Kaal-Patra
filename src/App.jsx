import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Header from './components/Layout/Header';
import Footer from './components/Layout/Footer';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import CommitmentsPage from './pages/CommitmentsPage';
import CommitmentDetailPage from './pages/CommitmentDetailPage';
import CommunityPage from './pages/CommunityPage';
import './App.css';

// Protected Route Component (Unit 3 - Functional Components)
// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth" />;
  }
  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
// eslint-disable-next-line react/prop-types
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  const { user } = useAuth();
  
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('kaalpatra_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('kaalpatra_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-container">
      {user && <Header theme={theme} toggleTheme={toggleTheme} />}
      
      <main className="main-content">
        <Routes>
          <Route 
            path="/auth" 
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/commitments" 
            element={
              <ProtectedRoute>
                <CommitmentsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/commitments/:id" 
            element={
              <ProtectedRoute>
                <CommitmentDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/community" 
            element={
              <ProtectedRoute>
                <CommunityPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>

      {user && <Footer />}
    </div>
  );
}

export default App;
