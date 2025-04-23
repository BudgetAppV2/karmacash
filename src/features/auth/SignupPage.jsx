import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, updateUserProfile } from '../../services/firebase/auth';
import ensoSvg from '../../assets/enso-circle.svg';
import './auth.css';

const SignupPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== passwordConfirm) {
      return setError('Les mots de passe ne correspondent pas.');
    }
    
    setError('');
    setLoading(true);
    
    try {
      // Create the user account with the display name
      const userCredential = await registerUser(email, password, displayName.trim());
      
      // No need to update profile separately as registerUser now handles this
      navigate('/');
    } catch (err) {
      let errorMessage = 'Échec de la création du compte.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Ce courriel est déjà utilisé par un autre compte.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Format de courriel invalide.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
      }
      
      setError(errorMessage);
      console.error('Signup error:', err);
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
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nom d'utilisateur"
              className="auth-input"
            />
          </div>
          
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
            />
          </div>
          
          <div className="form-group">
            <input
              type="password"
              id="passwordConfirm"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              className="auth-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Inscription...' : 'S\'inscrire'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/login" className="auth-link">
            Déjà un compte? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;