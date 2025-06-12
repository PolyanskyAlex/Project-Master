import React from 'react';
import { render, screen, fireEvent } from '../utils/test-utils';
import ErrorMessage from '../../components/ErrorMessage';

describe('ErrorMessage', () => {
  it('renders error message', () => {
    const message = 'Something went wrong';
    render(<ErrorMessage message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('renders with retry button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(<ErrorMessage message="Error" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Повторить');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorMessage message="Error" />);
    
    expect(screen.queryByText('Повторить')).not.toBeInTheDocument();
  });

  it('renders error icon', () => {
    render(<ErrorMessage message="Error" />);
    
    // MUI Error icon обычно имеет определенные атрибуты
    const icon = document.querySelector('[data-testid="ErrorIcon"]') || 
                document.querySelector('.MuiSvgIcon-root');
    expect(icon).toBeTruthy();
  });

  it('applies error styling', () => {
    render(<ErrorMessage message="Error" />);
    
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
  });
}); 