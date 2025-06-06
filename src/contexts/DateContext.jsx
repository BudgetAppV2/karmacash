import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { formatDate } from '../utils/formatters';
import logger from '../services/logger';

/**
 * DateContext provides global date management for the application.
 * Maintains consistent date ranges across Transactions, Categories, and future Graphs pages.
 * 
 * Core features:
 * - Week and Month view modes
 * - Date range calculation (Sunday-Saturday for weeks)
 * - Session-based persistence of selected dates
 * - Navigation functions for previous/next periods
 */
const DateContext = createContext();

export const useDateRange = () => {
  const context = useContext(DateContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateProvider');
  }
  return context;
};

export const DateProvider = ({ children }) => {
  // State for view mode (week or month)
  const [viewMode, setViewMode] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calculate date range based on view mode
  const { startDate, endDate } = useMemo(() => {
    const date = new Date(currentDate);
    let start, end;
    
    if (viewMode === 'week') {
      // Set to beginning of the week (Sunday)
      const day = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      start = new Date(date);
      start.setDate(date.getDate() - day); // Go back to Sunday
      start.setHours(0, 0, 0, 0);
      
      // Set to end of the week (Saturday)
      end = new Date(start);
      end.setDate(start.getDate() + 6); // Go forward to Saturday
      end.setHours(23, 59, 59, 999);
    } else {
      // For month view, include all days shown in the calendar grid (including adjacent months)
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      // Use weekStartsOn: 1 to match the calendar's Monday start
      start = startOfWeek(monthStart, { weekStartsOn: 1 });
      end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    }
    
    return { startDate: start, endDate: end };
  }, [currentDate, viewMode]);
  
  // Log date range changes
  useEffect(() => {
    logger.debug('DateContext', 'calculateDateRange', 'Date range calculated', {
      viewMode,
      startDate,
      endDate,
      currentDate
    });
  }, [startDate, endDate, viewMode, currentDate]);
  
  // Navigate to previous period
  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    
    setCurrentDate(newDate);
    
    logger.debug('DateContext', 'handlePrevious', 'Navigated to previous period', {
      viewMode,
      newDate
    });
  };
  
  // Navigate to next period
  const handleNext = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
    
    logger.debug('DateContext', 'handleNext', 'Navigated to next period', {
      viewMode,
      newDate
    });
  };
  
  // Navigate to today
  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    
    logger.debug('DateContext', 'handleToday', 'Navigated to today', {
      today
    });
  };
  
  // Format period label based on view mode
  const formatPeriodLabel = () => {
    if (viewMode === 'week') {
      return `${formatDate(startDate, 'd MMM yyyy')} - ${formatDate(endDate, 'd MMM yyyy')}`;
    } else {
      const monthYear = formatDate(startDate, 'MMMM yyyy');
      // Capitalize first letter for French month names
      return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
    }
  };
  
  // Context value with all date management functionality
  const value = {
    // State
    viewMode,
    currentDate,
    startDate,
    endDate,
    
    // Setters
    setViewMode,
    setCurrentDate,
    
    // Navigation
    handlePrevious,
    handleNext,
    handleToday,
    
    // Utilities
    formatPeriodLabel
  };
  
  return (
    <DateContext.Provider value={value}>
      {children}
    </DateContext.Provider>
  );
};