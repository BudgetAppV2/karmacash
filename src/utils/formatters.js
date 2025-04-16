// src/utils/formatters.js

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (CAD, USD, EUR)
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currencyCode = 'CAD') => {
    const formatter = new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(amount);
  };
  
  /**
   * Format a date in the user's locale
   * @param {Date} date - The date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date, options = {}) => {
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('fr-CA', defaultOptions).format(date);
  };
  
  /**
   * Format a date as a relative time (today, yesterday, etc.)
   * @param {Date} date - The date to format
   * @returns {string} - Relative date string
   */
  export const formatRelativeDate = (date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateToCheck = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = today.getTime() - dateToCheck.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays > 1 && diffDays < 7) {
      return `Il y a ${Math.floor(diffDays)} jours`;
    } else {
      return formatDate(date);
    }
  };
  
  /**
   * Format a month name
   * @param {number} month - Month number (0-11)
   * @returns {string} - Month name
   */
  export const formatMonth = (month) => {
    const date = new Date();
    date.setMonth(month);
    
    return new Intl.DateTimeFormat('fr-CA', { month: 'long' }).format(date);
  };
  
  /**
   * Format a year and month
   * @param {number} year - Year
   * @param {number} month - Month number (0-11)
   * @returns {string} - Formatted year and month
   */
  export const formatYearMonth = (year, month) => {
    const date = new Date(year, month);
    
    return new Intl.DateTimeFormat('fr-CA', { 
      year: 'numeric', 
      month: 'long' 
    }).format(date);
  };