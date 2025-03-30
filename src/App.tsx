import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme';
import MainLayout from './components/Layout/MainLayout';
import Home from './pages/Home';
import Temperature from './pages/Temperature';
import Maintenance from './pages/Maintenance';
import Migration from './pages/Migration';
import MonitoringSystem from './pages/MonitoringSystem';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/temperature" element={<Temperature />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/migration" element={<Migration />} />
            <Route path="/monitoring-system" element={<MonitoringSystem />} />
          </Routes>
        </MainLayout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
