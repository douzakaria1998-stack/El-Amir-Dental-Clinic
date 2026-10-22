import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  RestartAlt as ClearIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import type { Invoice, Lang } from '../types/invoice';
import { useSettings } from '../context/SettingsContext';
import { useSnackbar } from '../context/SnackbarContext';
import { createDemoInvoice, createBlankInvoice } from '../storage/defaults';
import { invoiceRepository } from '../storage/invoiceRepository';
import { validateInvoice, hasErrors, type ValidationErrors } from '../utils/validation';
import { amountToWords } from '../utils/amountToWords';
import { sumFees } from '../utils/format';
import { ActsTable } from '../components/editor/ActsTable';
import { InvoicePreviewPane } from '../components/editor/InvoicePreviewPane';
import { FullScreenPreview } from '../components/editor/FullScreenPreview';
import { executeInvoiceAction } from '../services/invoiceActions';

export const EditorPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, qrDataUrl } = useSettings();
  const { showSnackbar, showError } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();

  const [invoice, setInvoice] = useState<Invoice>(() => createDemoInvoice());
  const [errors, setErrors] = useState<ValidationErrors>({ rows: {} });
  const [busy, setBusy] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const documentRef = useRef<HTMLDivElement>(null);

  // Load from search params if id is provided or if new=1
  useEffect(() => {
    const id = searchParams.get('id');
    const isNew = searchParams.get('new');

    if (id) {
      void invoiceRepository.get(id).then((found) => {
        if (found) {
          setInvoice(found);
        } else {
          showError(t('editor.notFound'));
        }
      });
    } else if (isNew) {
      setInvoice(createBlankInvoice(settings.defaultInvoiceLang || 'fr'));
      // Remove query param to avoid resetting on re-render
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, settings.defaultInvoiceLang, showError, t]);

  const updateField = <K extends keyof Invoice>(field: K, value: Invoice[K]) => {
    setInvoice((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field if any
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const total = sumFees(invoice.acts.map((a) => a.fee));
  const words = amountToWords(total, invoice.invoiceLang);

  const handleAction = async (action: 'print' | 'pdfOnly' | 'saveOnly') => {
    const errs = validateInvoice(invoice);
    setErrors(errs);
    if (hasErrors(errs)) {
      showError(t('validation.formInvalid'));
      return;
    }

    setBusy(true);
    try {
      const res = await executeInvoiceAction({
        invoice,
        settings,
        previewElement: documentRef.current,
        action,
        t,
        showSnackbar,
        showError,
        onInvoiceSaved: (saved) => {
          setInvoice(saved);
        },
      });

      if (res.success && res.savedInvoice) {
        setInvoice(res.savedInvoice);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmClear = () => {
    setInvoice(createBlankInvoice(settings.defaultInvoiceLang || 'fr'));
    setErrors({ rows: {} });
    setClearDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1600, mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Left Column: Input Form */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Header info / Title */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {invoice.number ? t('editor.editTitle') : t('editor.newTitle')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {invoice.number
                    ? t('editor.number', { number: invoice.number })
                    : t('editor.notSaved')}
                </Typography>
              </Box>

              {/* Action Buttons Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ClearIcon />}
                  onClick={() => setClearDialogOpen(true)}
                >
                  {t('editor.actions.clear')}
                </Button>
              </Box>
            </Box>

            {/* 1. Document & Language Section */}
            <Card>
              <CardHeader
                title={t('editor.sections.document')}
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Invoice Language Toggle */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    justifyContent: 'space-between',
                    gap: 1.5,
                    p: 1.5,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('editor.fields.invoiceLang')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('editor.helpers.invoiceLang')}
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    value={invoice.invoiceLang}
                    exclusive
                    onChange={(_, val: Lang | null) => {
                      if (val) updateField('invoiceLang', val);
                    }}
                    size="small"
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <ToggleButton value="fr" sx={{ px: 2, fontWeight: 700 }}>
                      FR
                    </ToggleButton>
                    <ToggleButton value="en" sx={{ px: 2, fontWeight: 700 }}>
                      EN
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {/* Dates */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    type="date"
                    label={t('editor.fields.invoiceDate')}
                    value={invoice.invoiceDate}
                    onChange={(e) => updateField('invoiceDate', e.target.value)}
                    error={Boolean(errors.invoiceDate)}
                    helperText={errors.invoiceDate ? t(`validation.${errors.invoiceDate}`) : undefined}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    type="date"
                    label={t('editor.fields.billingDate')}
                    value={invoice.billingDate}
                    onChange={(e) => updateField('billingDate', e.target.value)}
                    error={Boolean(errors.billingDate)}
                    helperText={errors.billingDate ? t(`validation.${errors.billingDate}`) : undefined}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* 2. Patient Section */}
            <Card>
              <CardHeader
                title={t('editor.sections.patient')}
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    label={t('editor.fields.lastName')}
                    value={invoice.lastName}
                    onChange={(e) => updateField('lastName', e.target.value)}
                    error={Boolean(errors.lastName)}
                    helperText={errors.lastName ? t(`validation.${errors.lastName}`) : t('editor.helpers.uppercase')}
                    slotProps={{
                      htmlInput: {
                        style: { textTransform: 'uppercase' },
                      },
                    }}
                  />
                  <TextField
                    label={t('editor.fields.firstName')}
                    value={invoice.firstName}
                    onChange={(e) => updateField('firstName', e.target.value)}
                    error={Boolean(errors.firstName)}
                    helperText={errors.firstName ? t(`validation.${errors.firstName}`) : t('editor.helpers.uppercase')}
                    slotProps={{
                      htmlInput: {
                        style: { textTransform: 'uppercase' },
                      },
                    }}
                  />
                </Box>
                <TextField
                  type="date"
                  label={t('editor.fields.birthDate')}
                  value={invoice.birthDate}
                  onChange={(e) => updateField('birthDate', e.target.value)}
                  error={Boolean(errors.birthDate)}
                  helperText={errors.birthDate ? t(`validation.${errors.birthDate}`) : undefined}
                  slotProps={{ inputLabel: { shrink: true } }}
                  sx={{ maxWidth: { sm: '50%' } }}
                />
              </CardContent>
            </Card>

            {/* 3. Acts and Fees Section */}
            <Card>
              <CardHeader
                title={t('editor.sections.acts')}
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 1 }}>
                <ActsTable
                  acts={invoice.acts}
                  onChange={(newActs) => updateField('acts', newActs)}
                  invoiceLang={invoice.invoiceLang}
                  settings={settings}
                  errors={errors}
                />
              </CardContent>
            </Card>

            {/* 4. Summary & Mentions Section */}
            <Card>
              <CardHeader
                title={t('editor.sections.summary')}
                titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
              />
              <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'action.hover',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t('editor.amountInWords')} ({invoice.invoiceLang.toUpperCase()}) :
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {words}.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {settings.vatEnabled ? t('editor.vatOn') : t('editor.vatOff')}
                  </Typography>
                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                    {settings.vatEnabled ? (invoice.invoiceLang === 'en' ? settings.vatMention.en : settings.vatMention.fr) : '—'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Action Bar */}
            <Paper
              elevation={2}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: 'background.paper',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                alignItems: 'center',
                position: 'sticky',
                bottom: 16,
                zIndex: 5,
              }}
            >
              {/* PRIMARY ACTION: Print (Steps 1 to 5) */}
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={busy ? <CircularProgress size={20} color="inherit" /> : <PrintIcon />}
                disabled={busy}
                onClick={() => handleAction('print')}
                sx={{
                  fontWeight: 700,
                  px: 3,
                  py: 1.2,
                  boxShadow: 3,
                }}
              >
                {t('editor.actions.print')}
              </Button>

              {/* SECONDARY ACTION: Save as PDF only */}
              <Button
                variant="tonal"
                size="large"
                startIcon={<PdfIcon />}
                disabled={busy}
                onClick={() => handleAction('pdfOnly')}
                sx={{ fontWeight: 600 }}
              >
                {t('editor.actions.savePdf')}
              </Button>

              {/* SECONDARY ACTION: Full-screen Preview */}
              <Button
                variant="outlined"
                size="large"
                startIcon={<PreviewIcon />}
                disabled={busy}
                onClick={() => setFullscreenOpen(true)}
              >
                {t('editor.actions.preview')}
              </Button>

              {/* Save invoice data to history */}
              <Button
                variant="text"
                size="large"
                startIcon={<SaveIcon />}
                disabled={busy}
                onClick={() => handleAction('saveOnly')}
              >
                {t('editor.actions.save')}
              </Button>
            </Paper>
          </Box>
        </Grid>

        {/* Right Column: Live A4 Preview */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Box sx={{ position: { lg: 'sticky' }, top: 88, height: { lg: 'calc(100vh - 110px)' } }}>
            <InvoicePreviewPane
              invoice={invoice}
              settings={settings}
              qrDataUrl={qrDataUrl}
              onOpenFullscreen={() => setFullscreenOpen(true)}
              documentRef={documentRef}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Full Screen Preview Modal */}
      <FullScreenPreview
        open={fullscreenOpen}
        onClose={() => setFullscreenOpen(false)}
        invoice={invoice}
        settings={settings}
        qrDataUrl={qrDataUrl}
      />

      {/* Clear Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onClose={() => setClearDialogOpen(false)}>
        <DialogTitle>{t('editor.clearConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('editor.clearConfirmText')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleConfirmClear}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
