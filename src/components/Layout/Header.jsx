import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PropTypes from 'prop-types';
import './Header.css';

const Header = ({ theme, toggleTheme }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <header className="site-header">
      <div className="header-brand">
        <Link to="/">
          <span className="brand-devanagari">कालपत्र</span>
          <span className="brand-english">KaalPatra</span>
        </Link>
      </div>

      <nav className="header-nav">
        <Link to="/" className="nav-link">Dashboard</Link>
        <Link to="/commitments" className="nav-link">Commitments</Link>
        <Link to="/community" className="nav-link">Community</Link>
        <Link to="/history" className="nav-link">Memory</Link>
      </nav>

      <div className="header-user">
        <button onClick={toggleTheme} className="btn-theme-toggle" aria-label="Toggle Theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="user-email">{user?.email}</span>
        <button onClick={handleLogout} className="btn-logout">Sign Out</button>
      </div>
    </header>
  );
};

Header.propTypes = {
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
};

export default Header;
