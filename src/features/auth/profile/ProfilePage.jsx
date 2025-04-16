// src/features/auth/profile/ProfilePage.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  updateUserProfile, 
  updateUserEmail, 
  updateUserPassword, 
  logoutUser,
  sendVerificationEmail
} from '../../../services/firebase/auth';
import { getUserSettings, updateUserSettings } from '../../../services/firebase/firestore';
import logger from '../../../services/logger';

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Profile State
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Settings State
  const [currency, setCurrency] = useState('CAD');
  const [balanceDisplayMode, setBalanceDisplayMode] = useState('cumulative');
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Load user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      
      // Fetch user settings from Firestore
      const fetchSettings = async () => {
        try {
          logger.debug('ProfilePage', 'fetchSettings', 'Loading user settings');
          const settings = await getUserSettings(user.uid);
          
          if (settings) {
            setCurrency(settings.currency || 'CAD');
            setBalanceDisplayMode(settings.balanceDisplayMode || 'cumulative');
            logger.debug('ProfilePage', 'fetchSettings', 'Settings loaded successfully');
          }
        } catch (error) {
          logger.error('ProfilePage', 'fetchSettings', 'Failed to load settings', {
            error: error.message
          });
          setSettingsError('Impossible de charger vos préférences.');
        }
      };
      
      fetchSettings();
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setProfileMessage('');
    setProfileError('');
    
    if (!displayName.trim()) {
      setProfileError('Le nom d\'affichage ne peut pas être vide.');
      return;
    }
    
    try {
      setLoading(true);
      
      logger.debug('ProfilePage', 'handleProfileUpdate', 'Updating user profile');
      
      await updateUserProfile({ displayName });
      
      setProfileMessage('Profil mis à jour avec succès!');
      logger.info('ProfilePage', 'handleProfileUpdate', 'Profile updated successfully');
    } catch (error) {
      logger.error('ProfilePage', 'handleProfileUpdate', 'Failed to update profile', {
        error: error.message,
        code: error.code
      });
      setProfileError('Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Handle email update
  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setEmailMessage('');
    setEmailError('');
    
    if (!email || !email.includes('@')) {
      setEmailError('Veuillez entrer une adresse courriel valide.');
      return;
    }
    
    try {
      setLoading(true);
      
      logger.debug('ProfilePage', 'handleEmailUpdate', 'Updating user email');
      
      await updateUserEmail(email);
      
      setEmailMessage('Courriel mis à jour. Veuillez vérifier votre boîte de réception pour confirmer.');
      logger.info('ProfilePage', 'handleEmailUpdate', 'Email updated successfully');
    } catch (error) {
      logger.error('ProfilePage', 'handleEmailUpdate', 'Failed to update email', {
        error: error.message,
        code: error.code
      });
      
      if (error.code === 'auth/requires-recent-login') {
        setEmailError('Veuillez vous reconnecter avant de modifier votre courriel.');
      } else {
        setEmailError('Erreur lors de la mise à jour du courriel. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setPasswordMessage('');
    setPasswordError('');
    
    // Validate password
    if (newPassword.length < 8) {
      setPasswordError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }
    
    try {
      setLoading(true);
      
      logger.debug('ProfilePage', 'handlePasswordUpdate', 'Updating user password');
      
      await updateUserPassword(newPassword);
      
      // Clear password fields on success
      setNewPassword('');
      setConfirmPassword('');
      
      setPasswordMessage('Mot de passe mis à jour avec succès!');
      logger.info('ProfilePage', 'handlePasswordUpdate', 'Password updated successfully');
    } catch (error) {
      logger.error('ProfilePage', 'handlePasswordUpdate', 'Failed to update password', {
        error: error.message,
        code: error.code
      });
      
      if (error.code === 'auth/requires-recent-login') {
        setPasswordError('Veuillez vous reconnecter avant de modifier votre mot de passe.');
      } else {
        setPasswordError('Erreur lors de la mise à jour du mot de passe. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle settings update
  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setSettingsMessage('');
    setSettingsError('');
    
    try {
      setLoading(true);
      
      logger.debug('ProfilePage', 'handleSettingsUpdate', 'Updating user settings');
      
      await updateUserSettings(user.uid, {
        currency,
        balanceDisplayMode
      });
      
      setSettingsMessage('Préférences mises à jour avec succès!');
      logger.info('ProfilePage', 'handleSettingsUpdate', 'Settings updated successfully');
    } catch (error) {
      logger.error('ProfilePage', 'handleSettingsUpdate', 'Failed to update settings', {
        error: error.message
      });
      setSettingsError('Erreur lors de la mise à jour des préférences. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      
      logger.debug('ProfilePage', 'handleLogout', 'User logging out');
      
      await logoutUser();
      navigate('/login');
    } catch (error) {
      logger.error('ProfilePage', 'handleLogout', 'Failed to logout', {
        error: error.message
      });
      // Keep error on profile tab as it's the default
      setProfileError('Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification email if needed
  const handleResendVerification = async () => {
    if (user.emailVerified) return;
    
    try {
      setLoading(true);
      
      logger.debug('ProfilePage', 'handleResendVerification', 'Sending verification email');
      
      await sendVerificationEmail();
      
      setEmailMessage('Courriel de vérification envoyé. Veuillez vérifier votre boîte de réception.');
      logger.info('ProfilePage', 'handleResendVerification', 'Verification email sent');
    } catch (error) {
      logger.error('ProfilePage', 'handleResendVerification', 'Failed to send verification email', {
        error: error.message
      });
      setEmailError('Erreur lors de l\'envoi du courriel de vérification. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Profil et préférences</h1>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('profile')}
        >
          Profil
        </button>
        <button 
          className={`tab-button ${activeTab === 'email' ? 'active' : ''}`} 
          onClick={() => setActiveTab('email')}
        >
          Courriel
        </button>
        <button 
          className={`tab-button ${activeTab === 'password' ? 'active' : ''}`} 
          onClick={() => setActiveTab('password')}
        >
          Mot de passe
        </button>
        <button 
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`} 
          onClick={() => setActiveTab('settings')}
        >
          Préférences
        </button>
      </div>

      <div className="profile-content">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="profile-section">
            <h2>Informations de profil</h2>
            
            {profileMessage && <div className="profile-message success">{profileMessage}</div>}
            {profileError && <div className="profile-message error">{profileError}</div>}
            
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label htmlFor="displayName">Nom d'affichage</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Votre nom d'affichage"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
              </button>
            </form>
            
            <button 
              onClick={handleLogout} 
              className="btn btn-secondary logout-button"
              disabled={loading}
            >
              Se déconnecter
            </button>
          </div>
        )}
        
        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="profile-section">
            <h2>Courriel</h2>
            
            {!user.emailVerified && (
              <div className="verification-alert">
                <p>Votre courriel n'est pas vérifié.</p>
                <button 
                  onClick={handleResendVerification} 
                  className="btn btn-text"
                  disabled={loading}
                >
                  Renvoyer le courriel de vérification
                </button>
              </div>
            )}
            
            {emailMessage && <div className="profile-message success">{emailMessage}</div>}
            {emailError && <div className="profile-message error">{emailError}</div>}
            
            <form onSubmit={handleEmailUpdate}>
              <div className="form-group">
                <label htmlFor="email">Adresse courriel</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@courriel.com"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le courriel'}
              </button>
            </form>
          </div>
        )}
        
        {/* Password Tab */}
        {activeTab === 'password' && (
          <div className="profile-section">
            <h2>Changer le mot de passe</h2>
            
            {passwordMessage && <div className="profile-message success">{passwordMessage}</div>}
            {passwordError && <div className="profile-message error">{passwordError}</div>}
            
            <form onSubmit={handlePasswordUpdate}>
              <div className="form-group">
                <label htmlFor="newPassword">Nouveau mot de passe</label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </form>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="profile-section">
            <h2>Préférences</h2>
            
            {settingsMessage && <div className="profile-message success">{settingsMessage}</div>}
            {settingsError && <div className="profile-message error">{settingsError}</div>}
            
            <form onSubmit={handleSettingsUpdate}>
              <div className="form-group">
                <label htmlFor="currency">Devise</label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="CAD">Dollar canadien (CAD)</option>
                  <option value="USD">Dollar américain (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="balanceDisplayMode">Affichage du solde</label>
                <select
                  id="balanceDisplayMode"
                  value={balanceDisplayMode}
                  onChange={(e) => setBalanceDisplayMode(e.target.value)}
                >
                  <option value="cumulative">Cumulatif (total général)</option>
                  <option value="period">Par période (mois/semaine courant)</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour les préférences'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;