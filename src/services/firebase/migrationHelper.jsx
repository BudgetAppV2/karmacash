import React, { useState } from 'react';
import { migrateCategories } from './categories';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import logger from '../logger';

/**
 * Hook to provide migration utilities for the application
 * Can be used in administrative components or triggered manually
 * @returns {Object} Migration utilities
 */
export const useMigration = () => {
  const { currentUser } = useAuth();
  const { showSuccess, showError } = useToast();
  
  /**
   * Run category migration to fix missing order fields
   * @returns {Promise<Object>} Migration results
   */
  const runCategoryMigration = async () => {
    if (!currentUser) {
      showError('Vous devez être connecté pour effectuer cette opération');
      return { success: false, message: 'User not authenticated' };
    }
    
    try {
      logger.info('MigrationHelper', 'runCategoryMigration', 'Starting category migration', {
        userId: currentUser.uid
      });
      
      const result = await migrateCategories(currentUser.uid);
      
      if (result.success) {
        showSuccess(`Migration réussie : ${result.message}`);
        logger.info('MigrationHelper', 'runCategoryMigration', 'Migration successful', { 
          result 
        });
      } else {
        showError(`Échec de la migration : ${result.message}`);
        logger.error('MigrationHelper', 'runCategoryMigration', 'Migration failed', { 
          result 
        });
      }
      
      return result;
    } catch (error) {
      showError('Une erreur est survenue lors de la migration');
      logger.error('MigrationHelper', 'runCategoryMigration', 'Error during migration', {
        error: error.message,
        stack: error.stack
      });
      
      return {
        success: false,
        error: error.message,
        message: 'An error occurred during migration'
      };
    }
  };
  
  return {
    runCategoryMigration
  };
};

/**
 * Create a button component that runs the category migration when clicked
 * Can be added to an admin page or settings page
 */
export const MigrationButton = () => {
  const { runCategoryMigration } = useMigration();
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  
  const handleMigration = async () => {
    setIsRunning(true);
    setResult(null);
    
    try {
      const migrationResult = await runCategoryMigration();
      setResult(migrationResult);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="migration-tool">
      <h3>Outils de Maintenance</h3>
      <div className="migration-card">
        <h4>Migration des catégories</h4>
        <p>Cet outil ajoute un champ d'ordre à toutes les catégories qui n'en possèdent pas.</p>
        <button 
          onClick={handleMigration}
          disabled={isRunning}
          className="btn btn-primary"
        >
          {isRunning ? 'Migration en cours...' : 'Exécuter la migration'}
        </button>
        
        {result && (
          <div className={`migration-result ${result.success ? 'success' : 'error'}`}>
            <h5>{result.success ? 'Succès' : 'Échec'}</h5>
            <p>{result.message}</p>
            {result.success && (
              <div className="migration-stats">
                <p>Catégories totales : {result.total}</p>
                <p>Catégories mises à jour : {result.updated}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 