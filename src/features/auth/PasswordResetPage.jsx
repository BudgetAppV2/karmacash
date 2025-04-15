// src/features/auth/PasswordResetPage.jsx

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { resetPassword } from '../../services/firebase/auth';
import logger from '../../services/logger';

const PasswordResetPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Styles to ensure proper styling and override any conflicting CSS
  const pageStyle = {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(to bottom, #8c9ca3, #8fa6a3, #a2b3b0)',
    color: 'white',
    padding: '1rem',
    textAlign: 'center'
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '320px',
  };

  const inputContainerStyle = {
    position: 'relative',
    marginBottom: '16px',
  };

  const inputStyle = {
    width: '100%',
    padding: '16px 16px 16px 48px',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    fontSize: '16px',
  };

  const iconStyle = {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'white',
    opacity: '0.7',
  };

  const buttonStyle = {
    width: '100%',
    padding: '16px',
    marginTop: '24px',
    background: 'rgba(255, 255, 255, 0.25)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '500',
  };

  const linkStyle = {
    color: 'rgba(255, 255, 255, 0.8)',
    textDecoration: 'none',
    fontSize: '14px',
    marginTop: '40px',
  };

  const successMessageStyle = {
    backgroundColor: 'rgba(86, 142, 141, 0.3)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  };

  const errorMessageStyle = {
    backgroundColor: 'rgba(220, 53, 69, 0.3)',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez entrer votre adresse courriel.');
      return;
    }
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      logger.debug('PasswordResetPage', 'handleSubmit', 'Submitting password reset request');
      
      await resetPassword(email);
      
      setMessage('Un courriel de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.');
      logger.info('PasswordResetPage', 'handleSubmit', 'Password reset email sent successfully');
    } catch (error) {
      logger.error('PasswordResetPage', 'handleSubmit', 'Failed to send reset email', {
        error: error.message,
        code: error.code
      });
      
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists or not for security
        setMessage('Si cette adresse courriel est associée à un compte, un courriel de réinitialisation a été envoyé.');
      } else {
        setError('Erreur lors de l\'envoi du courriel de réinitialisation. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle} className="auth-container">
      <h1 style={{ marginBottom: '40px', fontWeight: '300', letterSpacing: '1px' }}>KarmaCash</h1>
      
      <h2 style={{ marginBottom: '40px', fontSize: '18px', fontWeight: '300' }}>Réinitialisation du mot de passe</h2>
      
      {message && <div style={successMessageStyle}>{message}</div>}
      {error && <div style={errorMessageStyle}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={formStyle}>
        <div style={inputContainerStyle}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={iconStyle}
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Entrez votre courriel"
            required
            style={inputStyle}
            autoComplete="email"
          />
        </div>
        
        <button 
          type="submit" 
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? 'Traitement en cours...' : 'Réinitialiser le mot de passe'}
        </button>
      </form>
      
      <Link to="/login" style={linkStyle}>
        Retour à la connexion
      </Link>
    </div>
  );
};

export default PasswordResetPage;