import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/firebase/auth';
import ensoCircleSvg from '../../assets/enso-circle.svg';
import './auth.css';

// Creating a component with a different name to avoid caching issues
const NewLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await loginUser(email, password);
      navigate('/');
    } catch (err) {
      let errorMessage = 'Échec de la connexion. Veuillez vérifier vos informations.';
      
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Courriel ou mot de passe incorrect.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Format de courriel invalide.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives. Veuillez réessayer plus tard.';
      }
      
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f7f8fa',
  };

  const rightPanelStyle = {
    flex: '1',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    backgroundImage: `url(${ensoCircleSvg})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  return (
    <div className="auth-page" style={containerStyle}>
      {/* Background circle with inline styles to ensure it appears correctly */}
      <div 
        style={rightPanelStyle}
      />
      
      {/* Content container with inline styles to ensure no background */}
      <div className="auth-container-split">
        <div className="content-centered">
          <h1 className="app-title">KarmaCash</h1>
          <p className="app-slogan">Retrouvez votre zen financier</p>
          
          <form onSubmit={handleSubmit} className="auth-form" style={{ backgroundColor: 'transparent', width: '100%' }}>
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group" style={{ backgroundColor: 'transparent' }}>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Courriel"
                required
                className="auth-input"
              />
            </div>
            
            <div className="form-group" style={{ backgroundColor: 'transparent' }}>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mot de passe"
                required
                className="auth-input"
                autoComplete="current-password"
              />
            </div>
            
            <button 
              type="submit" 
              className="auth-button" 
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
          <div className="auth-links" style={{ backgroundColor: 'transparent', width: '100%', textAlign: 'center' }}>
            <Link to="/forgot-password" className="auth-link">
              Mot de passe oublié?
            </Link>
            
            <Link to="/signup" className="auth-link">
              Pas encore de compte? Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewLoginPage; 