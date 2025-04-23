// src/utils/formatters.js
import { format, formatRelative, differenceInDays, startOfDay, setMonth, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

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
   * Format a date in the user's locale using date-fns
   * @param {Date} date - The date to format
   * @param {string} formatStr - The format string for date-fns
   * @returns {string} - Formatted date string
   */
  export const formatDate = (date, formatStr = 'd MMM yyyy') => {
    if (!date) return '';
    
    // Handle Firestore Timestamp objects
    const dateObj = date.toDate ? date.toDate() : date;
    
    return format(dateObj, formatStr, { locale: fr });
  };
  
  /**
   * Format a date as a relative time (today, yesterday, etc.)
   * @param {Date} date - The date to format
   * @returns {string} - Relative date string
   */
  export const formatRelativeDate = (date) => {
    if (!date) return '';
    
    // Handle Firestore Timestamp objects
    const dateObj = date.toDate ? date.toDate() : date;
    
    if (isToday(dateObj)) {
      return "Aujourd'hui";
    } else if (isYesterday(dateObj)) {
      return "Hier";
    } else {
      const days = differenceInDays(new Date(), dateObj);
      if (days > 1 && days < 7) {
        return `Il y a ${days} jours`;
      } else {
        return formatDate(dateObj);
      }
    }
  };
  
  /**
   * Format a month name using date-fns
   * @param {number} month - Month number (0-11)
   * @returns {string} - Month name
   */
  export const formatMonth = (month) => {
    const date = setMonth(new Date(), month);
    return format(date, 'MMMM', { locale: fr });
  };
  
  /**
   * Format a year and month using date-fns
   * @param {number} year - Year
   * @param {number} month - Month number (0-11)
   * @returns {string} - Formatted year and month
   */
  export const formatYearMonth = (year, month) => {
    const date = new Date(year, month);
    return format(date, 'MMMM yyyy', { locale: fr });
  };