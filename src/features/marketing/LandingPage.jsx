import React from 'react';
import { Link } from 'react-router-dom';
import ensoSvg from '../../assets/enso-circle.svg';

const LandingPage = () => {
  const pageStyle = {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem',
    background: 'linear-gradient(135deg, var(--primary-sage) 0%, #6B7359 100%)',
    color: 'white',
    textAlign: 'center',
    overflow: 'hidden',
  };

  const contentStyle = {
    position: 'relative',
    zIndex: 1,
    maxWidth: '800px',
  };

  const backgroundImageStyle = {
    position: 'absolute',
    width: '130%',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: 0.1,
    zIndex: 0,
  };

  const headingStyle = {
    fontSize: '3rem',
    marginBottom: '1.5rem',
    fontWeight: '300',
    fontFamily: 'var(--font-heading)',
  };

  const subheadingStyle = {
    fontSize: '1.5rem',
    marginBottom: '3rem',
    fontWeight: '300',
    maxWidth: '600px',
    margin: '0 auto 3rem auto',
    lineHeight: '1.6',
  };

  const buttonStyle = {
    display: 'inline-block',
    padding: '1rem 2rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '1.25rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    margin: '0 1rem 1rem',
    border: '2px solid rgba(255, 255, 255, 0.3)',
  };

  const featuresStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '2rem',
    marginTop: '4rem',
  };

  const featureStyle = {
    flex: '1 1 250px',
    maxWidth: '300px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '1.5rem',
    borderRadius: '8px',
    textAlign: 'center',
  };

  return (
    <div style={pageStyle}>
      <img src={ensoSvg} alt="Enso circle" style={backgroundImageStyle} />
      
      <div style={contentStyle}>
        <h1 style={headingStyle}>KarmaCash</h1>
        <h2 style={subheadingStyle}>Retrouvez votre zen financier</h2>
        
        <div>
          <Link to="/login" style={buttonStyle}>Se connecter</Link>
          <Link to="/signup" style={{...buttonStyle, backgroundColor: 'rgba(255, 255, 255, 0.3)'}}>S'inscrire</Link>
        </div>
        
        <div style={featuresStyle}>
          <div style={featureStyle}>
            <h3 style={{marginBottom: '1rem', fontSize: '1.25rem'}}>Suivi Simplifié</h3>
            <p>Suivez vos revenus et dépenses en toute simplicité avec une interface zen et intuitive.</p>
          </div>
          
          <div style={featureStyle}>
            <h3 style={{marginBottom: '1rem', fontSize: '1.25rem'}}>Budgets Intelligents</h3>
            <p>Créez des budgets qui s'adaptent à votre style de vie et atteignez vos objectifs financiers.</p>
          </div>
          
          <div style={featureStyle}>
            <h3 style={{marginBottom: '1rem', fontSize: '1.25rem'}}>Visualisation Claire</h3>
            <p>Comprenez vos habitudes financières grâce à des graphiques et analyses accessibles.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 