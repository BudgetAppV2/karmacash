import { BrowserRouter as Router } from 'react-router-dom';
import AppProviders from './AppProviders';
import AppRoutes from './AppRoutes';
import ErrorBoundary from '../components/ErrorBoundary';

// Add debug logs to trace initialization
console.log('App.jsx: Initial load');

function App() {
  console.log('App.jsx: Component rendering');
  
  return (
    <ErrorBoundary>
      <Router>
        <AppProviders>
          <AppRoutes />
        </AppProviders>
      </Router>
    </ErrorBoundary>
  );
}

export default App;