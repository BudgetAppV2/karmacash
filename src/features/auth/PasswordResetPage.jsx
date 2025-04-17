// src/features/auth/PasswordResetPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './auth.css';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      console.log('Attempting password reset for:', email);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMessage('Vérifiez votre courriel pour les instructions de réinitialisation.');
    } catch (err) {
      setError('Échec de la réinitialisation du mot de passe.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="app-title">KarmaCash</h1>
        <p className="app-slogan">Retrouvez votre zen financier</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          {message && <div className="auth-message">{message}</div>}
          
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
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading}
          >
            {loading ? 'Traitement...' : 'Réinitialiser le mot de passe'}
          </button>
        </form>
        
        <div className="auth-links">
          <Link to="/login" className="auth-link">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;