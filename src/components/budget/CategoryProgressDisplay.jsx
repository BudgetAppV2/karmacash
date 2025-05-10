import React from 'react';
import styles from './CategoryProgressDisplay.module.css';

function formatCurrency(amount) {
  return amount?.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2 });
}

// Helper for status color and label
function getStatusInfo(progress, isOverspent, isZeroAllocation) {
  if (isOverspent) return { label: 'Dépassement', color: 'var(--color-negative)' };
  if (progress >= 90 && !isZeroAllocation) return { label: 'Presque atteint', color: 'var(--color-warning, #E0B470)' };
  if (progress > 0) return { label: 'En cours', color: 'var(--color-information)' };
  if (isZeroAllocation) return { label: 'Non alloué', color: 'var(--color-border-x-light, #eee)' };
  return { label: 'OK', color: 'var(--color-positive)' };
}

export default function CategoryProgressDisplay({
  categoryName,
  allocatedAmount = 0,
  spentAmount = 0,
  categoryType = 'expense',
  currentAllocation,
  onAllocationChange,
  onAllocationSave,
  isSavingAllocation = false,
}) {
  // Calculate progress and remaining
  const progress = allocatedAmount > 0 ? Math.min((spentAmount / allocatedAmount) * 100, 100) : 0;
  const remaining = allocatedAmount - spentAmount;
  const isOverspent = spentAmount > allocatedAmount;
  const isZeroAllocation = allocatedAmount === 0;
  const statusInfo = getStatusInfo(progress, isOverspent, isZeroAllocation);

  // CIRCULAR PROGRESS (SVG)
  const RADIUS = 22;
  const STROKE = 7;
  const CIRCUM = 2 * Math.PI * RADIUS;
  const offset = CIRCUM * (1 - progress / 100);

  return (
    <section className={styles.container} aria-label={`Catégorie ${categoryName}`}>
      <div className={styles.mainContentRow}>
        <div className={styles.leftContent}>
          <header className={styles.headerRow}>
            <h3 className={styles.categoryName}>{categoryName}</h3>
            <span className={styles.statusBadge} style={{ background: statusInfo.color }}>{statusInfo.label}</span>
          </header>
          <div className={styles.amountsRow}>
            <div className={styles.amountBlock}>
              <span className={styles.amountLabel}>Alloué</span>
              <span className={styles.amountValue}>{formatCurrency(allocatedAmount)}</span>
            </div>
            <div className={styles.amountBlock}>
              <span className={styles.amountLabel}>Dépensé</span>
              <span className={styles.amountValue}>{formatCurrency(spentAmount)}</span>
            </div>
            <div className={styles.amountBlock}>
              <span className={styles.amountLabel}>Reste</span>
              <span className={`${styles.amountValue} ${remaining < 0 ? styles.negative : ''}`}>{formatCurrency(remaining)}</span>
            </div>
          </div>
        </div>
        <div className={styles.progressCol}>
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
              stroke={statusInfo.color}
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
              {allocatedAmount > 0 ? `${Math.round(progress)}%` : '--'}
            </text>
          </svg>
        </div>
      </div>
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
          <button
            className={styles.saveButton}
            type="submit"
            disabled={isSavingAllocation}
            aria-busy={isSavingAllocation}
          >
            {isSavingAllocation ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </section>
  );
} 