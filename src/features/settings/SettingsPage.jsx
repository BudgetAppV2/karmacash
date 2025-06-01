import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  UserIcon, 
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';
import { MigrationButton } from '../../services/firebase/migrationHelper.jsx';
import { useAuth } from '../../contexts/AuthContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Animation variants for staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    }
  };

  return (
    <motion.div 
      className="settings-page-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="settings-header" variants={itemVariants}>
        <h1>Réglages</h1>
        <p>Configurez l'application selon vos préférences</p>
      </motion.div>

      {/* Quick Actions Section */}
      <motion.div className="settings-section" variants={itemVariants}>
        <h2>Actions rapides</h2>
        <div className="quick-actions">
          <Link to="/profile" className="settings-link">
            <UserIcon className="settings-icon" />
            <div className="settings-link-content">
              <span className="settings-link-title">Profil utilisateur</span>
              <span className="settings-link-description">Gérer vos informations personnelles</span>
            </div>
          </Link>
          
          <button onClick={handleLogout} className="settings-link settings-logout">
            <ArrowLeftOnRectangleIcon className="settings-icon" />
            <div className="settings-link-content">
              <span className="settings-link-title">Déconnexion</span>
              <span className="settings-link-description">Se déconnecter de l'application</span>
            </div>
          </button>
        </div>
      </motion.div>

      <motion.div className="settings-section" variants={itemVariants}>
        <h2>Informations du compte</h2>
        <div className="account-info">
          <p><strong>Email:</strong> {currentUser?.email}</p>
          <p><strong>ID de compte:</strong> {currentUser?.uid}</p>
        </div>
      </motion.div>

      <motion.div className="settings-section" variants={itemVariants}>
        <h2>Préférences</h2>
        <p className="section-description">
          Les préférences seront disponibles dans une future mise à jour.
        </p>
      </motion.div>

      <motion.div className="settings-section" variants={itemVariants}>
        <h2>Maintenance</h2>
        <div className="maintenance-tools">
          <p className="section-description">
            Ces outils permettent de résoudre des problèmes spécifiques avec les données de l'application.
            À utiliser uniquement si vous rencontrez des problèmes ou sur recommandation du support.
          </p>
          
          <MigrationButton />
        </div>
      </motion.div>
    </motion.div>
  );
};

export default SettingsPage; 