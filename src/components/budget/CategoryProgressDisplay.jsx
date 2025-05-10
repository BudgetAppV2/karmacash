import React from 'react';
import styles from './CategoryProgressDisplay.module.css';

function formatCurrency(amount) {
  return amount?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
}

export default function CategoryProgressDisplay({
  categoryName,
  allocatedAmount = 0,
  spentAmount = 0,
  categoryType = 'expense',
  categoryColor,
  currentAllocation,
  onAllocationChange,
  onAllocationSave,
  isSavingAllocation = false,
}) {
  let progress = 0;
  if (allocatedAmount > 0) {
    progress = Math.min((spentAmount / allocatedAmount) * 100, 100);
  } else if (spentAmount > 0) {
    progress = 100;
  }
  
  const remaining = allocatedAmount - spentAmount;
  const isTrulyOverspent = (allocatedAmount > 0 && spentAmount > allocatedAmount) || (allocatedAmount === 0 && spentAmount > 0);

  const RADIUS = 25;
  const STROKE = 8;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const visualProgressPercent = progress;
  const offset = CIRCUM * (1 - visualProgressPercent / 100);

  const displayPercentText = allocatedAmount > 0 || spentAmount > 0 
    ? `${Math.round(visualProgressPercent)}%` 
    : '--';

  return (
    <section 
      className={styles.container}
      aria-label={`Catégorie ${categoryName}`}
      style={{ '--category-card-accent-color': categoryColor || 'transparent' }}
    >
      {isTrulyOverspent && <div className={styles.overspendingDot}></div>}
      
      <div className={styles.topContent}>
        <h3 className={styles.categoryName}>{categoryName}</h3>
        <div className={styles.budgetDetailsRow}>
          <div className={styles.budgetDetailItem}>
            <span className={styles.budgetDetailLabel}>Alloué</span>
            <div className={styles.budgetDetailValuePill}>
              <span className={styles.budgetDetailValue}>{formatCurrency(allocatedAmount)}</span>
            </div>
          </div>
          <div className={styles.budgetDetailItem}>
            <span className={styles.budgetDetailLabel}>Dépensé</span>
            <div className={styles.budgetDetailValuePill}>
              <span className={styles.budgetDetailValue}>{formatCurrency(spentAmount)}</span>
            </div>
          </div>
          <div className={styles.budgetDetailItem}>
            <span className={styles.budgetDetailLabel}>Reste</span>
            <div className={styles.budgetDetailValuePill}>
              <span className={`${styles.budgetDetailValue} ${remaining < 0 ? styles.negativeValue : ''}`}>{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottomControlsRow}>
        <div className={styles.allocationControls}>
          <form className={styles.allocationForm} onSubmit={e => { e.preventDefault(); onAllocationSave?.(); }}>
            <label htmlFor={`allocation-input-${categoryName}`} className={styles.inputLabel}>
              Modifier l'allocation
            </label>
            <div className={styles.inputRow}>
              <input
                id={`allocation-input-${categoryName}`}
                className={styles.allocationInput}
                type="number"
                min="0"
                step="0.01"
                value={currentAllocation}
                onChange={e => onAllocationChange?.(e.target.value)}
                aria-label={`Montant alloué pour ${categoryName}`}
                disabled={isSavingAllocation}
              />
            </div>
            <button
              className={styles.saveButton}
              type="submit"
              disabled={isSavingAllocation}
              aria-busy={isSavingAllocation}
            >
              {isSavingAllocation ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </form>
        </div>

        <div className={styles.progressIndicatorWrapper}>
          <svg
            className={styles.circularProgress}
            width={60}
            height={60}
            viewBox="0 0 60 60"
            aria-label="Progression du budget"
            role="img"
          >
            <circle
              className={styles.progressTrack}
              cx="30"
              cy="30"
              r={RADIUS}
              strokeWidth={STROKE}
              fill="none"
            />
            <circle
              className={styles.progressIndicator}
              cx="30"
              cy="30"
              r={RADIUS}
              strokeWidth={STROKE}
              fill="none"
              stroke={categoryColor || '#cccccc'}
              strokeDasharray={CIRCUM}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              className={styles.progressPercentText}
            >
              {displayPercentText}
            </text>
          </svg>
        </div>
      </div>
    </section>
  );
} 