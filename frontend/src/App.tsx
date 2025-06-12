import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Navigation from './components/Navigation';
import AppRouter from './components/AppRouter';
import { NotificationProvider } from './contexts/NotificationContext';
import { useMemoryMonitor } from './hooks/usePerformanceMonitor';
import { logger } from './utils/logger';
import DevLogViewer from './components/DevLogViewer';
import './App.css';

// Создание темы Material-UI
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 6,
        },
      },
    },
  },
});

function App() {
  // Мониторинг памяти в development режиме
  useMemoryMonitor();

  // Логируем запуск приложения
  React.useEffect(() => {
    logger.info('Application started', {
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }, 'Application');
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Router>
          <Navigation>
            <AppRouter />
          </Navigation>
        </Router>
        <DevLogViewer />
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
