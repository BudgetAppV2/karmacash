import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Layout
import MainLayout from '../components/navigation/MainLayout';

// Authentication Pages
import NewLoginPage from '../features/auth/NewLoginPage';
import SignupPage from '../features/auth/SignupPage';
import TestPage from '../features/auth/TestPage';
import PasswordResetPage from '../features/auth/PasswordResetPage';

// Feature Pages (placeholders for now)
import TransactionsPage from '../features/transactions/TransactionsPage';
import BudgetPage from '../features/budget/BudgetPage';
import CategoriesPage from '../features/categories/CategoriesPage';
import GraphsPage from '../features/graphs/GraphsPage';
import AddTransactionPage from '../features/transactions/AddTransactionPage';

// Import ProfilePage
import ProfilePage from '../features/auth/profile/ProfilePage';

// Import Demo Components
import InfoCardDemo from '../components/ui/InfoCardDemo';
import CategoryDisplayDemo from '../features/categories/CategoryDisplayDemo';
import ActionConfirmDemo from '../components/ui/ActionConfirmDemo';
import TestCategoryInit from '../components/TestCategoryInit';

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
      
      {/* Demo routes - for development/testing purposes */}
      <Route path="/demo/infocard" element={<InfoCardDemo />} />
      <Route path="/demo/categories" element={<CategoryDisplayDemo />} />
      <Route path="/demo/action-confirm" element={<ActionConfirmDemo />} />
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
        <Route path="graphs" element={<GraphsPage />} />
        <Route path="add" element={<AddTransactionPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;