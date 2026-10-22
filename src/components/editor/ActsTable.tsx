import React from 'react';
import {
  Box,
  Button,
  IconButton,
  TextField,
  Typography,
  Autocomplete,
  Tooltip,
  Paper,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, DeleteOutlined as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { InvoiceAct, Lang } from '../../types/invoice';
import type { ClinicSettings } from '../../types/settings';
import { invoiceStrings } from '../../i18n/invoiceStrings';
import { formatAmount, sumFees, uid } from '../../utils/format';
import type { ValidationErrors } from '../../utils/validation';

interface ActsTableProps {
  acts: InvoiceAct[];
  onChange: (acts: InvoiceAct[]) => void;
  invoiceLang: Lang;
  settings: ClinicSettings;
  errors?: ValidationErrors;
}

export const ActsTable: React.FC<ActsTableProps> = ({
  acts,
  onChange,
  invoiceLang,
  settings,
  errors,
}) => {
  const { t } = useTranslation();
  const sep = settings.thousandsSeparator;
  const currentInvoiceStrings = invoiceStrings[invoiceLang];

  const handleAddRow = () => {
    const newAct: InvoiceAct = {
      id: uid(),
      actKey: null,
      text: '',
      tooth: '',
      fee: null,
    };
    onChange([...acts, newAct]);
  };

  const handleDeleteRow = (index: number) => {
    if (acts.length <= 1) {
      // Clear instead of removing last row to keep at least 1 input
      onChange([{ id: uid(), actKey: null, text: '', tooth: '', fee: null }]);
      return;
    }
    const updated = acts.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleUpdateAct = (index: number, updates: Partial<InvoiceAct>) => {
    const updated = acts.map((act, i) => (i === index ? { ...act, ...updates } : act));
    onChange(updated);
  };

  const total = sumFees(acts.map((a) => a.fee));

  // Autocomplete options from settings
  const actOptions = settings.acts.map((a) => ({
    key: a.id,
    label: invoiceLang === 'en' ? a.en : a.fr,
    defaultFee: a.defaultFee,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {acts.map((act, index) => {
          const rowErr = errors?.rows[act.id];
          const toothPreview = act.tooth.trim() ? currentInvoiceStrings.tooth(act.tooth.trim()) : '';

          return (
            <Paper
              key={act.id}
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: rowErr ? 'error.main' : 'divider',
                borderRadius: 2.5,
                transition: 'border-color 0.2s',
              }}
            >
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr auto' },
                  gap: 1.5,
                  alignItems: 'start',
                }}
              >
                {/* 1. Procedure name (Autocomplete + free solo) */}
                <Autocomplete
                  freeSolo
                  options={actOptions.map((opt) => opt.label)}
                  value={
                    act.actKey
                      ? (actOptions.find((o) => o.key === act.actKey)?.label || act.text)
                      : act.text
                  }
                  onInputChange={(_, newInputValue) => {
                    // Check if match predefined option
                    const matched = actOptions.find(
                      (o) => o.label.toLowerCase() === newInputValue.trim().toLowerCase()
                    );
                    if (matched) {
                      handleUpdateAct(index, {
                        actKey: matched.key,
                        text: matched.label,
                        fee: act.fee === null && matched.defaultFee ? matched.defaultFee : act.fee,
                      });
                    } else {
                      handleUpdateAct(index, { actKey: null, text: newInputValue });
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label={`${t('editor.fields.act')} #${index + 1}`}
                      placeholder={t('editor.placeholders.act')}
                      error={Boolean(rowErr?.text)}
                      helperText={rowErr?.text ? t('validation.actRequired') : undefined}
                    />
                  )}
                />

                {/* 2. Tooth Number */}
                <TextField
                  size="small"
                  label={t('editor.fields.tooth')}
                  placeholder={t('editor.placeholders.tooth')}
                  value={act.tooth}
                  onChange={(e) => handleUpdateAct(index, { tooth: e.target.value })}
                  helperText={toothPreview ? `${toothPreview}` : undefined}
                />

                {/* 3. Fee (DA) */}
                <TextField
                  size="small"
                  type="number"
                  label={t('editor.fields.fee')}
                  value={act.fee === null ? '' : act.fee}
                  onChange={(e) => {
                    const val = e.target.value === '' ? null : parseFloat(e.target.value);
                    handleUpdateAct(index, { fee: isNaN(val as number) ? null : val });
                  }}
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position="end">DA</InputAdornment>,
                    },
                    htmlInput: {
                      min: 0,
                      step: 50,
                    },
                  }}
                  error={Boolean(rowErr?.fee)}
                  helperText={rowErr?.fee ? t('validation.feePositive') : undefined}
                />

                {/* 4. Delete button */}
                <Tooltip title={t('editor.deleteRowTooltip', { index: index + 1 })}>
                  <span>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteRow(index)}
                      sx={{ mt: 0.5 }}
                      aria-label={t('editor.deleteRow')}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Global acts error message if any */}
      {errors?.acts && (
        <Typography variant="caption" color="error.main" sx={{ px: 1 }}>
          {t('validation.atLeastOneAct')}
        </Typography>
      )}

      {/* Footer controls: Add row + Total summary */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          pt: 1,
        }}
      >
        <Button
          variant="tonal"
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          sx={{ fontWeight: 600 }}
        >
          {t('editor.addRow')}
        </Button>

        <Paper
          elevation={0}
          sx={{
            px: 2.5,
            py: 1,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'baseline',
            gap: 1.5,
            alignSelf: { xs: 'flex-end', sm: 'center' },
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
            {t('editor.total')}:
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {formatAmount(total, sep)}
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
};
