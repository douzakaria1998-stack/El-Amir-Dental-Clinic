import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  ContentCopy as DuplicateIcon,
  DeleteOutlined as DeleteIcon,
  Print as PrintIcon,
  MoreVert as MoreVertIcon,
  PictureAsPdf as PdfIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { Invoice, Lang } from '../types/invoice';
import { invoiceRepository } from '../storage/invoiceRepository';
import { useSettings } from '../context/SettingsContext';
import { useSnackbar } from '../context/SnackbarContext';
import { formatAmount, formatDateDMY, sumFees, uid } from '../utils/format';
import { actLabel, printableActs } from '../utils/acts';
import { EmptyState } from '../components/brand/EmptyState';
import { InvoiceDocument } from '../components/invoice/InvoiceDocument';
import { executeInvoiceAction } from '../services/invoiceActions';

export const HistoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings, qrDataUrl } = useSettings();
  const { showSnackbar, showError } = useSnackbar();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Menu action target
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Delete dialog target
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Hidden print element ref for offscreen printing of history rows
  const [printTargetInvoice, setPrintTargetInvoice] = useState<Invoice | null>(null);
  const hiddenPrintRef = useRef<HTMLDivElement>(null);

  const loadInvoices = async () => {
    try {
      const all = await invoiceRepository.list();
      setInvoices(all);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const fullName = `${inv.lastName} ${inv.firstName}`.toLowerCase();
      const matchSearch = !search.trim() || fullName.includes(search.trim().toLowerCase());
      const matchFrom = !dateFrom || (inv.invoiceDate && inv.invoiceDate >= dateFrom);
      const matchTo = !dateTo || (inv.invoiceDate && inv.invoiceDate <= dateTo);
      return matchSearch && matchFrom && matchTo;
    });
  }, [invoices, search, dateFrom, dateTo]);

  const handleEdit = (inv: Invoice) => {
    navigate(`/?id=${inv.id}`);
  };

  const handleDuplicate = async (inv: Invoice) => {
    const copy: Invoice = {
      ...inv,
      id: uid(),
      number: '', // will get new number on save
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await invoiceRepository.save(copy);
    showSnackbar(t('snackbar.duplicated'), 'success');
    await loadInvoices();
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await invoiceRepository.remove(deleteTarget.id);
    showSnackbar(t('snackbar.deleted'), 'info');
    setDeleteTarget(null);
    await loadInvoices();
  };

  const handleReprint = async (inv: Invoice, overrideLang?: Lang, action: 'print' | 'pdfOnly' = 'print') => {
    setMenuAnchor(null);
    const target = overrideLang ? { ...inv, invoiceLang: overrideLang } : inv;
    setPrintTargetInvoice(target);

    // Give React one tick to render the hidden print document
    setTimeout(async () => {
      if (!hiddenPrintRef.current) return;
      await executeInvoiceAction({
        invoice: target,
        settings,
        previewElement: hiddenPrintRef.current,
        action,
        t,
        showSnackbar,
        showError,
      });
      setPrintTargetInvoice(null);
    }, 150);
  };

  const sep = settings.thousandsSeparator;

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Title */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          {t('history.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('history.subtitle')}
        </Typography>
      </Box>

      {/* Filter toolbar */}
      <Card sx={{ p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder={t('history.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            },
          }}
          sx={{ minWidth: 260, flexGrow: 1 }}
        />

        <TextField
          size="small"
          type="date"
          label={t('history.from')}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 170 }}
        />

        <TextField
          size="small"
          type="date"
          label={t('history.to')}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ width: 170 }}
        />

        {(search || dateFrom || dateTo) && (
          <Button
            size="small"
            variant="text"
            onClick={() => {
              setSearch('');
              setDateFrom('');
              setDateTo('');
            }}
          >
            {t('history.clearFilters')}
          </Button>
        )}
      </Card>

      {/* Invoices Table */}
      {invoices.length === 0 && !loading ? (
        <EmptyState
          title={t('history.emptyTitle')}
          text={t('history.emptyText')}
          action={
            <Button variant="contained" color="primary" onClick={() => navigate('/?new=1')}>
              {t('nav.newInvoice')}
            </Button>
          }
        />
      ) : filteredInvoices.length === 0 && !loading ? (
        <EmptyState
          title={t('history.noResultsTitle')}
          text={t('history.noResultsText')}
          action={
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              {t('history.clearFilters')}
            </Button>
          }
        />
      ) : (
        <Card sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('history.columns.number')}</TableCell>
                  <TableCell>{t('history.columns.invoiceDate')}</TableCell>
                  <TableCell>{t('history.columns.patient')}</TableCell>
                  <TableCell>{t('history.columns.acts')}</TableCell>
                  <TableCell align="right">{t('history.columns.total')}</TableCell>
                  <TableCell align="center">{t('history.columns.lang')}</TableCell>
                  <TableCell align="right">{t('history.columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((inv) => {
                    const acts = printableActs(inv);
                    const total = sumFees(acts.map((a) => a.fee));
                    const actsSummary = acts
                      .slice(0, 2)
                      .map((a) => actLabel(a, inv.invoiceLang, settings))
                      .join(', ') + (acts.length > 2 ? ` (+${acts.length - 2})` : '');

                    return (
                      <TableRow key={inv.id} hover>
                        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {inv.number || '—'}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {formatDateDMY(inv.invoiceDate)}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          {inv.lastName.toUpperCase()} {inv.firstName.toUpperCase()}
                        </TableCell>
                        <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {actsSummary || '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {formatAmount(total, sep)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={inv.invoiceLang.toUpperCase()}
                            color={inv.invoiceLang === 'fr' ? 'primary' : 'secondary'}
                            variant="outlined"
                            sx={{ fontWeight: 700, height: 22 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleReprint(inv)}
                            title={t('history.actions.reprint')}
                          >
                            <PrintIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(inv)}
                            title={t('history.actions.edit')}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setSelectedInvoice(inv);
                              setMenuAnchor(e.currentTarget);
                            }}
                            title={t('history.actions.more')}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={filteredInvoices.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage={t('history.rowsPerPage')}
          />
        </Card>
      )}

      {/* Row Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        {selectedInvoice && (
          <>
            <MenuItem onClick={() => handleReprint(selectedInvoice, 'fr', 'print')}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('history.actions.printIn', { lang: 'FR' })} />
            </MenuItem>
            <MenuItem onClick={() => handleReprint(selectedInvoice, 'en', 'print')}>
              <ListItemIcon>
                <PrintIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('history.actions.printIn', { lang: 'EN' })} />
            </MenuItem>
            <MenuItem onClick={() => handleReprint(selectedInvoice, 'fr', 'pdfOnly')}>
              <ListItemIcon>
                <PdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('history.actions.pdfIn', { lang: 'FR' })} />
            </MenuItem>
            <MenuItem onClick={() => handleReprint(selectedInvoice, 'en', 'pdfOnly')}>
              <ListItemIcon>
                <PdfIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('history.actions.pdfIn', { lang: 'EN' })} />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                if (selectedInvoice) handleDuplicate(selectedInvoice);
              }}
            >
              <ListItemIcon>
                <DuplicateIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('history.actions.duplicate')} />
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                setDeleteTarget(selectedInvoice);
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'error.main' }}>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('history.actions.delete')} />
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('history.confirmDeleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget &&
              t('history.confirmDeleteText', {
                number: deleteTarget.number || '',
                patient: `${deleteTarget.lastName} ${deleteTarget.firstName}`,
              })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hidden offscreen container for re-rendering an invoice document during reprint/pdf */}
      {printTargetInvoice && (
        <Box
          sx={{
            position: 'fixed',
            left: -9999,
            top: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        >
          <div ref={hiddenPrintRef}>
            <InvoiceDocument
              invoice={printTargetInvoice}
              settings={settings}
              qrDataUrl={qrDataUrl}
            />
          </div>
        </Box>
      )}
    </Box>
  );
};
