import {
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  Box,
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { InvoiceDocument } from '../invoice/InvoiceDocument';
import type { Invoice } from '../../types/invoice';
import type { ClinicSettings } from '../../types/settings';
import { printDirect } from '../../services/printService';

interface FullScreenPreviewProps {
  open: boolean;
  onClose: () => void;
  invoice: Invoice;
  settings: ClinicSettings;
  qrDataUrl: string;
}

export const FullScreenPreview: React.FC<FullScreenPreviewProps> = ({
  open,
  onClose,
  invoice,
  settings,
  qrDataUrl,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <AppBar sx={{ position: 'relative' }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1, fontWeight: 600 }} variant="h6" component="div">
            {t('fullPreview.title')}
          </Typography>
          <Typography variant="body2" sx={{ mr: 3, display: { xs: 'none', md: 'block' }, opacity: 0.85 }}>
            {t('fullPreview.printHint')}
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PrintIcon />}
            onClick={() => printDirect()}
            sx={{ fontWeight: 600 }}
          >
            {t('fullPreview.browserPrint')}
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 5 },
          overflow: 'auto',
          bgcolor: 'action.hover',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Box sx={{ boxShadow: '0 12px 40px rgba(0,0,0,0.22)', mb: 5 }}>
          <InvoiceDocument invoice={invoice} settings={settings} qrDataUrl={qrDataUrl} />
        </Box>
      </Box>
    </Dialog>
  );
};
