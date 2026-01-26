import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginForm } from './components/LoginForm';
import { Dashboard } from './components/Dashboard';
import { PublicDashboard } from './components/PublicDashboard';

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  // Si la URL contiene /panel, mostrar vista pública sin login
  const isPublicView = window.location.pathname === '/panel' || 
                       window.location.search.includes('panel');
  
  if (isPublicView) {
    return <PublicDashboard />;
  }
  
  return isAuthenticated ? <Dashboard /> : <LoginForm />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
