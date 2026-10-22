import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { LogoMark } from './BrandLogo';
import { WavePattern } from './WavePattern';
import { brand } from '../../theme/brandTokens';

/** Empty state with the brand watermark (logo + wave lines), like the letterhead background. */
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <Box
      sx={(t) => ({
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 4,
        bgcolor: t.m3.surfaceContainerLow,
        px: 4,
        py: 8,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
      })}
    >
      <WavePattern opacity={0.35} />
      <Box
        sx={{
          position: 'relative',
          width: 112,
          height: 112,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: brand.mist,
          color: brand.blue,
          mb: 1,
          animation: 'floaty 4s ease-in-out infinite',
          '@keyframes floaty': { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        }}
      >
        <LogoMark size={64} />
      </Box>
      <Typography variant="h6" component="p" sx={{ position: 'relative', fontWeight: 500 }}>
        {title}
      </Typography>
      {text && (
        <Typography variant="body2" color="text.secondary" sx={{ position: 'relative', maxWidth: 420 }}>
          {text}
        </Typography>
      )}
      {action && <Box sx={{ position: 'relative', mt: 1 }}>{action}</Box>}
    </Box>
  );
}
