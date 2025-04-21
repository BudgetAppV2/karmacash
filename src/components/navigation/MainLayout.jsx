import { Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import ensoCircleSvg from '../../assets/enso-circle.svg';

function MainLayout() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return null; // This should be handled by ProtectedRoute, but just in case
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="app-header__content">
          <div className="app-header__logo-title">
            <img src={ensoCircleSvg} alt="KarmaCash Logo" className="app-header__logo" />
            <h1 className="app-header__title">KarmaCash</h1>
          </div>
          
          <div className="app-header__balance-container">
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
        </ToastProvider>
      </main>
      
      <nav className="app-nav">
        {/* Navigation will go here */}
      </nav>
    </div>
  );
}

export default MainLayout;