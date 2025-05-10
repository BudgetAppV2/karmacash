import { Outlet, Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { useBudgets } from '../../contexts/BudgetContext';
import AdminSeedDataTool from '../admin/AdminSeedDataTool';
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
  const [isCreating, setIsCreating] = useState(false);

  if (!currentUser) {
    return null; // This should be handled by ProtectedRoute, but just in case
  }

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newBudgetName.trim()) return; // Basic validation
    
    try {
      setIsCreating(true); // Show loading state
      await createBudgetAndUpdateContext({ 
        name: newBudgetName, 
        currency: newBudgetCurrency 
      });
      
      // Reset all form state
      setNewBudgetName('');
      setNewBudgetCurrency('CAD');
      setShowCreateForm(false);
      
      // Force a small delay to ensure state updates propagate
      setTimeout(() => {
        setIsCreating(false);
      }, 500);
    } catch (error) {
      console.error("Failed to create budget:", error);
      setIsCreating(false);
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
                  <label 
                    htmlFor="budgetName"
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: 'var(--font-medium)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    Nom du budget
                  </label>
                  <input
                    id="budgetName"
                    type="text"
                    placeholder="Ex: Budget familial, Budget personnel, etc."
                    value={newBudgetName}
                    onChange={(e) => setNewBudgetName(e.target.value)}
                    required
                    disabled={isCreating}
                    style={{ 
                      color: 'var(--text-primary)', 
                      backgroundColor: 'var(--surface)',
                      border: '1px solid rgba(136, 131, 122, 0.6)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      width: '100%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="budgetCurrency">Devise</label>
                  <select 
                    id="budgetCurrency"
                    value={newBudgetCurrency} 
                    onChange={(e) => setNewBudgetCurrency(e.target.value)}
                    disabled={isCreating}
                    style={{ 
                      color: 'var(--text-primary)', 
                      backgroundColor: 'var(--surface)',
                      border: '1px solid rgba(136, 131, 122, 0.6)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      width: '100%',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Création en cours...' : 'Créer Budget'}
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
          {import.meta.env.DEV && <AdminSeedDataTool />}
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