import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Divider,
  Paper,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  DeleteOutlined as DeleteIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  FolderOpen as FolderIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { ClinicSettings, LogoPosition, PredefinedAct, ThousandsSeparator, SaveMethod, FooterStyle, BackgroundPatternColor } from '../types/settings';
import type { Lang } from '../types/invoice';
import { useSettings } from '../context/SettingsContext';
import { useSnackbar } from '../context/SnackbarContext';
import { isDirectoryPickerSupported } from '../services/fileSaveService';
import { settingsRepository } from '../storage/settingsRepository';
import { exportBackup, importBackup, downloadJson } from '../storage/backup';
import { uid } from '../utils/format';
import { setAppLanguage, type AppLang } from '../i18n';

export const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const { showSuccess, showError } = useSnackbar();

  const [formData, setFormData] = useState<ClinicSettings>(settings);
  const [dirty, setDirty] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFileContent, setImportFileContent] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(settings);
    setDirty(false);
  }, [settings]);

  const update = <K extends keyof ClinicSettings>(key: K, value: ClinicSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(formData);
      if (formData.defaultAppLang) {
        setAppLanguage(formData.defaultAppLang as AppLang);
      }
      setDirty(false);
      showSuccess(t('snackbar.settingsSaved'));
    } catch (err: any) {
      showError(err?.message || 'Error saving settings');
    }
  };

  const handleDiscard = () => {
    setFormData(settings);
    setDirty(false);
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      update('logoDataUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Acts management
  const handleAddAct = () => {
    const newAct: PredefinedAct = {
      id: uid(),
      fr: '',
      en: '',
      defaultFee: null,
    };
    update('acts', [...formData.acts, newAct]);
  };

  const handleUpdateAct = (index: number, updates: Partial<PredefinedAct>) => {
    const updated = formData.acts.map((act, i) => (i === index ? { ...act, ...updates } : act));
    update('acts', updated);
  };

  const handleDeleteAct = (index: number) => {
    update('acts', formData.acts.filter((_, i) => i !== index));
  };

  // Directory picker
  const handleChooseFolder = async () => {
    if (!isDirectoryPickerSupported()) {
      showError(t('settings.fields.fsUnsupported'));
      return;
    }
    try {
      const handle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      await settingsRepository.setSaveFolder(handle);
      update('saveFolderName', handle.name);
      update('saveMethod', 'folder');
      showSuccess(t('snackbar.savedFolder', { folder: handle.name }));
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        showError(err?.message || 'Error picking directory');
      }
    }
  };

  const handleForgetFolder = async () => {
    await settingsRepository.setSaveFolder(undefined);
    update('saveFolderName', '');
    update('saveMethod', 'dialog');
  };

  // Backup export / import
  const handleExport = async () => {
    const backup = await exportBackup();
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadJson(backup, `elamir_backup_${dateStr}.json`);
    showSuccess(t('snackbar.exported'));
  };

  const handleFileSelectForImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setImportFileContent(content);
      setImportDialogOpen(true);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    try {
      const res = await importBackup(importFileContent);
      setImportDialogOpen(false);
      setFormData(res.settings);
      setDirty(false);
      showSuccess(t('snackbar.imported', { count: res.count }));
    } catch {
      showError(t('snackbar.importError'));
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title + Save button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {t('settings.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('settings.subtitle')}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          {dirty && (
            <Button variant="outlined" onClick={handleDiscard}>
              {t('settings.discard')}
            </Button>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={!dirty}
            onClick={handleSave}
            sx={{ fontWeight: 700 }}
          >
            {t('settings.save')}
          </Button>
        </Box>
      </Box>

      {dirty && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {t('settings.unsaved')}
        </Alert>
      )}

      {/* 1. Clinic Identity Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.identity')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('settings.fields.clinicNameFr')}
              value={formData.clinicNameFr}
              onChange={(e) => update('clinicNameFr', e.target.value)}
            />
            <TextField
              label={t('settings.fields.clinicTaglineFr')}
              value={formData.clinicTaglineFr}
              onChange={(e) => update('clinicTaglineFr', e.target.value)}
              multiline
              rows={4}
              helperText={t('settings.fields.taglineHelper')}
            />
            <TextField
              label={t('settings.fields.clinicNameAr')}
              value={formData.clinicNameAr}
              onChange={(e) => update('clinicNameAr', e.target.value)}
              slotProps={{ htmlInput: { dir: 'rtl', lang: 'ar' } }}
            />
            <TextField
              label={t('settings.fields.clinicTaglineAr')}
              value={formData.clinicTaglineAr}
              onChange={(e) => update('clinicTaglineAr', e.target.value)}
              slotProps={{ htmlInput: { dir: 'rtl', lang: 'ar' } }}
              multiline
              rows={4}
              helperText={t('settings.fields.taglineHelper')}
            />
          </Box>

          {/* Logo controls */}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Box
              sx={{
                width: 140,
                height: 70,
                border: '1px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                overflow: 'hidden',
                bgcolor: '#ffffff',
                p: 1,
              }}
            >
              <img
                src={formData.logoDataUrl || '/logo.svg'}
                alt="Logo"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {t('settings.fields.logo')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('settings.fields.logoHint')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  ref={logoInputRef}
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {t('settings.fields.uploadLogo')}
                </Button>
                {formData.logoDataUrl && (
                  <Button
                    size="small"
                    variant="text"
                    color="inherit"
                    onClick={() => update('logoDataUrl', null)}
                  >
                    {t('settings.fields.defaultLogo')}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>

          <FormControl>
            <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {t('settings.fields.logoPosition')}
            </FormLabel>
            <RadioGroup
              row
              value={formData.logoPosition}
              onChange={(e) => update('logoPosition', e.target.value as LogoPosition)}
            >
              <FormControlLabel
                value="center"
                control={<Radio size="small" />}
                label={t('settings.fields.logoCenter')}
              />
              <FormControlLabel
                value="left"
                control={<Radio size="small" />}
                label={t('settings.fields.logoLeft')}
              />
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>

      {/* 2. Legal Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.legal')}
          subheader={t('settings.fields.optional')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('settings.fields.rc')}
              value={formData.rc}
              onChange={(e) => update('rc', e.target.value)}
              placeholder="ex. 39/00-0544570 B 20"
            />
            <TextField
              label={t('settings.fields.nis')}
              value={formData.nis}
              onChange={(e) => update('nis', e.target.value)}
              placeholder="ex. 002039010010273"
            />
            <TextField
              label={t('settings.fields.nif')}
              value={formData.nif}
              onChange={(e) => update('nif', e.target.value)}
              placeholder="ex. 002039054457002"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 3. Contact Details Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.contact')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('settings.fields.address')}
              value={formData.address}
              onChange={(e) => update('address', e.target.value)}
            />
            <TextField
              label={t('settings.fields.addressAr')}
              value={formData.addressAr}
              onChange={(e) => update('addressAr', e.target.value)}
              slotProps={{ htmlInput: { dir: 'rtl', lang: 'ar' } }}
            />
          </Box>
          <TextField
            label={t('settings.fields.phones')}
            value={formData.phones}
            onChange={(e) => update('phones', e.target.value)}
            helperText={t('settings.fields.phonesHelper')}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('settings.fields.email')}
              value={formData.email}
              onChange={(e) => update('email', e.target.value)}
            />
            <TextField
              label={t('settings.fields.website')}
              value={formData.website}
              onChange={(e) => update('website', e.target.value)}
              helperText={t('settings.fields.websiteHelper')}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 4. Invoice Appearance & Background Pattern Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.appearance')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControl>
            <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
              {t('settings.fields.footerStyle')}
            </FormLabel>
            <RadioGroup
              row
              value={formData.footerStyle}
              onChange={(e) => update('footerStyle', e.target.value as FooterStyle)}
            >
              <FormControlLabel
                value="grey"
                control={<Radio size="small" />}
                label={t('settings.fields.footerStyleGrey')}
              />
              <FormControlLabel
                value="blue"
                control={<Radio size="small" />}
                label={t('settings.fields.footerStyleBlue')}
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.showBackgroundPattern}
                  onChange={(e) => update('showBackgroundPattern', e.target.checked)}
                />
              }
              label={t('settings.fields.bgPatternEnabled')}
            />
            <Typography variant="caption" color="text.secondary">
              {t('settings.fields.bgPatternHint')}
            </Typography>
          </Box>

          {formData.showBackgroundPattern && (
            <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControl>
                <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
                  {t('settings.fields.bgPatternColor')}
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.backgroundPatternColor}
                  onChange={(e) =>
                    update('backgroundPatternColor', e.target.value as BackgroundPatternColor)
                  }
                >
                  <FormControlLabel
                    value="blue"
                    control={<Radio size="small" />}
                    label={t('settings.fields.bgPatternColorBlue')}
                  />
                  <FormControlLabel
                    value="grey"
                    control={<Radio size="small" />}
                    label={t('settings.fields.bgPatternColorGrey')}
                  />
                </RadioGroup>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.showWatermark}
                    onChange={(e) => update('showWatermark', e.target.checked)}
                  />
                }
                label={t('settings.fields.watermarkEnabled')}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 5. Invoice Texts & VAT Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.texts')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControlLabel
            control={
              <Switch
                checked={formData.vatEnabled}
                onChange={(e) => update('vatEnabled', e.target.checked)}
              />
            }
            label={t('settings.fields.vatEnabled')}
          />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('settings.fields.vatFr')}
              value={formData.vatMention.fr}
              onChange={(e) =>
                update('vatMention', { ...formData.vatMention, fr: e.target.value })
              }
              disabled={!formData.vatEnabled}
            />
            <TextField
              label={t('settings.fields.vatEn')}
              value={formData.vatMention.en}
              onChange={(e) =>
                update('vatMention', { ...formData.vatMention, en: e.target.value })
              }
              disabled={!formData.vatEnabled}
            />
          </Box>
          <Divider />
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={t('settings.fields.footerFr')}
              value={formData.footerText.fr}
              onChange={(e) =>
                update('footerText', { ...formData.footerText, fr: e.target.value })
              }
              multiline
              rows={2}
            />
            <TextField
              label={t('settings.fields.footerEn')}
              value={formData.footerText.en}
              onChange={(e) =>
                update('footerText', { ...formData.footerText, en: e.target.value })
              }
              multiline
              rows={2}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 5. Predefined Acts Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.acts')}
          action={
            <Button size="small" variant="tonal" startIcon={<AddIcon />} onClick={handleAddAct}>
              {t('settings.fields.addAct')}
            </Button>
          }
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('settings.fields.actFr')}</TableCell>
                <TableCell>{t('settings.fields.actEn')}</TableCell>
                <TableCell style={{ width: 160 }}>{t('settings.fields.defaultFee')}</TableCell>
                <TableCell align="right" style={{ width: 50 }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {formData.acts.map((act, index) => (
                <TableRow key={act.id}>
                  <TableCell>
                    <TextField
                      size="small"
                      value={act.fr}
                      onChange={(e) => handleUpdateAct(index, { fr: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={act.en}
                      onChange={(e) => handleUpdateAct(index, { en: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={act.defaultFee === null ? '' : act.defaultFee}
                      onChange={(e) => {
                        const v = e.target.value === '' ? null : parseFloat(e.target.value);
                        handleUpdateAct(index, { defaultFee: isNaN(v as number) ? null : v });
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDeleteAct(index)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 6. Formatting & Preferences */}
      <Card>
        <CardHeader
          title={t('settings.sections.format')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <FormControl>
            <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {t('settings.fields.thousands')}
            </FormLabel>
            <RadioGroup
              row
              value={formData.thousandsSeparator}
              onChange={(e) =>
                update('thousandsSeparator', e.target.value as ThousandsSeparator)
              }
            >
              <FormControlLabel
                value="none"
                control={<Radio size="small" />}
                label={t('settings.fields.sepNone')}
              />
              <FormControlLabel
                value="space"
                control={<Radio size="small" />}
                label={t('settings.fields.sepSpace')}
              />
              <FormControlLabel
                value="dot"
                control={<Radio size="small" />}
                label={t('settings.fields.sepDot')}
              />
            </RadioGroup>
          </FormControl>

          <Divider />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl>
              <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>
                {t('settings.fields.defaultInvoiceLang')}
              </FormLabel>
              <RadioGroup
                row
                value={formData.defaultInvoiceLang}
                onChange={(e) => update('defaultInvoiceLang', e.target.value as Lang)}
              >
                <FormControlLabel value="fr" control={<Radio size="small" />} label="Français (FR)" />
                <FormControlLabel value="en" control={<Radio size="small" />} label="English (EN)" />
              </RadioGroup>
            </FormControl>

            <FormControl>
              <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>
                {t('settings.fields.defaultAppLang')}
              </FormLabel>
              <RadioGroup
                row
                value={formData.defaultAppLang}
                onChange={(e) => update('defaultAppLang', e.target.value as Lang)}
              >
                <FormControlLabel value="fr" control={<Radio size="small" />} label="Français (FR)" />
                <FormControlLabel value="en" control={<Radio size="small" />} label="English (EN)" />
              </RadioGroup>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* 7. PDF Saving Preferences Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.saving')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl>
            <RadioGroup
              value={formData.saveMethod}
              onChange={(e) => update('saveMethod', e.target.value as SaveMethod)}
            >
              <FormControlLabel
                value="dialog"
                control={<Radio size="small" />}
                label={t('settings.fields.methodDialog')}
              />
              <FormControlLabel
                value="folder"
                control={<Radio size="small" />}
                label={t('settings.fields.methodFolder')}
              />
              <FormControlLabel
                value="download"
                control={<Radio size="small" />}
                label={t('settings.fields.methodDownload')}
              />
            </RadioGroup>
          </FormControl>

          {formData.saveMethod === 'folder' && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FolderIcon color="primary" />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formData.saveFolderName
                      ? t('settings.fields.folderChosen', { name: formData.saveFolderName })
                      : t('settings.fields.folderNone')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<FolderIcon />}
                    onClick={handleChooseFolder}
                  >
                    {t('settings.fields.chooseFolder')}
                  </Button>
                  {formData.saveFolderName && (
                    <Button size="small" color="inherit" onClick={handleForgetFolder}>
                      {t('settings.fields.forgetFolder')}
                    </Button>
                  )}
                </Box>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {t('settings.fields.folderHint')}
              </Typography>
            </Paper>
          )}
        </CardContent>
      </Card>

      {/* 8. Backup & Restore Section */}
      <Card>
        <CardHeader
          title={t('settings.sections.backup')}
          titleTypographyProps={{ variant: 'subtitle1', fontWeight: 600 }}
        />
        <CardContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t('settings.fields.backupHint')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
            >
              {t('settings.fields.export')}
            </Button>
            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileSelectForImport}
            />
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => fileInputRef.current?.click()}
            >
              {t('settings.fields.import')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Confirm Import Dialog */}
      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>{t('settings.confirmImportTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('settings.confirmImportText')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleConfirmImport}>
            {t('common.confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
