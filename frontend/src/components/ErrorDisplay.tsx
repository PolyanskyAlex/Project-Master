import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Collapse,
  IconButton
} from '@mui/material';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  BugReport as BugReportIcon
} from '@mui/icons-material';

export type ErrorSeverity = 'error' | 'warning' | 'info';
export type ErrorVariant = 'alert' | 'card' | 'inline' | 'fullscreen';

interface ErrorDisplayProps {
  error: string | Error;
  severity?: ErrorSeverity;
  variant?: ErrorVariant;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  retryText?: string;
  dismissText?: string;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  severity = 'error',
  variant = 'alert',
  title,
  onRetry,
  onDismiss,
  showDetails = false,
  retryText = 'Повторить',
  dismissText = 'Закрыть',
  className
}) => {
  const [detailsOpen, setDetailsOpen] = React.useState(false);

  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'object' && error.stack ? error.stack : undefined;

  const getIcon = () => {
    switch (severity) {
      case 'warning':
        return <WarningIcon />;
      case 'info':
        return <InfoIcon />;
      case 'error':
      default:
        return <ErrorIcon />;
    }
  };

  const getDefaultTitle = () => {
    switch (severity) {
      case 'warning':
        return 'Предупреждение';
      case 'info':
        return 'Информация';
      case 'error':
      default:
        return 'Ошибка';
    }
  };

  const renderActions = () => (
    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
      {onRetry && (
        <Button
          size="small"
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
        >
          {retryText}
        </Button>
      )}
      {onDismiss && (
        <Button
          size="small"
          variant="text"
          onClick={onDismiss}
        >
          {dismissText}
        </Button>
      )}
      {showDetails && errorStack && (
        <Button
          size="small"
          variant="text"
          startIcon={<BugReportIcon />}
          onClick={() => setDetailsOpen(!detailsOpen)}
        >
          {detailsOpen ? 'Скрыть детали' : 'Показать детали'}
        </Button>
      )}
    </Box>
  );

  const renderDetails = () => {
    if (!showDetails || !errorStack) return null;

    return (
      <Collapse in={detailsOpen}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
          <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {errorStack}
          </Typography>
        </Box>
      </Collapse>
    );
  };

  const renderAlert = () => (
    <Alert
      severity={severity}
      className={className}
      action={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {showDetails && errorStack && (
            <IconButton
              size="small"
              onClick={() => setDetailsOpen(!detailsOpen)}
            >
              {detailsOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
          {onDismiss && (
            <Button size="small" onClick={onDismiss}>
              {dismissText}
            </Button>
          )}
        </Box>
      }
    >
      {title && <AlertTitle>{title}</AlertTitle>}
      <Typography variant="body2">{errorMessage}</Typography>
      {renderActions()}
      {renderDetails()}
    </Alert>
  );

  const renderCard = () => (
    <Card className={className} sx={{ border: `1px solid`, borderColor: `${severity}.main` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Box sx={{ color: `${severity}.main`, mt: 0.5 }}>
            {getIcon()}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color={`${severity}.main`} gutterBottom>
              {title || getDefaultTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMessage}
            </Typography>
            {renderActions()}
            {renderDetails()}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const renderInline = () => (
    <Box 
      className={className}
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        color: `${severity}.main`
      }}
    >
      {getIcon()}
      <Typography variant="body2" color={`${severity}.main`}>
        {errorMessage}
      </Typography>
      {onRetry && (
        <IconButton size="small" onClick={onRetry}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );

  const renderFullscreen = () => (
    <Box
      className={className}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 9999
      }}
    >
      <Card sx={{ maxWidth: 500, m: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ color: `${severity}.main`, mt: 0.5 }}>
              {getIcon()}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" color={`${severity}.main`} gutterBottom>
                {title || getDefaultTitle()}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {errorMessage}
              </Typography>
              {renderActions()}
              {renderDetails()}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  switch (variant) {
    case 'card':
      return renderCard();
    case 'inline':
      return renderInline();
    case 'fullscreen':
      return renderFullscreen();
    case 'alert':
    default:
      return renderAlert();
  }
};

export default ErrorDisplay; 