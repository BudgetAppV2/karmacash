import React, { useState } from 'react';
import PropTypes from 'prop-types';
import SocialAuthButton from '../ui/SocialAuthButton';
import { signUp } from '../../services/authService';
import '../../styles/auth.css'; // Ensure styles are available

/**
 * Signup form component.
 * @param {object} props - Component props.
 * @param {function} props.onFlip - Function to call to flip the card to login.
 */
function SignupForm({ onFlip }) {
  // Add state for form fields, error message, and loading
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }
    
    // Validate password strength
    if (password.length < 6) {
      setErrorMsg('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signUp(email, password);
      // Success - redirect will happen automatically via auth state change
    } catch (error) {
      // Handle specific error codes
      switch (error.code) {
        case 'auth/email-already-in-use':
          setErrorMsg('Cette adresse courriel est déjà utilisée.');
          break;
        case 'auth/invalid-email':
          setErrorMsg('Adresse courriel invalide.');
          break;
        case 'auth/operation-not-allowed':
          setErrorMsg('La création de compte est temporairement désactivée.');
          break;
        case 'auth/weak-password':
          setErrorMsg('Le mot de passe est trop faible.');
          break;
        default:
          setErrorMsg('Une erreur est survenue lors de la création du compte.');
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}> 
      {/* Optional: Add username if needed 
      <input 
        type="text"
        placeholder="Nom d'utilisateur"
        className="auth-input"
        required
      />
      */}
      <input 
        type="email"
        placeholder="Courriel"
        className="auth-input"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input 
        type="password"
        placeholder="Mot de passe"
        className="auth-input"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <input 
        type="password"
        placeholder="Confirmer le mot de passe"
        className="auth-input"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        required
      />

      {/* Error Message Display */}
      {errorMsg && <div className="auth-error">{errorMsg}</div>}

      {/* Social Auth Section (Temporarily removed as implementation not found) */}
      {/* <div className="social-auth-section">
         <SocialAuthButton 
           provider="Google" 
           onClick={handleGoogleSignIn}
           icon={<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 110-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0012.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z"/></svg>}
         />
         <SocialAuthButton 
           provider="Apple" 
           onClick={handleAppleSignIn}
           icon={<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M16.989 2c.09 2.301-1.607 4.5-3.911 4.454-1.746-.044-3.394-1.31-3.348-3.469C10.098.862 12.518 0 13.999 0c.077 1.972 1.311 2.88 2.99 2zm.959 5.432c-1.593-.173-2.926.456-3.831.456-.905 0-2.509-.613-3.735-.613C7.276 7.275 4 9.591 4 14.364c0 4.941 3.793 10.51 6.823 10.51 1.289-.002 2.638-.953 3.853-.953 1.198 0 2.359.953 3.927.953 2.906 0 6.397-5.064 6.397-9.14-.03-.196-3.853-1.591-3.853-5.945 0-4.451 3.86-5.235 3.83-5.32-.266-1.12-2.668-3.033-5.022-3.037"/></svg>}
         />
       </div>
       <div className="social-auth-separator">ou</div> */}
      {/* End Social Auth Section */}

      <button 
        type="submit" 
        className="auth-button"
        disabled={isLoading}
      >
        {isLoading ? 'Inscription...' : 'S\'inscrire'}
      </button>
      <div className="auth-links">
        <div className="auth-account-text">
          <span>Déjà un compte?</span>
          <a className="auth-link" onClick={onFlip}>
            Se connecter
          </a>
        </div>
      </div>
    </form>
  );
}

SignupForm.propTypes = {
  onFlip: PropTypes.func.isRequired,
};

export default SignupForm; 