import { Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { useBudgets } from '../../contexts/BudgetContext';
import TestDataGenerator from '../TestDataGenerator';
import ensoCircleSvg from '../../assets/enso-circle.svg';

function MainLayout() {
  const { currentUser } = useAuth();
  const { 
    userBudgets, 
    selectedBudgetId, 
    isLoadingBudgets, 
    selectBudget, 
    createBudgetAndUpdateContext 
  } = useBudgets();
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBudgetName, setNewBudgetName] = useState('');
  const [newBudgetCurrency, setNewBudgetCurrency] = useState('CAD');

  if (!currentUser) {
    return null; // This should be handled by ProtectedRoute, but just in case
  }

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newBudgetName.trim()) return; // Basic validation
    
    try {
      await createBudgetAndUpdateContext({ 
        name: newBudgetName, 
        currency: newBudgetCurrency 
      });
      setShowCreateForm(false); // Close form on success
      setNewBudgetName(''); // Reset form
    } catch (error) {
      console.error("Failed to create budget:", error);
      // TODO: Add error feedback to user
    }
  };

  // Budget loading state
  if (isLoadingBudgets) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="app-header__content">
            <div className="app-header__logo-title">
              <img src={ensoCircleSvg} alt="KarmaCash Logo" className="app-header__logo" />
              <h1 className="app-header__title">KarmaCash</h1>
            </div>
          </div>
        </header>
        <main className="app-main">
          <div className="loading-container">
            <p>Chargement des budgets...</p>
          </div>
        </main>
      </div>
    );
  }

  // No budgets state - show creation prompt
  if (!isLoadingBudgets && userBudgets.length === 0) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="app-header__content">
            <div className="app-header__logo-title">
              <img src={ensoCircleSvg} alt="KarmaCash Logo" className="app-header__logo" />
              <h1 className="app-header__title">KarmaCash</h1>
            </div>
          </div>
        </header>
        <main className="app-main">
          <div className="welcome-container">
            <h2>Bienvenue à KarmaCash!</h2>
            <p>Créez votre premier budget pour commencer.</p>
            
            {showCreateForm ? (
              <form onSubmit={handleCreateBudget} className="budget-form">
                <div className="form-group">
                  <label htmlFor="budgetName">Nom du budget</label>
                  <input
                    id="budgetName"
                    type="text"
                    placeholder="Ex: Budget Personnel"
                    value={newBudgetName}
                    onChange={(e) => setNewBudgetName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="budgetCurrency">Devise</label>
                  <select 
                    id="budgetCurrency"
                    value={newBudgetCurrency} 
                    onChange={(e) => setNewBudgetCurrency(e.target.value)}
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={() => setShowCreateForm(false)}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary">
                    Créer Budget
                  </button>
                </div>
              </form>
            ) : (
              <button 
                className="btn-primary create-budget-btn" 
                onClick={() => setShowCreateForm(true)}
              >
                Créer un Budget
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // If no budget is selected but budgets exist (unlikely due to auto-select in context)
  if (!selectedBudgetId && userBudgets.length > 0) {
    return (
      <div className="app-container">
        <header className="app-header">
          <div className="app-header__content">
            <div className="app-header__logo-title">
              <img src={ensoCircleSvg} alt="KarmaCash Logo" className="app-header__logo" />
              <h1 className="app-header__title">KarmaCash</h1>
            </div>
          </div>
        </header>
        <main className="app-main">
          <div className="loading-container">
            <p>Sélection du budget en cours...</p>
          </div>
        </main>
      </div>
    );
  }

  // Normal app UI with budgets and selected budget
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header__content">
          <div className="app-header__logo-title">
            <img src={ensoCircleSvg} alt="KarmaCash Logo" className="app-header__logo" />
            <h1 className="app-header__title">KarmaCash</h1>
          </div>
          
          <div className="app-header__balance-container">
            {/* Optional Budget Selector if multiple budgets */}
            {userBudgets.length > 1 && (
              <select 
                className="budget-selector"
                value={selectedBudgetId} 
                onChange={(e) => selectBudget(e.target.value)}
              >
                {userBudgets.map(budget => (
                  <option key={budget.id} value={budget.id}>
                    {budget.budgetName}
                  </option>
                ))}
              </select>
            )}
            
            <div className="app-header__balance-wrapper">
              <div className="app-header__balance-label">Solde</div>
              <div className="app-header__balance app-header__balance--positive">3,245.65 $</div>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <ToastProvider>
          <Outlet />
          <TestDataGenerator />
        </ToastProvider>
      </main>
      
      <nav className="app-nav">
        <Link to="/transactions" className="app-nav__link">Transactions</Link>
        <Link to="/budget" className="app-nav__link">Budget</Link>
        <Link to="/categories" className="app-nav__link">Catégories</Link>
        <Link to="/recurring" className="app-nav__link">Récurrences</Link>
        <Link to="/graphs" className="app-nav__link">Graphiques</Link>
        <Link to="/profile" className="app-nav__link">Profil</Link>
        <Link to="/settings" className="app-nav__link">Paramètres</Link>
      </nav>
    </div>
  );
}

export default MainLayout;