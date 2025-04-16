import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ensoSvg from '../../assets/enso-circle.svg';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

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
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const backgroundImageStyle = {
    position: 'absolute',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: 'auto',
    opacity: 0.5,
    zIndex: 0,
    filter: 'brightness(0) invert(1)',
    pointerEvents: 'none'
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
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
  };

  const altActionStyle = {
    marginTop: '30px',
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '14px',
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    
    if (password.length < 6) {
      return setError('Le mot de passe doit contenir au moins 6 caractères');
    }

    try {
      setError('');
      setIsLoading(true);
      await signup(email, password);
      navigate('/');
    } catch (err) {
      setError('La création du compte a échoué: ' + (err.message || 'Veuillez réessayer'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={pageStyle} className="auth-container">
      {/* Background Enso Circle */}
      <img src={ensoSvg} alt="" style={backgroundImageStyle} />
      
      {/* Content layer */}
      <div style={contentStyle}>
        <h1 style={{ marginBottom: '40px', fontWeight: '300', letterSpacing: '1px' }}>KarmaCash</h1>
        
        <p style={{ marginBottom: '40px', fontSize: '16px', fontWeight: '300' }}>Commencez votre voyage vers la sérénité financière</p>
        
        {error && <div style={{ backgroundColor: 'rgba(220, 53, 69, 0.3)', padding: '8px 16px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
        
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
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Courriel"
              required
              style={inputStyle}
              autoComplete="email"
            />
          </div>
          
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
          
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
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmer le mot de passe"
              required
              style={inputStyle}
              autoComplete="new-password"
            />
          </div>
          
          <button 
            type="submit" 
            style={buttonStyle}
            disabled={isLoading}
          >
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>
        </form>
        
        <div style={altActionStyle}>
          Déjà un compte? <Link to="/login" style={linkStyle}>Se connecter</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;