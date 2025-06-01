/**
 * Budget Selection Hook
 * 
 * Provides the current budget ID for chart data queries
 * This is a temporary solution to get charts working with the budget structure
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase/firebaseInit';

export function useBudget() {
  const { currentUser } = useAuth();
  const [currentBudgetId, setCurrentBudgetId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUserBudget() {
      if (!currentUser?.uid) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get user's budget memberships to find their budget
        const budgetMembershipsQuery = query(
          collection(db, `users/${currentUser.uid}/budgetMemberships`),
          limit(1) // Just get the first budget for now
        );

        const snapshot = await getDocs(budgetMembershipsQuery);
        
        if (!snapshot.empty) {
          const budgetDoc = snapshot.docs[0];
          setCurrentBudgetId(budgetDoc.id);
        } else {
          // No budget found - user might need to create one
          setCurrentBudgetId(null);
        }
      } catch (err) {
        console.error('Error fetching user budget:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserBudget();
  }, [currentUser?.uid]);

  return {
    currentBudgetId,
    isLoading,
    error,
    // Helper to refresh budget data
    refreshBudget: () => {
      if (currentUser?.uid) {
        setIsLoading(true);
        fetchUserBudget();
      }
    }
  };
}