// src/utils/formatters.js
import { format, formatRelative, differenceInDays, startOfDay, setMonth, isToday, isYesterday, isSameWeek, isSameMonth } from 'date-fns';
import { format as formatTz } from 'date-fns-tz';
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
   * Format a date to display as a relative date (Today, Yesterday, etc.)
   * Using UTC to ensure consistent display across timezones
   * 
   * @param {Date} date - The date to format
   * @returns {string} The formatted relative date
   */
  export const formatRelativeDate = (date) => {
    if (!date) return '';
    
    const jsDate = date instanceof Date ? date : new Date(date);
    
    // Create reference dates in UTC
    const now = new Date();
    const todayInUTC = new Date(formatTz(now, 'yyyy-MM-dd', { timeZone: 'Etc/UTC' }));
    const dateInUTC = new Date(formatTz(jsDate, 'yyyy-MM-dd', { timeZone: 'Etc/UTC' }));
    
    // Compare the UTC dates for relative descriptions
    if (formatTz(dateInUTC, 'yyyy-MM-dd', { timeZone: 'Etc/UTC' }) === 
        formatTz(todayInUTC, 'yyyy-MM-dd', { timeZone: 'Etc/UTC' })) {
      return "Aujourd'hui";
    }
    
    // Calculate yesterday in UTC
    const yesterdayInUTC = new Date(todayInUTC);
    yesterdayInUTC.setDate(yesterdayInUTC.getDate() - 1);
    
    if (formatTz(dateInUTC, 'yyyy-MM-dd', { timeZone: 'Etc/UTC' }) === 
        formatTz(yesterdayInUTC, 'yyyy-MM-dd', { timeZone: 'Etc/UTC' })) {
      return 'Hier';
    }
    
    // For dates in this week, show day name in French
    const dayOfWeek = formatTz(dateInUTC, 'EEEE', { timeZone: 'Etc/UTC', locale: fr });
    const dayMonth = formatTz(dateInUTC, 'd MMMM', { timeZone: 'Etc/UTC', locale: fr });
    
    // Check if date is within 6 days (this week)
    const sixDaysAgoInUTC = new Date(todayInUTC);
    sixDaysAgoInUTC.setDate(sixDaysAgoInUTC.getDate() - 6);
    
    if (dateInUTC >= sixDaysAgoInUTC) {
      // Capitalize first letter of day name in French
      return dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    }
    
    // For dates in this year, show day and month in French
    if (formatTz(dateInUTC, 'yyyy', { timeZone: 'Etc/UTC' }) === 
        formatTz(todayInUTC, 'yyyy', { timeZone: 'Etc/UTC' })) {
      return dayMonth;
    }
    
    // For older dates, show day, month and year in French
    return formatTz(dateInUTC, 'd MMMM yyyy', { timeZone: 'Etc/UTC', locale: fr });
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