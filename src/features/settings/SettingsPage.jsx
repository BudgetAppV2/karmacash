import React from 'react';
import { MigrationButton } from '../../services/firebase/migrationHelper.jsx';
import { useAuth } from '../../contexts/AuthContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="settings-page-container">
      <div className="settings-header">
        <h1>Paramètres</h1>
        <p>Configurez l'application selon vos préférences</p>
      </div>

      <div className="settings-section">
        <h2>Informations du compte</h2>
        <div className="account-info">
          <p><strong>Email:</strong> {currentUser?.email}</p>
          <p><strong>ID de compte:</strong> {currentUser?.uid}</p>
        </div>
      </div>

      <div className="settings-section">
        <h2>Maintenance</h2>
        <div className="maintenance-tools">
          <p className="section-description">
            Ces outils permettent de résoudre des problèmes spécifiques avec les données de l'application.
            À utiliser uniquement si vous rencontrez des problèmes ou sur recommandation du support.
          </p>
          
          <MigrationButton />
        </div>
      </div>

      <div className="settings-section">
        <h2>Préférences</h2>
        <p className="section-description">
          Les préférences seront disponibles dans une future mise à jour.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage; 