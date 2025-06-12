import React from 'react';
import { 
  Box, 
  CircularProgress, 
  LinearProgress, 
  Typography, 
  Skeleton,
  Card,
  CardContent
} from '@mui/material';

export type LoadingVariant = 'spinner' | 'linear' | 'skeleton' | 'overlay' | 'inline';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  variant?: LoadingVariant;
  fullScreen?: boolean;
  overlay?: boolean;
  progress?: number; // Для linear progress (0-100)
  skeletonLines?: number; // Количество линий для skeleton
  minHeight?: string | number;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Загрузка...', 
  size = 40,
  variant = 'spinner',
  fullScreen = false,
  overlay = false,
  progress,
  skeletonLines = 3,
  minHeight = '200px'
}) => {
  const renderSpinner = () => (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={minHeight}
      gap={2}
    >
      <CircularProgress size={size} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  const renderLinear = () => (
    <Box sx={{ width: '100%', minHeight }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          {message}
        </Typography>
      </Box>
      <LinearProgress 
        variant={progress !== undefined ? 'determinate' : 'indeterminate'}
        value={progress}
      />
      {progress !== undefined && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {Math.round(progress)}%
          </Typography>
        </Box>
      )}
    </Box>
  );

  const renderSkeleton = () => (
    <Box sx={{ minHeight }}>
      {Array.from({ length: skeletonLines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height={40}
          sx={{ mb: 1 }}
          animation="wave"
        />
      ))}
    </Box>
  );

  const renderInline = () => (
    <Box display="flex" alignItems="center" gap={1}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );

  const renderContent = () => {
    switch (variant) {
      case 'linear':
        return renderLinear();
      case 'skeleton':
        return renderSkeleton();
      case 'inline':
        return renderInline();
      case 'overlay':
      case 'spinner':
      default:
        return renderSpinner();
    }
  };

  if (fullScreen) {
    return (
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={9999}
      >
        <Card>
          <CardContent>
            {renderSpinner()}
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (overlay) {
    return (
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="rgba(255, 255, 255, 0.8)"
        zIndex={1000}
      >
        {renderSpinner()}
      </Box>
    );
  }

  return renderContent();
};

export default LoadingSpinner; 