import React from 'react';
import { formatCurrency } from '../../../utils/formatters';
import styles from './BudgetPageHeader.module.css';
import cn from '../../../utils/cn';

// Simple Card component
const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg shadow-md", className)} {...props}>
    {children}
  </div>
));
Card.displayName = "Card";

// Sticky Header Card component
const StickyHeaderCard = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          "sticky top-0 z-10 backdrop-blur-md rounded-lg shadow-md",
          styles.stickyHeader,
          className
        )}
        data-sticky-header="true"
        {...props}
      >
        {children}
      </Card>
    );
  }
);
StickyHeaderCard.displayName = "StickyHeaderCard";

// Icons used in the header
const ChevronLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" className="w-5 h-5">
    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20" className="w-5 h-5">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

/**
 * BudgetPageHeader component - A sticky header with frosted glass effect for the Budget Page
 * @param {Object} props - Component props
 * @param {string} props.userName - User's name
 * @param {string} props.currentMonthString - Current month display string (e.g., "mai 2025")
 * @param {Function} props.onPreviousMonth - Function to navigate to previous month
 * @param {Function} props.onNextMonth - Function to navigate to next month
 * @param {number} props.solde - Overall balance (global account balance)
 * @param {number} props.revenuTotal - Total revenue
 * @param {number} props.totalDepensesFixes - Total fixed expenses
 * @param {number} props.disponibleAAllouer - Available funds to allocate
 * @param {number} props.totalAlloue - Total allocated amount
 * @param {number} props.resteAAllouer - Remaining to allocate
 * @param {number} props.totalDepense - Total expenses
 * @param {number} props.epargneDuMois - Monthly savings
 * @param {string} props.resteAAllouerStatusStyle - Class for RAA styling based on status
 * @param {number} props.rolloverAmount - Rollover amount
 * @returns {JSX.Element} Rendered component
 */
function BudgetPageHeader({
  userName = "Judith", // Default value
  budgetName = "Mon Budget",
  currentMonthString,
  onPreviousMonth,
  onNextMonth,
  solde,
  revenuTotal,
  totalDepensesFixes,
  disponibleAAllouer,
  totalAlloue,
  resteAAllouer,
  totalDepense,
  epargneDuMois,
  resteAAllouerStatusStyle,
  rolloverAmount,
}) {
  // Helper function to determine text color for RAA
  const getRaaTextColorClass = () => {
    if (resteAAllouerStatusStyle.includes('raaNegative')) return 'text-red-600';
    if (resteAAllouerStatusStyle.includes('raaPositive')) return 'text-emerald-600';
    if (resteAAllouerStatusStyle.includes('raaApproachingZero')) return 'text-amber-600';
    return 'text-gray-800';
  };

  // Function to render a metric item with consistent styling
  const renderMetricItem = (label, value, isRAA = false, extraContent = null, additionalClasses = {}) => (
    <div className={cn("flex flex-col items-center", additionalClasses.container)}>
      <span className="text-xs sm:text-sm font-medium text-gray-500 mb-1 font-serif">
        {label}
      </span>
      <div className="bg-gray-50/90 border border-gray-100 px-2.5 py-0.5 sm:py-1 rounded-full shadow-sm w-full text-center">
        <span className={cn(
          "text-xs sm:text-sm font-semibold font-sans",
          isRAA ? getRaaTextColorClass() : "text-gray-800",
          additionalClasses.value
        )}>
          {value}
        </span>
      </div>
      {extraContent}
    </div>
  );

  return (
    <StickyHeaderCard className="mb-4">
      <div className="p-2.5 sm:p-3 flex flex-col gap-2 sm:gap-3">
        {/* Month Navigator Section */}
        <div className="flex items-center justify-center py-0.5">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <button 
              onClick={onPreviousMonth} 
              className="p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#919A7F] focus:ring-offset-1 transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-600 font-serif">{userName}</span>
              <span className="text-base sm:text-lg font-medium text-gray-800 min-w-[120px] sm:min-w-[150px] text-center">
                {currentMonthString}
              </span>
            </div>
            <button 
              onClick={onNextMonth}
              className="p-1.5 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#919A7F] focus:ring-offset-1 transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRightIcon />
            </button>
          </div>
          
          {/* Subtle Solde Display (if it represents a global account balance) */}
          {solde !== undefined && solde !== epargneDuMois && (
            <div className="ml-auto text-right">
              <span className="text-xs text-gray-500 font-serif">Solde</span>
              <div className="text-xs sm:text-sm font-medium text-gray-600">{formatCurrency(solde)}</div>
            </div>
          )}
        </div>

        {/* Financial Metrics Section */}
        <div className={cn("grid grid-cols-2 gap-2 sm:gap-3", styles.metricsGrid)}>
          {/* Revenu Total */}
          {renderMetricItem("Revenu Total", formatCurrency(revenuTotal))}
          
          {/* Total Dépenses Fixes */}
          {renderMetricItem("Total Dépenses Fixes", formatCurrency(totalDepensesFixes))}
          
          {/* Disponible à Allouer */}
          {renderMetricItem(
            "Disponible à Allouer", 
            formatCurrency(disponibleAAllouer),
            false,
            rolloverAmount !== undefined && rolloverAmount !== 0 && (
              <span className="text-xs text-gray-400 mt-0.5 font-serif">
                (Dont report: {formatCurrency(rolloverAmount)})
              </span>
            )
          )}
          
          {/* Total Alloué */}
          {renderMetricItem("Total Alloué", formatCurrency(totalAlloue))}
          
          {/* Reste à Allouer */}
          {renderMetricItem("Reste à Allouer", formatCurrency(resteAAllouer), true)}
          
          {/* Total Dépensé */}
          {renderMetricItem("Total Dépensé", formatCurrency(totalDepense))}
          
          {/* Épargne du Mois */}
          {renderMetricItem(
            "Épargne du Mois", 
            formatCurrency(epargneDuMois), 
            false, 
            null,
            { container: cn("col-span-2", styles.savingsMetric) }
          )}
        </div>
      </div>
    </StickyHeaderCard>
  );
}

export default BudgetPageHeader; 