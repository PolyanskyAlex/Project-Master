import React from 'react';
import { render, screen } from '../utils/test-utils';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders spinner variant by default', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    const message = 'Loading data...';
    render(<LoadingSpinner message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders linear variant', () => {
    render(<LoadingSpinner variant="linear" />);
    
    const linearProgress = screen.getByRole('progressbar');
    expect(linearProgress).toBeInTheDocument();
  });

  it('renders skeleton variant', () => {
    render(<LoadingSpinner variant="skeleton" />);
    
    // Skeleton рендерит несколько элементов, проверяем по классу MUI
    const container = screen.getByText('Загрузка...').closest('div');
    expect(container).toBeInTheDocument();
  });

  it('renders overlay variant', () => {
    render(<LoadingSpinner overlay />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    // Проверяем, что контейнер имеет absolute позиционирование
    const container = spinner.closest('[style*="position: absolute"]');
    expect(container).toBeInTheDocument();
  });

  it('renders inline variant', () => {
    render(<LoadingSpinner variant="inline" />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    // Inline вариант имеет меньший размер
    expect(spinner).toHaveAttribute('style', expect.stringContaining('20px'));
  });

  it('applies custom size', () => {
    render(<LoadingSpinner size={60} />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    // MUI CircularProgress применяет размер через style
    expect(spinner).toHaveAttribute('style', expect.stringContaining('60px'));
  });

  it('shows fullscreen overlay when fullScreen prop is true', () => {
    render(<LoadingSpinner fullScreen />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    // Проверяем, что контейнер имеет fixed позиционирование
    const container = spinner.closest('[style*="position: fixed"]');
    expect(container).toBeInTheDocument();
  });

  it('renders linear progress with determinate value', () => {
    render(<LoadingSpinner variant="linear" progress={50} />);
    
    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('renders custom number of skeleton lines', () => {
    render(<LoadingSpinner variant="skeleton" skeletonLines={5} />);
    
    // Skeleton не рендерит сообщение, проверяем наличие контейнера
    const container = document.querySelector('[data-testid="skeleton-container"]') || 
                     document.querySelector('.MuiSkeleton-root');
    expect(container).toBeTruthy();
  });
}); 