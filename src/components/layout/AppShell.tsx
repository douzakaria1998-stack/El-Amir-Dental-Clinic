import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  ReceiptLong as InvoiceIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from './LanguageSwitch';
import { useSettings } from '../../context/SettingsContext';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('nav.editor'), icon: <InvoiceIcon /> },
    { path: '/history', label: t('nav.history'), icon: <HistoryIcon /> },
    { path: '/settings', label: t('nav.settings'), icon: <SettingsIcon /> },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleNewInvoice = () => {
    navigate('/?new=1');
    setDrawerOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top App Bar (Material 3 style) */}
      <AppBar
        position="sticky"
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          zIndex: (th) => th.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ gap: 2, px: { xs: 2, md: 3 } }}>
          {isMobile && (
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} aria-label="menu">
              <MenuIcon />
            </IconButton>
          )}

          {/* Brand header */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', mr: { xs: 1, md: 3 } }}
            onClick={() => navigate('/')}
          >
            <img src="/emblem.svg" width={38} height={38} alt="El Amir Logo" style={{ display: 'block' }} />
            <Box>
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: (t) => t.typography.brand.fontFamily,
                  fontWeight: 700,
                  fontSize: '1.15rem',
                  lineHeight: 1.1,
                  color: 'primary.main',
                }}
              >
                {settings.clinicNameFr || 'El Amir'}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                }}
              >
                {t('app.title')}
              </Typography>
            </Box>
          </Box>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Button
                    key={item.path}
                    startIcon={item.icon}
                    variant={isActive ? 'tonal' : 'text'}
                    onClick={() => handleNav(item.path)}
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      px: 2,
                      color: isActive ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Box>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Language Switch */}
          <LanguageSwitch />

          {/* "New Invoice" Action Button */}
          <Tooltip title={t('nav.newInvoice')}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleNewInvoice}
              sx={{
                fontWeight: 600,
                display: { xs: 'none', sm: 'inline-flex' },
                boxShadow: 2,
              }}
            >
              {t('nav.newInvoice')}
            </Button>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 270, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, px: 1 }}>
            <img src="/emblem.svg" width={36} height={36} alt="El Amir Logo" style={{ display: 'block' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {settings.clinicNameFr || 'El Amir'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('app.title')}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <List>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.path}
                  selected={isActive}
                  onClick={() => handleNav(item.path)}
                  sx={{ borderRadius: 3, mb: 0.5 }}
                >
                  <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: isActive ? 700 : 500 }}>
                        {item.label}
                      </Typography>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Divider sx={{ my: 2 }} />
          <Button
            fullWidth
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleNewInvoice}
            sx={{ py: 1.2, borderRadius: 3 }}
          >
            {t('nav.newInvoice')}
          </Button>
        </Box>
      </Drawer>

      {/* Main Content Area */}
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 1.5, sm: 2.5, md: 3 } }}>
        {children}
      </Box>
    </Box>
  );
};
