import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

// Test component
import TestConnection from '../TestConnection';
// Replace FirebaseTest with the test component we created
// import FirebaseTest from '../FirebaseTest';

// Layout
import MainLayout from '../components/navigation/MainLayout';

// Authentication Pages
import AuthContainer from '../pages/auth/AuthContainer';
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
  const { currentUser, isLoading } = useAuth();

  // Display a direct connection test at /test-connection
  // Create a blank protection for other routes
  return (
    <Routes>
      {/* Firebase Connection Test Route - No Auth Required */}
      <Route path="/test-connection" element={<TestConnection />} />
      
      {/* Original routes below */}
      <Route path="/firebase-test" element={<TestConnection />} />
      
      {/* Public Routes */}
      <Route 
        path="/auth/*" 
        element={
          !currentUser ? (
            <ToastProvider>
              <AuthContainer />
            </ToastProvider>
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
      
      <Route path="/password-reset" element={<PasswordResetPage />} />
      <Route path="/test-page" element={<TestPage />} />
      <Route path="/test-auth" element={<TestAuthComponent />} />
  
      {/* Protected Routes - Main application layout */}
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <ToastProvider>
              <MainLayout />
            </ToastProvider>
          </ProtectedRoute>
        }
      >
        {/* Nested routes that will render inside MainLayout's <Outlet /> */}
        <Route index element={<BudgetPage />} /> {/* Default for / */}
        <Route path="budget" element={<BudgetPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="graphs" element={<GraphsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="recurring" element={<RecurringRulesPage />} />
        {/* Demos - consider removing or placing under a /dev route */}
        <Route path="demo-info-card" element={<InfoCardDemo />} />
        <Route path="demo-category-display" element={<CategoryDisplayDemo />} />
        <Route path="demo-action-confirm" element={<ActionConfirmDemo />} />
        <Route path="test-category-init" element={<TestCategoryInit />} />
        <Route path="demo-toast" element={<ToastDemo />} />
        <Route path="demo-confirmation-dialog" element={<ConfirmationDialogDemo />} />
        {/* Fallback for any other protected path */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;