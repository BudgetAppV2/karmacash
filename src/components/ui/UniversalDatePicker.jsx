import React from 'react';
import { useDateRange } from '../../contexts/DateContext';

/**
 * UniversalDatePicker - Reusable date range selector component
 * 
 * Features:
 * - Week/Month view mode toggle
 * - Previous/Next navigation buttons
 * - Displays formatted date range
 * - Integrated with global DateContext
 * - Consistent styling with KarmaCash design system
 * 
 * @param {Object} props
 * @param {boolean} props.showViewModeToggle - Whether to show week/month toggle (default: true)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const UniversalDatePicker = ({ 
  showViewModeToggle = true,
  className = '',
  style = {}
}) => {
  const {
    viewMode,
    setViewMode,
    handlePrevious,
    handleNext,
    formatPeriodLabel
  } = useDateRange();
  
  // Theme colors from Zen/Tranquility palette
  const primaryColor = '#919A7F'; // Sage green
  const borderColor = '#e9ecef';
  const textColor = '#717171';
  const hoverColor = '#88837A';
  
  return (
    <div 
      className={`universal-date-picker ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        ...style
      }}
    >
      {/* View Mode Toggle */}
      {showViewModeToggle && (
        <div 
          className="view-mode-toggle"
          style={{
            display: 'flex',
            borderRadius: '6px',
            overflow: 'hidden',
            border: `1px solid ${borderColor}`,
            width: '100%',
            maxWidth: '250px'
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode('week')}
            aria-label="Afficher par semaine"
            aria-pressed={viewMode === 'week'}
            style={{
              padding: '8px 12px',
              flex: '1 1 50%',
              backgroundColor: viewMode === 'week' ? primaryColor : 'white',
              color: viewMode === 'week' ? 'white' : '#2F2F2F',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Semaine
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            aria-label="Afficher par mois"
            aria-pressed={viewMode === 'month'}
            style={{
              padding: '8px 12px',
              flex: '1 1 50%',
              backgroundColor: viewMode === 'month' ? primaryColor : 'white',
              color: viewMode === 'month' ? 'white' : '#2F2F2F',
              border: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
          >
            Mois
          </button>
        </div>
      )}
      
      {/* Period Navigation */}
      <div
        className="period-controls"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          gap: '16px'
        }}
      >
        <button
          type="button"
          onClick={handlePrevious}
          aria-label={viewMode === 'week' ? 'Semaine précédente' : 'Mois précédent'}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: `1px solid ${borderColor}`,
            borderRadius: '50%',
            cursor: 'pointer',
            color: hoverColor,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = primaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = borderColor;
          }}
        >
          ←
        </button>
        
        <div
          className="period-label"
          style={{
            fontSize: '0.9rem',
            fontWeight: 500,
            color: textColor,
            minWidth: '200px',
            textAlign: 'center'
          }}
        >
          {formatPeriodLabel()}
        </div>
        
        <button
          type="button"
          onClick={handleNext}
          aria-label={viewMode === 'week' ? 'Semaine suivante' : 'Mois suivant'}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
            border: `1px solid ${borderColor}`,
            borderRadius: '50%',
            cursor: 'pointer',
            color: hoverColor,
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f8f9fa';
            e.currentTarget.style.borderColor = primaryColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = borderColor;
          }}
        >
          →
        </button>
      </div>
    </div>
  );
};

export default UniversalDatePicker;