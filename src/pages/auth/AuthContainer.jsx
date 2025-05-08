import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/enso-circleV2.svg'; // Use correct relative path
import FlipCard from '../../components/ui/FlipCard'; // Import FlipCard
import LoginForm from '../../components/auth/LoginForm'; // Import LoginForm
import SignupForm from '../../components/auth/SignupForm'; // Import SignupForm
import '../../styles/auth.css'; // Import styles

function AuthContainer({ initialView = 'login' }) {
  console.log("Applied further position adjustments");
  const [isFlipped, setIsFlipped] = useState(initialView === 'signup');
  const { currentUser, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && currentUser) {
      console.log('AuthContainer: User logged in, redirecting to / ');
      navigate('/', { replace: true });
    }
  }, [currentUser, isLoading, navigate]);

  const handleFlip = () => {
    console.log('Flip triggered! New state:', !isFlipped);
    setIsFlipped(!isFlipped);
  };

  if (isLoading) {
    // Use structured loading state with spinner
    return (
      <div className="auth-page auth-loading">
        <div className="auth-content">
          <h1 className="auth-title">KarmaCash</h1>
          <div className="auth-loading-spinner"></div>
          <p className="auth-tagline">Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (currentUser) {
    return null;
  }

  return (
    <div className="auth-page"> {/* Full page container with gradient */}
      {/* Background Logo */}
      <div className="auth-background-logo">
        <img src={logo} alt="Enso Background" /> 
      </div>
      
      {/* Centered Content Area */}
      <div className="auth-content">
        <h1 className="auth-title">KarmaCash</h1>
        <p className="auth-tagline">Retrouvez votre zen financier</p>
        
        <FlipCard 
          className="auth-flip-card-wrapper" // Add a wrapper class if needed for sizing/positioning
          isFlipped={isFlipped}
          frontContent={<LoginForm onFlip={handleFlip} />} 
          backContent={<SignupForm onFlip={handleFlip} />} 
        />
      </div>
    </div>
  );
}

export default AuthContainer; 