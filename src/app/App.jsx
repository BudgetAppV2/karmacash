import { BrowserRouter as Router } from 'react-router-dom';
import AppProviders from './AppProviders';
import AppRoutes from './AppRoutes';

function App() {
  return (
    <Router>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </Router>
  );
}

export default App;