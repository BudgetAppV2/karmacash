import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/firebase/auth';
import ensoSvg from '../../assets/enso-circle.svg';
import './auth.css';

const LoginPage = () => {
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

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="logo-container">
          <img src={ensoSvg} alt="KarmaCash Logo" className="enso-logo" />
        </div>
        <h1 className="app-title">KarmaCash</h1>
        <p className="app-slogan">Retrouvez votre zen financier</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
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
          
          <div className="form-group">
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
        
        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">
            Mot de passe oublié?
          </Link>
          
          <Link to="/signup" className="auth-link">
            Pas encore de compte? Créer un compte
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 