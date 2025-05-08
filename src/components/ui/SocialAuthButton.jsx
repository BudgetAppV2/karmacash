import React from 'react';

const SocialAuthButton = ({ provider, onClick, icon }) => {
  return (
    <button
      className={`social-auth-button social-auth-${provider.toLowerCase()}`}
      onClick={onClick}
      aria-label={`Sign in with ${provider}`}
    >
      {icon}
      <span>Continuer avec {provider}</span>
    </button>
  );
};

export default SocialAuthButton; 