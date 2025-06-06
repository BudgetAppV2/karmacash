import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SwipeActions from './SwipeActions';

describe('SwipeActions', () => {
  const mockActions = [
    { label: 'Edit', onClick: jest.fn(), className: 'edit' },
    { label: 'Delete', onClick: jest.fn(), className: 'delete' }
  ];

  it('renders children content', () => {
    const { getByText } = render(
      <SwipeActions itemId="test-1" actions={mockActions}>
        <div>Test Content</div>
      </SwipeActions>
    );
    
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('shows actions on swipe', () => {
    const { getByText, container } = render(
      <SwipeActions itemId="test-1" actions={mockActions}>
        <div>Test Content</div>
      </SwipeActions>
    );
    
    const wrapper = container.querySelector('.swipe-actions-wrapper');
    
    // Simulate touch start and move
    fireEvent.touchStart(wrapper, {
      touches: [{ clientX: 100 }]
    });
    
    fireEvent.touchMove(wrapper, {
      touches: [{ clientX: 20 }] // Move 80px left (> threshold)
    });
    
    expect(getByText('Edit')).toBeInTheDocument();
    expect(getByText('Delete')).toBeInTheDocument();
  });
});