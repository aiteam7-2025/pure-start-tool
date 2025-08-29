import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import SimpleGameRunner from './pages/SimpleGameRunner';
import NotFound from './pages/NotFound';

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* Main game route */}
        <Route path="/" element={<Layout />}>
          <Route index element={<SimpleGameRunner />} />
          <Route path="play" element={<SimpleGameRunner />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppRoutes />
    </ThemeProvider>
  );
}

export default App;
