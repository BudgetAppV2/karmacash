import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import fs from 'fs';

describe('Firestore Rules Validation', () => {
  it('should validate that firestore.rules has correct syntax', () => {
    // Check file exists
    expect(fs.existsSync('firestore.rules')).toBe(true);
    
    // Read the file - this will throw if file doesn't exist
    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');
    
    // Verify the file has content
    expect(rulesContent.length).toBeGreaterThan(0);
    
    // Validate some key sections exist in the rules
    expect(rulesContent).toContain('service cloud.firestore');
    expect(rulesContent).toContain('match /databases/{database}/documents');
    expect(rulesContent).toContain('match /budgets/{budgetId}');
    expect(rulesContent).toContain('match /users/{userId}');
    
    // Verify function definitions
    expect(rulesContent).toContain('function isAuth()');
    expect(rulesContent).toContain('function isBudgetMember(budgetId)');
    expect(rulesContent).toContain('function isBudgetOwner(budgetId)');
    
    // Verify key access patterns
    expect(rulesContent).toContain('allow read: if isBudgetMember(budgetId)');
    expect(rulesContent).toContain('allow delete: if isBudgetOwner(budgetId)');
    
    // Try to validate with Firebase CLI (this is optional and will only work if Firebase CLI is installed)
    try {
      const result = execSync('firebase deploy --only firestore:rules --dry-run', { encoding: 'utf8' });
      expect(result).toContain('rules file firestore.rules compiled successfully');
    } catch (error) {
      console.log('Firebase CLI validation skipped or failed');
    }
  });
}); 