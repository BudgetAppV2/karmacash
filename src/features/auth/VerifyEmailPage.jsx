// src/features/auth/VerifyEmailPage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { sendVerificationEmail, logoutUser } from '../../services/firebase/auth';
import logger from '../../services/logger';

const VerifyEmailPage = () => {
  const { user, isEmailVerified } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  // Check if the user is already verified and redirect if so
  useEffect(() => {
    if (isEmailVerified) {
      logger.info('VerifyEmailPage', 'checkVerification', 'User already verified, redirecting', {
        destination: from
      });
      navigate(from, { replace: true });
    }
  }, [isEmailVerified, navigate, from]);

  // Handle resend email verification
  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    try {
      setError('');
      setMessage('');
      setLoading(true);
      
      logger.debug('VerifyEmailPage', 'handleResendVerification', 'Sending verification email');
      
      await sendVerificationEmail();
      
      // Set a countdown for resend button (60 seconds)
      setCountdown(60);
      setMessage('Courriel de vérification envoyé! Veuillez vérifier votre boîte de réception.');
      
      logger.info('VerifyEmailPage', 'handleResendVerification', 'Verification email sent successfully');
    } catch (error) {
      logger.error('VerifyEmailPage', 'handleResendVerification', 'Failed to send verification email', {
        error: error.message,
        code: error.code
      });
      setError('Erreur lors de l\'envoi du courriel de vérification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh verification status
  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      
      // Reload the user to check if email has been verified
      await user.reload();
      
      if (user.emailVerified) {
        logger.info('VerifyEmailPage', 'handleCheckVerification', 'Email verified, redirecting');
        navigate(from, { replace: true });
      } else {
        setMessage('Courriel pas encore vérifié. Veuillez vérifier votre boîte de réception ou réessayer.');
      }
    } catch (error) {
      logger.error('VerifyEmailPage', 'handleCheckVerification', 'Failed to check verification status', {
        error: error.message,
        code: error.code
      });
      setError('Erreur lors de la vérification du statut. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutUser();
      navigate('/login');
    } catch (error) {
      setError('Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [countdown]);

  if (!user) return null;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-logo">
          <svg className="enso-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#919A7F" strokeWidth="3" strokeDasharray="0 12" />
            <path
              d="M 85 50 A 35 35 0 1 1 50 15"
              fill="none"
              stroke="#919A7F"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <h1>KarmaCash</h1>
        </div>
        
        <h2>Vérification du courriel</h2>
        
        <div className="verification-content">
          <p>
            Nous avons envoyé un courriel de vérification à <strong>{user.email}</strong>.
            Veuillez cliquer sur le lien dans le courriel pour vérifier votre compte.
          </p>
          
          {message && <div className="auth-message success">{message}</div>}
          {error && <div className="auth-message error">{error}</div>}
          
          <div className="verification-actions">
            <button 
              onClick={handleResendVerification} 
              className="btn btn-secondary"
              disabled={loading || countdown > 0}
            >
              {countdown > 0 
                ? `Renvoyer (${countdown}s)` 
                : 'Renvoyer le courriel de vérification'}
            </button>
            
            <button 
              onClick={handleCheckVerification} 
              className="btn btn-primary"
              disabled={loading}
            >
              J'ai vérifié mon courriel
            </button>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="btn btn-text"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;