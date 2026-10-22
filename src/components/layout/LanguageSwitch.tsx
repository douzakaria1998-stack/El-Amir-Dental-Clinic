import React from 'react';
import { ToggleButtonGroup, ToggleButton, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, type AppLang } from '../../i18n';

export const LanguageSwitch: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language?.slice(0, 2) as AppLang) || 'fr';

  const handleChange = (_: React.MouseEvent<HTMLElement>, newLang: AppLang | null) => {
    if (newLang && newLang !== currentLang) {
      setAppLanguage(newLang);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <ToggleButtonGroup
        value={currentLang}
        exclusive
        onChange={handleChange}
        size="small"
        aria-label="Application Language"
        sx={{
          height: 34,
          bgcolor: 'action.hover',
          borderRadius: 100,
          p: '2px',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <ToggleButton
          value="fr"
          aria-label="Français"
          sx={{
            px: 1.5,
            py: 0.5,
            border: 'none !important',
            borderRadius: '100px !important',
            fontWeight: 600,
            fontSize: '0.8125rem',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            FR
          </Typography>
        </ToggleButton>
        <ToggleButton
          value="en"
          aria-label="English"
          sx={{
            px: 1.5,
            py: 0.5,
            border: 'none !important',
            borderRadius: '100px !important',
            fontWeight: 600,
            fontSize: '0.8125rem',
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
            EN
          </Typography>
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};
