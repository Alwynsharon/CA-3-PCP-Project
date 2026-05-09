import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="nav">
      <div>
        <Link to="/"><strong>DACMS</strong></Link>
      </div>
      <div className="right">
        {user ? (
          <>
            <span>{user.name} <span className={`badge ${user.role.toLowerCase()}`}>{user.role}</span></span>
            <button className="btn ghost" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
