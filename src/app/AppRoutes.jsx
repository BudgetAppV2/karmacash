import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

// Layout
import MainLayout from '../components/navigation/MainLayout';

// Authentication Pages
import NewLoginPage from '../features/auth/NewLoginPage';
import SignupPage from '../features/auth/SignupPage';
import TestPage from '../features/auth/TestPage';
import PasswordResetPage from '../features/auth/PasswordResetPage';
import TestAuthComponent from '../features/auth/TestAuthComponent';

// Feature Pages (placeholders for now)
import TransactionsPage from '../features/transactions/TransactionsPage';
import BudgetPage from '../features/budget/BudgetPage';
import CategoriesPage from '../features/categories/CategoriesPage';
import GraphsPage from '../features/graphs/GraphsPage';
import AddTransactionPage from '../features/transactions/AddTransactionPage';
import SettingsPage from '../features/settings/SettingsPage';

// Import ProfilePage
import ProfilePage from '../features/auth/profile/ProfilePage';

// Import Demo Components
import InfoCardDemo from '../components/ui/InfoCardDemo';
import CategoryDisplayDemo from '../features/categories/CategoryDisplayDemo';
import ActionConfirmDemo from '../components/ui/ActionConfirmDemo';
import TestCategoryInit from '../components/TestCategoryInit';
// Re-enable toast demo with improved implementation
import ToastDemo from '../components/ui/ToastDemo';
import ConfirmationDialogDemo from '../components/ui/ConfirmationDialogDemo';

// Import RecurringRulesPage
import RecurringRulesPage from '../features/recurring/RecurringRulesPage';

// Protected Route wrapper
function ProtectedRoute({ children }) {
  const { currentUser, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Chargement...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<NewLoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/test" element={<TestPage />} />
      <Route path="/forgot-password" element={<PasswordResetPage />} />
      <Route path="/test-auth" element={<TestAuthComponent />} />
      
      {/* Demo routes - for development/testing purposes */}
      <Route path="/demo/infocard" element={<InfoCardDemo />} />
      <Route path="/demo/categories" element={<CategoryDisplayDemo />} />
      <Route path="/demo/action-confirm" element={<ActionConfirmDemo />} />
      <Route path="/demo/confirmation-dialog" element={<ConfirmationDialogDemo />} />
      {/* Use ToastProvider directly to allow access without authentication */}
      <Route path="/demo/toast" element={
        <ToastProvider>
          <ToastDemo />
        </ToastProvider>
      } />
      <Route path="/test-categories" element={<TestCategoryInit />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<TransactionsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="budget" element={<BudgetPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="recurring" element={<RecurringRulesPage />} />
        <Route path="graphs" element={<GraphsPage />} />
        <Route path="add" element={<AddTransactionPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;