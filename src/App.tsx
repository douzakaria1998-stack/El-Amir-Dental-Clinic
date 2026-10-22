import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { theme } from './theme/m3Theme';
import { SettingsProvider } from './context/SettingsContext';
import { SnackbarProvider } from './context/SnackbarContext';
import { AppShell } from './components/layout/AppShell';
import { EditorPage } from './pages/EditorPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SettingsProvider>
          <SnackbarProvider>
            <BrowserRouter>
              <AppShell>
                <Routes>
                  <Route path="/" element={<EditorPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </AppShell>
            </BrowserRouter>
          </SnackbarProvider>
        </SettingsProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};

export default App;
