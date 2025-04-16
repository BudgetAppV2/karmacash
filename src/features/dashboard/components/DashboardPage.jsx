// src/features/dashboard/DashboardPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserSettings } from '../../../services/firebase/firestore';
import { getTransactionsInRange } from '../../../services/firebase/transactions';
import { getBudget } from '../../../services/firebase/budgets';
import { getCategories } from '../../../services/firebase/categories';
import { formatCurrency } from '../../../utils/formatters';
import logger from '../../../services/logger';
import Header from '../../../components/layout/Header';
import FinancialSummaryCard from './FinancialSummaryCard';
import RecentTransactionsCard from './RecentTransactionsCard';
import BudgetSummaryCard from './BudgetSummaryCard';
import UpcomingExpensesCard from './UpcomingExpensesCard';

const DashboardPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userSettings, setUserSettings] = useState({
    currency: 'CAD',
    balanceDisplayMode: 'cumulative'
  });
  
  // Dashboard data state
  const [dashboardData, setDashboardData] = useState({
    currentBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    budgetProgress: 0,
    recentTransactions: [],
    upcomingExpenses: [],
    budgetCategories: []
  });

  // Fetch dashboard data (transactions, budget, categories)
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError('');
        
        logger.debug('DashboardPage', 'fetchDashboardData', 'Loading dashboard data');
        
        // 1. Get user settings
        const settings = await getUserSettings(currentUser.uid);
        setUserSettings(settings);
        
        // 2. Get current date info for queries
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Create date range for current month
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        
        // 3. Get transactions for current month
        const transactions = await getTransactionsInRange(
          currentUser.uid, 
          firstDayOfMonth, 
          lastDayOfMonth
        );
        
        // 4. Get budget for current month
        const currentMonthPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        const budget = await getBudget(currentUser.uid, currentMonthPeriod);
        
        // 5. Get categories
        const categories = await getCategories(currentUser.uid);
        
        // 6. Calculate dashboard metrics
        // Calculate financial summary
        let monthlyIncome = 0;
        let monthlyExpenses = 0;
        
        transactions.forEach(transaction => {
          if (transaction.amount > 0) {
            monthlyIncome += transaction.amount;
          } else {
            monthlyExpenses += Math.abs(transaction.amount);
          }
        });
        
        const currentBalance = monthlyIncome - monthlyExpenses;
        
        // Calculate budget progress
        let budgetProgress = 0;
        if (budget && budget.allocations) {
          const totalAllocated = Object.values(budget.allocations).reduce((sum, amount) => sum + amount, 0);
          const totalSpent = transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
            
          budgetProgress = totalAllocated > 0 ? Math.min(100, Math.round((totalSpent / totalAllocated) * 100)) : 0;
        }
        
        // Prepare budget categories with spending
        const categoryMap = categories.reduce((map, category) => {
          map[category.id] = category;
          return map;
        }, {});
        
        const categorySpending = {};
        
        // Initialize spending for each category
        categories.forEach(category => {
          categorySpending[category.id] = 0;
        });
        
        // Calculate spending per category
        transactions
          .filter(t => t.amount < 0 && t.categoryId)
          .forEach(transaction => {
            if (categorySpending[transaction.categoryId] !== undefined) {
              categorySpending[transaction.categoryId] += Math.abs(transaction.amount);
            }
          });
        
        // Create budget categories array with allocation and spending
        const budgetCategories = Object.entries(budget?.allocations || {})
          .map(([categoryId, allocated]) => ({
            id: categoryId,
            name: categoryMap[categoryId]?.name || 'Unknown',
            allocated: allocated || 0,
            spent: categorySpending[categoryId] || 0
          }))
          .filter(category => category.allocated > 0 || category.spent > 0);
        
        // Get recent transactions (last 5)
        const recentTransactions = [...transactions]
          .sort((a, b) => b.date - a.date)
          .slice(0, 5);
        
        // For upcoming expenses, filter recurring transactions or use placeholder
        // This would normally come from recurring expenses in a real implementation
        const upcomingExpenses = transactions
          .filter(t => t.amount < 0 && t.isRecurring)
          .slice(0, 3);
        
        // Update dashboard data
        setDashboardData({
          currentBalance,
          monthlyIncome,
          monthlyExpenses,
          budgetProgress,
          recentTransactions,
          upcomingExpenses,
          budgetCategories
        });
        
        logger.info('DashboardPage', 'fetchDashboardData', 'Dashboard data loaded successfully');
      } catch (error) {
        logger.error('DashboardPage', 'fetchDashboardData', 'Failed to load dashboard data', {
          error: error.message
        });
        setError('Impossible de charger les données du tableau de bord. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [currentUser]);

  // Function to refresh dashboard data
  const refreshDashboard = () => {
    logger.debug('DashboardPage', 'refreshDashboard', 'Refreshing dashboard data');
    // This will trigger the useEffect above to re-fetch all data
    setLoading(true);
    
    // Reset the loading state if the useEffect doesn't finish in a reasonable time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 10000);
    
    // The useEffect will clear this timeout if it completes normally
    return () => clearTimeout(timer);
  };

  // Get current month/year for display
  const currentMonthName = new Date().toLocaleString('fr-CA', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="dashboard-container">
      <Header 
        currentBalance={dashboardData.currentBalance} 
        currency={userSettings.currency} 
      />
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="dashboard-content">
        <div className="dashboard-welcome">
          <h2>Bonjour, {currentUser?.displayName || 'utilisateur'}</h2>
          <p>Voici votre aperçu financier pour le mois de {currentMonthName} {currentYear}</p>
        </div>
        
        <div className="dashboard-grid">
          {/* Financial Summary Card */}
          <FinancialSummaryCard 
            currentBalance={dashboardData.currentBalance}
            monthlyIncome={dashboardData.monthlyIncome}
            monthlyExpenses={dashboardData.monthlyExpenses}
            currency={userSettings.currency}
            loading={loading}
          />
          
          {/* Recent Transactions Card */}
          <RecentTransactionsCard 
            transactions={dashboardData.recentTransactions}
            currency={userSettings.currency}
            loading={loading}
          />
          
          {/* Budget Summary Card */}
          <BudgetSummaryCard 
            categories={dashboardData.budgetCategories}
            progress={dashboardData.budgetProgress}
            currency={userSettings.currency}
            loading={loading}
          />
          
          {/* Upcoming Expenses Card */}
          <UpcomingExpensesCard 
            expenses={dashboardData.upcomingExpenses}
            currency={userSettings.currency}
            loading={loading}
          />
        </div>
        
        <button 
          className="btn btn-icon refresh-button" 
          onClick={refreshDashboard}
          disabled={loading}
        >
          <span className="icon-refresh"></span>
          {loading ? 'Actualisation...' : 'Actualiser'}
        </button>
      </div>
    </div>
  );
};

export default DashboardPage;