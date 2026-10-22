import React, { useState, useRef, useEffect } from 'react';
import { Box, IconButton, Typography, Tooltip, Chip } from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitScreenIcon,
  Fullscreen as FullscreenIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { InvoiceDocument, type InvoiceLayoutInfo } from '../invoice/InvoiceDocument';
import type { Invoice } from '../../types/invoice';
import type { ClinicSettings } from '../../types/settings';

interface InvoicePreviewPaneProps {
  invoice: Invoice;
  settings: ClinicSettings;
  qrDataUrl: string;
  onOpenFullscreen: () => void;
  documentRef?: React.RefObject<HTMLDivElement | null>;
}

export const InvoicePreviewPane: React.FC<InvoicePreviewPaneProps> = ({
  invoice,
  settings,
  qrDataUrl,
  onOpenFullscreen,
  documentRef,
}) => {
  const { t } = useTranslation();
  const [scale, setScale] = useState<number>(0.68);
  const [layoutInfo, setLayoutInfo] = useState<InvoiceLayoutInfo>({ pages: 1, density: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit scale on mount and resize
  const autoFit = () => {
    if (!containerRef.current) return;
    const containerWidth = containerRef.current.clientWidth - 40;
    // 210mm ≈ 794px
    const a4WidthPx = 794;
    const computed = Math.min(1.0, Math.max(0.4, containerWidth / a4WidthPx));
    setScale(Number(computed.toFixed(2)));
  };

  useEffect(() => {
    autoFit();
    const handleResize = () => autoFit();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleZoomIn = () => setScale((s) => Math.min(1.2, Number((s + 0.1).toFixed(2))));
  const handleZoomOut = () => setScale((s) => Math.max(0.4, Number((s - 0.1).toFixed(2))));

  return (
    <Box
      ref={containerRef}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 600,
        bgcolor: 'background.default',
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {/* Toolbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('editor.preview.title')}
          </Typography>
          <Chip
            size="small"
            label={t('editor.preview.pages', { count: layoutInfo.pages })}
            color={layoutInfo.pages > 1 ? 'warning' : 'default'}
            sx={{ height: 22, fontSize: '0.75rem', fontWeight: 600 }}
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1, minWidth: 40, textAlign: 'right' }}>
            {Math.round(scale * 100)}%
          </Typography>
          <Tooltip title={t('editor.preview.zoomOut')}>
            <span>
              <IconButton size="small" onClick={handleZoomOut} disabled={scale <= 0.4}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={t('editor.preview.zoomIn')}>
            <span>
              <IconButton size="small" onClick={handleZoomIn} disabled={scale >= 1.2}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Ajuster / Fit">
            <IconButton size="small" onClick={autoFit}>
              <FitScreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('editor.actions.preview')}>
            <IconButton size="small" color="primary" onClick={onOpenFullscreen}>
              <FullscreenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Scrollable Viewport with A4 canvas inside */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          bgcolor: 'action.hover',
        }}
      >
        <Box
          ref={documentRef}
          sx={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            // Drop shadow for realistic paper elevation
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            mb: `${(scale - 1) * 300}px`,
          }}
        >
          <InvoiceDocument
            invoice={invoice}
            settings={settings}
            qrDataUrl={qrDataUrl}
            onLayout={setLayoutInfo}
          />
        </Box>
      </Box>
    </Box>
  );
};
