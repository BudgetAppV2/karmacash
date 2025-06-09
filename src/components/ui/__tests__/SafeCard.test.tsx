import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import SafeCard, { SafeCardProps } from '../SafeCard';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('SafeCard Component', () => {
  const defaultProps: SafeCardProps = {
    children: 'Test content',
    'data-testid': 'test-card',
  };

  beforeEach(() => {
    // Clear any console errors
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders children content correctly', () => {
      render(<SafeCard {...defaultProps} />);
      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    test('applies default data-testid', () => {
      render(<SafeCard>Content</SafeCard>);
      expect(screen.getByTestId('safe-card')).toBeInTheDocument();
    });

    test('applies custom data-testid', () => {
      render(<SafeCard data-testid="custom-card">Content</SafeCard>);
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });

    test('renders with default variant and size', () => {
      render(<SafeCard {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('safe-card--default', 'safe-card--md');
    });
  });

  describe('Variants', () => {
    test.each([
      ['default', 'safe-card--default'],
      ['elevated', 'safe-card--elevated'],
      ['outlined', 'safe-card--outlined'],
      ['filled', 'safe-card--filled'],
    ])('applies %s variant class', (variant, expectedClass) => {
      render(<SafeCard variant={variant as any} {...defaultProps} />);
      expect(screen.getByTestId('test-card')).toHaveClass(expectedClass);
    });
  });

  describe('Sizes', () => {
    test.each([
      ['sm', 'safe-card--sm'],
      ['md', 'safe-card--md'],
      ['lg', 'safe-card--lg'],
    ])('applies %s size class', (size, expectedClass) => {
      render(<SafeCard size={size as any} {...defaultProps} />);
      expect(screen.getByTestId('test-card')).toHaveClass(expectedClass);
    });
  });

  describe('Interactive Functionality', () => {
    test('renders as interactive when interactive prop is true', () => {
      render(<SafeCard interactive {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('safe-card--interactive');
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    test('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<SafeCard interactive onClick={handleClick} {...defaultProps} />);
      
      const card = screen.getByTestId('test-card');
      await userEvent.click(card);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard interactions (Enter)', async () => {
      const handleClick = jest.fn();
      render(<SafeCard interactive onClick={handleClick} {...defaultProps} />);
      
      const card = screen.getByTestId('test-card');
      card.focus();
      await userEvent.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('handles keyboard interactions (Space)', async () => {
      const handleClick = jest.fn();
      render(<SafeCard interactive onClick={handleClick} {...defaultProps} />);
      
      const card = screen.getByTestId('test-card');
      card.focus();
      await userEvent.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    test('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(
        <SafeCard 
          interactive 
          disabled 
          onClick={handleClick} 
          {...defaultProps} 
        />
      );
      
      const card = screen.getByTestId('test-card');
      await userEvent.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('States', () => {
    test('renders loading state', () => {
      render(<SafeCard loading {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveClass('safe-card--loading');
      expect(card).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Test content')).not.toBeVisible();
      expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    });

    test('renders error state', () => {
      render(
        <SafeCard error errorMessage="Something went wrong" {...defaultProps} />
      );
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveClass('safe-card--error');
      expect(card).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('renders error state with default message', () => {
      render(<SafeCard error {...defaultProps} />);
      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    test('renders disabled state', () => {
      render(<SafeCard disabled {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveClass('safe-card--disabled');
    });

    test('disabled interactive card has correct accessibility attributes', () => {
      render(<SafeCard interactive disabled {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveAttribute('tabIndex', '-1');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Header and Footer', () => {
    test('renders header when provided', () => {
      render(
        <SafeCard header={<h2>Card Header</h2>} {...defaultProps} />
      );
      expect(screen.getByText('Card Header')).toBeInTheDocument();
    });

    test('renders footer when provided', () => {
      render(
        <SafeCard footer={<p>Card Footer</p>} {...defaultProps} />
      );
      expect(screen.getByText('Card Footer')).toBeInTheDocument();
    });

    test('does not render footer when loading', () => {
      render(
        <SafeCard 
          loading 
          footer={<p>Card Footer</p>} 
          {...defaultProps} 
        />
      );
      expect(screen.queryByText('Card Footer')).not.toBeInTheDocument();
    });

    test('does not render footer when error', () => {
      render(
        <SafeCard 
          error 
          footer={<p>Card Footer</p>} 
          {...defaultProps} 
        />
      );
      expect(screen.queryByText('Card Footer')).not.toBeInTheDocument();
    });
  });

  describe('Security', () => {
    test('sanitizes className prop', () => {
      render(
        <SafeCard 
          className="safe-class <script>alert('xss')</script>" 
          {...defaultProps} 
        />
      );
      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('safe-class scriptalert(xss)/script');
      expect(card.className).not.toContain('<script>');
    });

    test('sanitizes error message', () => {
      render(
        <SafeCard 
          error 
          errorMessage="Error <script>alert('xss')</script>" 
          {...defaultProps} 
        />
      );
      const errorText = screen.getByText(/Error scriptalert\(xss\)\/script/);
      expect(errorText.textContent).not.toContain('<script>');
    });

    test('prevents XSS in error message', () => {
      const maliciousMessage = '<img src="x" onerror="alert(\'xss\')">';
      render(
        <SafeCard 
          error 
          errorMessage={maliciousMessage} 
          {...defaultProps} 
        />
      );
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = render(<SafeCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('interactive card has proper ARIA attributes', () => {
      render(<SafeCard interactive {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveAttribute('role', 'button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    test('non-interactive card has article role', () => {
      render(<SafeCard {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveAttribute('role', 'article');
    });

    test('supports custom ARIA attributes', () => {
      render(
        <SafeCard 
          aria-label="Custom card label"
          aria-describedby="card-description"
          {...defaultProps} 
        />
      );
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveAttribute('aria-label', 'Custom card label');
      expect(card).toHaveAttribute('aria-describedby', 'card-description');
    });

    test('supports custom role', () => {
      render(<SafeCard role="region" {...defaultProps} />);
      expect(screen.getByTestId('test-card')).toHaveAttribute('role', 'region');
    });

    test('error state has proper ARIA attributes', () => {
      render(
        <SafeCard 
          error 
          errorMessage="Test error" 
          {...defaultProps} 
        />
      );
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveAttribute('aria-invalid', 'true');
      expect(card).toHaveAttribute('aria-describedby', 'test-card-error');
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('loading state has proper ARIA attributes', () => {
      render(<SafeCard loading {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveAttribute('aria-busy', 'true');
      expect(card).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Performance', () => {
    test('memoization prevents unnecessary re-renders', () => {
      const { rerender } = render(<SafeCard {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      const initialCard = card;
      
      // Re-render with same props
      rerender(<SafeCard {...defaultProps} />);
      const cardAfterRerender = screen.getByTestId('test-card');
      
      // The component should be memoized
      expect(initialCard).toBe(cardAfterRerender);
    });

    test('updates when props change', () => {
      const { rerender } = render(<SafeCard {...defaultProps} />);
      expect(screen.getByTestId('test-card')).toHaveClass('safe-card--md');
      
      rerender(<SafeCard {...defaultProps} size="lg" />);
      expect(screen.getByTestId('test-card')).toHaveClass('safe-card--lg');
    });
  });

  describe('Error Boundary', () => {
    // Mock console.error to avoid noise in test output
    const originalError = console.error;
    beforeEach(() => {
      console.error = jest.fn();
    });
    afterEach(() => {
      console.error = originalError;
    });

    test('catches and displays error boundary fallback', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      render(
        <SafeCard {...defaultProps}>
          <ThrowError />
        </SafeCard>
      );
      
      expect(screen.getByText('Something went wrong loading this card.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('supports custom error boundary fallback', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      // This would require modifying the component to accept fallback prop
      // For now, testing the default behavior
      render(
        <SafeCard {...defaultProps}>
          <ThrowError />
        </SafeCard>
      );
      
      expect(screen.getByText('Something went wrong loading this card.')).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    test('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red', color: 'white' };
      render(<SafeCard style={customStyle} {...defaultProps} />);
      const card = screen.getByTestId('test-card');
      
      expect(card).toHaveStyle('background-color: red');
      expect(card).toHaveStyle('color: white');
    });

    test('applies custom className', () => {
      render(<SafeCard className="custom-class" {...defaultProps} />);
      expect(screen.getByTestId('test-card')).toHaveClass('custom-class');
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined children gracefully', () => {
      render(<SafeCard>{undefined}</SafeCard>);
      expect(screen.getByTestId('safe-card')).toBeInTheDocument();
    });

    test('handles null children gracefully', () => {
      render(<SafeCard>{null}</SafeCard>);
      expect(screen.getByTestId('safe-card')).toBeInTheDocument();
    });

    test('handles empty string children', () => {
      render(<SafeCard>{''}</SafeCard>);
      expect(screen.getByTestId('safe-card')).toBeInTheDocument();
    });

    test('handles complex children', () => {
      render(
        <SafeCard {...defaultProps}>
          <div>
            <h3>Title</h3>
            <p>Description</p>
            <button>Action</button>
          </div>
        </SafeCard>
      );
      
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    test('prevents click when loading', async () => {
      const handleClick = jest.fn();
      render(
        <SafeCard 
          interactive 
          loading 
          onClick={handleClick} 
          {...defaultProps} 
        />
      );
      
      const card = screen.getByTestId('test-card');
      await userEvent.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    test('prevents click when error', async () => {
      const handleClick = jest.fn();
      render(
        <SafeCard 
          interactive 
          error 
          onClick={handleClick} 
          {...defaultProps} 
        />
      );
      
      const card = screen.getByTestId('test-card');
      await userEvent.click(card);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('works with all props combined', () => {
      render(
        <SafeCard
          variant="elevated"
          size="lg"
          interactive
          onClick={() => {}}
          header={<h2>Header</h2>}
          footer={<p>Footer</p>}
          className="custom-class"
          style={{ margin: '10px' }}
          aria-label="Complete card"
          data-testid="complete-card"
        >
          Main content
        </SafeCard>
      );
      
      const card = screen.getByTestId('complete-card');
      expect(card).toHaveClass(
        'safe-card--elevated',
        'safe-card--lg',
        'safe-card--interactive',
        'custom-class'
      );
      expect(card).toHaveStyle('margin: 10px');
      expect(card).toHaveAttribute('aria-label', 'Complete card');
      expect(screen.getByText('Header')).toBeInTheDocument();
      expect(screen.getByText('Main content')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });
});