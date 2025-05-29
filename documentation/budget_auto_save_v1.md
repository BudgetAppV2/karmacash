# Budget Allowance Auto-Save Mechanism v1

## Overview
This document details the technical specification for the budget allowance auto-save feature in the KarmaCash PWA. It covers the Firestore schema, data flow, implementation details, and user feedback mechanisms designed to provide a seamless and intuitive user experience.

## 1. Firestore Schema for Budget Allowances

This section outlines the Firestore schema relevant to storing user budget category allowances, particularly focusing on how it supports the auto-save mechanism.

### 1.1. Core Document Path

User-specific budget allocations for a given month are stored within a document in the `monthlyData` subcollection of a budget.

-   **Path**: `budgets/{budgetId}/monthlyData/{yyyy-mm}`
    -   `{budgetId}`: The unique identifier of the budget.
    -   `{yyyy-mm}`: The year and month string (e.g., "2025-07") representing the specific budget period. This also serves as the document ID.

### 1.2. `allocations` Map

Within each `monthlyData/{yyyy-mm}` document, the `allocations` field is a map that stores the allocated amounts for each budget category.

-   **Field Name**: `allocations`
-   **Type**: `Map<String, Number>`
-   **Description**: This map holds the user-defined financial allocations for various budget categories for the specified month.
-   **Structure**:
    -   **Key**: `categoryId` (String) - The unique identifier of a budget category, corresponding to a document ID in the `/budgets/{budgetId}/categories/` subcollection.
    -   **Value**: `allocatedAmount` (Number) - The monetary amount allocated to the category. This value must be non-negative.

### 1.3. Key Fields in `monthlyData` for Auto-Save

The following fields within the `monthlyData/{yyyy-mm}` document are particularly relevant to the auto-save functionality for allocations:

| Field             | Type      | Description                                                                                                                              | Auto-Save Impact                                                                                                |
| :---------------- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------- |
| `allocations`     | Map       | As described in section 1.2. This is the primary target of the auto-save operation for budget allowances.                                | Modified directly by auto-save operations.                                                                      |
| `updatedAt`       | Timestamp | Firestore server timestamp indicating the last modification time of the `monthlyData` document.                                          | Updated automatically by Firestore to `serverTimestamp()` on every successful auto-save of allocation changes.  |
| `lastEditedByUserId` | String    | (Nullable) The Firestore UID of the user who last made changes to this document, including changes made via auto-save.                  | Updated with the UID of the active user whose interaction triggered the auto-save, if provided during the update. |

*Refer to [B5.2 Collections & Schemas](mdc:docs/B5.2_Collections_Schemas.md) for the complete schema of the `monthlyData` document.*

### 1.4. Validation Rules and Constraints

-   **Non-Negative Allocations**: Values (`allocatedAmount`) within the `allocations` map must be greater than or equal to zero. This is typically enforced by client-side validation and service-layer checks (see `updateAllocation` in `budgetService.js`).
-   **Category Existence**: Each `categoryId` used as a key in the `allocations` map should correspond to an existing category document in the `/budgets/{budgetId}/categories/` subcollection. While not a direct Firestore schema constraint on the map keys themselves, this is a crucial application-level integrity rule.
-   **Data Types**: Adherence to specified data types (String for keys, Number for values) is essential.

### 1.5. Example `allocations` Map Structure

Below is an example snippet of how the `allocations` map might look within a `monthlyData` document (e.g., `budgets/budget123/monthlyData/2025-07`):

```json
{
  // ... other monthlyData fields (budgetId, month, year, calculated, createdAt)
  "allocations": {
    "cat_food_groceries": 550.75,
    "cat_transport_gas": 120.00,
    "cat_housing_rent": 1200.00,
    "cat_utilities_internet": 75.50,
    "cat_personal_fun": 0 // Explicitly allocated zero
  },
  "updatedAt": { "_seconds": 1716500000, "_nanoseconds": 0 },
  "lastEditedByUserId": "userABC123"
  // ...
}
```

### 1.6. Integrity Constraints & Relationships

-   **Link to Categories**: The `allocations` map is intrinsically linked to the `categories` subcollection. The validity and meaning of each entry in `allocations` depend on the existence and definition of the corresponding category.
-   **Impact on Calculations**: Changes to the `allocations` map (e.g., via auto-save) directly influence calculated fields within the `monthlyData.calculated` map, such as `totalAllocated` and `remainingToAllocate`. The `updateAllocation` function in `budgetService.js` sets the initial `totalAllocated` when a new `monthlyData` document is created. Subsequent recalculations are typically triggered by calling the `recalculateBudget` Cloud Function (see [B6.1 Budget Calculations Logic](mdc:docs/B6.1_Budget_Calculations_Logic.md) - *Note: Link to B6.1 to be created if it doesn't exist*).

### 1.7. Auto-Save Mechanism Impact on Schema Fields

The auto-save mechanism for budget allowances primarily interacts with the following:

-   It directly modifies the `allocations` map by updating the numerical value associated with a specific `categoryId` key.
-   Each successful auto-save operation triggers an update to the `updatedAt` field of the `monthlyData` document to the current server timestamp.
-   If the user's ID is provided during the auto-save operation (as it is in `updateAllocation` via the optional `userId` parameter), the `lastEditedByUserId` field is updated, providing an audit trail for who triggered the last modification.

This schema structure, particularly the `allocations` map and the `updatedAt` timestamp, provides a robust and efficient way to store and manage user budget allocations while supporting a responsive auto-save feature.

## 2. Data Flow for Budget Allowance Auto-Save

This section describes the end-to-end data flow for the budget allowance auto-save feature, from the user's interaction in the UI to the data persistence in Firestore.

### 2.1. UI Event Triggers

The auto-save process is initiated by user interactions with budget allocation controls. Key UI components and events include:

-   **Numeric Input**: Modifying the value in the numeric input field associated with a category's allocation (e.g., within `CategoryProgressDisplay.jsx`).
    -   **Event**: The `onChange` event of the `<input type="number">`.
    -   **Handler**: This event typically triggers a callback function (e.g., `baseOnNumericInputChange` passed to `CategoryProgressDisplay.jsx`) in the parent component, updating the local state representing the allocation being edited.
-   **Allocation Slider**: Adjusting the allocation amount using a slider component (e.g., `AllocationSlider.jsx`).
    -   **Event**: The `onChange` event of the slider.
    -   **Handler**: Similar to the numeric input, this triggers a callback (e.g., `baseOnSliderChange`) in the parent component, updating the local state.

These interactions signal a change in the desired allocation for a specific category.

### 2.2. Debounced Save Mechanism

To prevent excessive Firestore writes during rapid user input (e.g., typing multiple digits or dragging a slider), a debouncing mechanism is employed.

-   **Concept**: Debouncing ensures that the save operation is only triggered after a certain period of inactivity (e.g., 1-2 seconds) since the last user input modifying an allocation.
-   **Implementation**: This is typically handled in the parent component managing the allocation state or within a dedicated custom hook (e.g., a conceptual `useBudgetAutoSave` hook, as suggested in the handoff, or similar logic within the `BudgetPage` component).
    -   When `baseOnNumericInputChange` or `baseOnSliderChange` are called, instead of immediately saving, they update a local 'dirty' or 'editing' state for the specific category's allocation.
    -   A debounced function is then invoked. If further changes occur before the debounce timer expires, the timer is reset.
    -   Once the timer successfully completes, the debounced function proceeds to call the actual save logic (e.g., invoking `baseOnAllocationSave` or directly calling the `updateAllocation` service).
-   **Timing**: A delay of **1-2 seconds** is generally a good balance, providing responsiveness without overwhelming the backend.

### 2.3. Data Payload Structure

When the (debounced) save operation is triggered, a data payload is prepared to be sent to the backend service for updating the allocation in Firestore. This payload is primarily consumed by the `updateAllocation` function in `src/services/firebase/budgetService.js`.

-   **Key Fields**:
    -   `budgetId` (String): The ID of the current budget.
    -   `monthString` (String): The month identifier in "YYYY-MM" format (e.g., "2025-07").
    -   `categoryId` (String): The ID of the category whose allocation is being updated.
    -   `newAmount` (Number): The new numerical allocation amount. This value should be validated to be non-negative before being sent.
    -   `userId` (String, Optional): The UID of the user performing the action, used for `lastEditedByUserId` in Firestore.

### 2.4. Backend Processing Flow (Client-Side Service)

The `updateAllocation` function in `src/services/firebase/budgetService.js` handles the persistence of the allocation change. Since this is a client-side service directly interacting with Firestore, the "backend" processing occurs within the user's browser environment.

1.  **Input Validation**: The function first validates its inputs (`budgetId`, `monthString`, `categoryId`, `newAmount`).
2.  **Document Reference**: It constructs a Firestore document reference to `budgets/{budgetId}/monthlyData/{monthString}`.
3.  **Document Check & Update/Set**:
    -   It checks if the `monthlyData` document for the given month already exists using `getDoc`.
    -   **If Exists**: It calls `updateDoc` to update the existing document. Specifically, it updates:
        -   `allocations.${categoryId}`: Sets the new allocation amount for the specified category using dot notation.
        -   `updatedAt`: Sets to `serverTimestamp()`.
        -   `lastEditedByUserId`: Sets to the provided `userId` (or `null`).
    -   **If Not Exists**: It calls `setDoc` to create a new `monthlyData` document. The initial data includes:
        -   `budgetId`, `month`, `year`.
        -   `allocations`: A new map with the current `categoryId` and `newAmount`.
        -   `calculated`: An initial structure for calculated values (e.g., `totalAllocated` set to `newAmount`).
        -   `createdAt`, `updatedAt`: Set to `serverTimestamp()`.
        -   `lastEditedByUserId`: Sets to the provided `userId` (or `null`).

*Refer to [B4.3 Backend Functions](mdc:docs/B4.3_Backend_Functions.md) for general backend interaction patterns, although `updateAllocation` is a client-side service.* 

### 2.5. Impact on Calculated Fields

The auto-save of an individual allocation via `updateAllocation` has a direct, but limited, impact on calculated fields within the `monthlyData` document at the moment of the save:

-   **Direct Impact**: If a new `monthlyData` document is created by `updateAllocation`, the `calculated.totalAllocated` field is initialized with the `newAmount` of the saved allocation.
-   **Indirect Impact & Recalculation**: For comprehensive updates to all calculated fields (e.g., `totalAllocated` considering all categories, `remainingToAllocate`, `monthlySavings`, etc.), a separate recalculation process is necessary. This is typically handled by the `recalculateBudget` Cloud Function (as outlined in [B6.1 Budget Calculations Logic](mdc:docs/B6.1_Budget_Calculations_Logic.md)).
    -   The auto-save of an allocation itself does not trigger this full recalculation. It's expected that the `recalculateBudget` function is called at appropriate times (e.g., after a series of auto-saves, or when navigating away from the budget page) to ensure all calculated figures are accurate.

### 2.6. Future Multi-User Considerations

The current data flow for auto-save is primarily designed with a single-user context in mind.

-   **Current State**: The `lastEditedByUserId` field and `updatedAt` timestamp provide a basic audit trail. Firestore's default behavior for concurrent updates to the same document is "last write wins."
-   **Future Enhancements (Post-MVP)**: For a shared budget scenario with multiple active users, more sophisticated conflict resolution mechanisms might be needed if simultaneous auto-saves occur. This could involve:
    -   Using Firestore transactions for more complex updates.
    -   Implementing a merge strategy based on timestamps or deltas.
    -   Providing UI feedback to users about concurrent edits.
    These considerations are beyond the scope of the initial auto-save implementation but are important for future scalability in a collaborative environment.

### 2.7. Mermaid Data Flow Diagram

```mermaid
graph TD
    A[User interacts with Allocation Input/Slider in UI e.g., CategoryProgressDisplay.jsx] --> B{Dirty State Update};
    B --> C{Debounce Timer (1-2s)};
    C -- Timer Elapsed --> D[Prepare Payload: budgetId, monthString, categoryId, newAmount, userId];
    D --> E[Call budgetService.updateAllocation(payload)];
    E --> F{Firestore Interaction};
    F -- Document Exists? --> G[updateDoc: budgets/{budgetId}/monthlyData/{yyyy-mm}];
    F -- No --> H[setDoc: budgets/{budgetId}/monthlyData/{yyyy-mm} with initial structure];
    G --> I[Update allocations.{categoryId}, updatedAt, lastEditedByUserId];
    H --> I;
    I --> J((Firestore Document Updated));
    J -.-> K([Optional Subsequent Step] Trigger recalculateBudget Cloud Function);
    K -.-> L[Cloud Function updates monthlyData.calculated fields];
``` 

## 3. Implementation Details

The budget allowance auto-save mechanism is orchestrated primarily within the `BudgetPage.jsx` component, leveraging state management, user interaction handlers, and services defined in `budgetService.js`. The `useBudgetData` hook provides the foundational data and reflects server-side updates.

### 3.1. Core Components and Hooks Involved

*   **`BudgetPage.jsx`**: The central component managing budget display, allocation editing, and save operations.
    *   State:
        *   `editingAllocation`: Object (`{ categoryId: newAmountStr }`) holding unsaved allocation values entered by the user.
        *   `activeSliderCategoryId`: Tracks the category ID of the slider currently being interacted with.
        *   `invalidInputCategoryId`: Stores the ID of a category whose input is currently invalid (e.g., exceeds available funds).
        *   `allocationAdjustmentInfo`: Stores information if an allocation was automatically capped.
    *   Key Handlers:
        *   `handleNumericInputChange(categoryId, value)`: Updates `editingAllocation` for direct numeric input and performs real-time validation.
        *   `handleSliderChangeImmediate(categoryId, numericValueFromSlider)`: Updates `editingAllocation` as the slider moves and triggers debounced validation (`debouncedProcessSliderAllocation`).
        *   `processSliderAllocationChange(categoryId, valueAsString)`: (Debounced) Validates the proposed allocation amount against available funds during slider use.
        *   `handleAllocationChange(categoryId, newAmountStr)`: The primary function responsible for saving an allocation to Firestore. It validates, caps the amount if necessary, calls `updateAllocation`, clears the local edit state for the category, and triggers a server-side recalculation.
        *   `handleSliderInteractionStart(categoryId)`: Sets `activeSliderCategoryId`.
        *   `handleSliderInteractionEnd()`: Clears `activeSliderCategoryId` and manages UI updates for debounced RAA display.
        *   `triggerRecalculation()`: (Debounced) Calls the `callRecalculateBudget` service.
*   **`CategoryProgressDisplay.jsx`**: A child component rendering individual category cards.
    *   Receives handlers from `BudgetPage.jsx` (e.g., `baseOnNumericInputChange`, `baseOnSliderChange`, `baseOnAllocationSave`).
    *   Contains a form with a "Sauvegarder" (Save) button. The `onSubmit` event of this form calls `handleLocalAllocationSave`, which in turn calls `BudgetPage`'s `handleAllocationChange` for the specific category.
    *   Uses `AllocationSlider.jsx` for slider-based input.
*   **`AllocationSlider.jsx`**: The UI component for slider input.
    *   Calls `onChange` (wired to `handleSliderChangeImmediate` in `BudgetPage`) during movement.
    *   Calls `onInteractionStart` and `onInteractionEnd` (wired to `handleSliderInteractionStart` and `handleSliderInteractionEnd` in `BudgetPage`).
*   **`useBudgetData.js` (Custom Hook)**:
    *   Fetches and provides real-time updates for monthly budget data (`monthlyData`), including `allocations` and server-calculated figures (`calculated`).
    *   Takes `editingAllocation` from `BudgetPage.jsx` to provide an immediate view of `totalAllocated` and `remainingToAllocate` based on current (unsaved) edits.
*   **`budgetService.js` (Firebase Service)**:
    *   `updateAllocation(budgetId, monthString, categoryId, newAmount, userId)`: Updates/creates the allocation for a specific category in the Firestore document `budgets/{budgetId}/monthlyData/{monthString}` under the `allocations` map. Also updates `updatedAt` and `lastEditedByUserId`.
    *   `callRecalculateBudget(budgetId, monthString)`: Invokes the `recalculateBudget` Firebase Cloud Function to update the `calculated` field in the monthly budget document on the server.

### 3.2. Data Flow and Save Logic

1.  **User Input**:
    *   When a user modifies an allocation for a category, either through the numeric input field or the `AllocationSlider` in `CategoryProgressDisplay.jsx`:
        *   The corresponding handler in `BudgetPage.jsx` (`handleNumericInputChange` or `handleSliderChangeImmediate`) updates the `editingAllocation` state with the new string value for that `categoryId`.
        *   Real-time validation occurs. For sliders, this is debounced (`debouncedProcessSliderAllocation`). If validation fails (e.g., input would make "Remaining to Allocate" negative), `invalidInputCategoryId` is set, providing immediate feedback to the user.

2.  **Save Trigger**:
    *   The save to Firestore is primarily triggered by the `handleAllocationChange` function in `BudgetPage.jsx`. This occurs when:
        *   The user clicks the "Sauvegarder" button within a `CategoryProgressDisplay` card. This submits the form, which calls `handleLocalAllocationSave` (in `CategoryProgressDisplay.jsx`), which then calls `handleAllocationChange` (in `BudgetPage.jsx`) with the current value from `editingAllocation`.
    *   Note: While the slider updates local state immediately, its `onInteractionEnd` does not directly trigger `handleAllocationChange`. The slider's value is saved when the associated "Sauvegarder" button is clicked, as `handleAllocationChange` reads the latest value from `editingAllocation`.

3.  **Saving Process (`handleAllocationChange`)**:
    *   Clears any previous error/info messages.
    *   Parses the `newAmountStr` to a number. Validates if it's a non-negative number.
    *   **Capping Logic**: It calculates the maximum amount the category can be allocated without making the "Remaining to Allocate" (RAA) negative. If `newAmountNum` exceeds this cap, it's adjusted (capped) to this maximum. The user is notified of this adjustment via `allocationAdjustmentInfo` state.
    *   Calls `await updateAllocation(budgetId, currentMonthString, categoryId, cappedOrOriginalAmountNum)` from `budgetService.js`.
        *   `updateAllocation` writes the numeric amount to `budgets/{budgetId}/monthlyData/{monthString}.allocations.{categoryId}`.
    *   If the update is successful:
        *   The `editingAllocation` state for that `categoryId` is cleared (the input field will now reflect the saved `monthlyData.allocations[categoryId]`).
        *   `debouncedTriggerRecalculationRef.current()` is called to initiate a server-side recalculation of budget totals.
    *   If the update fails, `updateError` is set.

4.  **Server-Side Recalculation**:
    *   The call to `debouncedTriggerRecalculationRef.current()` eventually executes `triggerRecalculation` in `BudgetPage.jsx` (debounced by 1000ms).
    *   `triggerRecalculation` calls `await callRecalculateBudget(budgetId, currentMonthString)` from `budgetService.js`.
    *   `callRecalculateBudget` invokes the `recalculateBudget` Firebase Cloud Function.
    *   This Cloud Function updates the `calculated` object (e.g., `totalAllocated`, `remainingToAllocate`, `totalSpent`, `monthlySavings`, `availableToAllocate`, etc.) in the `budgets/{budgetId}/monthlyData/{monthString}` Firestore document.

5.  **UI Update with New Calculations**:
    *   The `useBudgetData` hook listens to changes in the `monthlyData` document. When the `recalculateBudget` Cloud Function updates the `calculated` fields, the listener in `useBudgetData` receives the new data.
    *   This updates the `monthlyData` state in `BudgetPage.jsx`, causing the UI to re-render and display the latest figures for RAA, total allocated, etc., reflecting the server-side calculations.

### 3.3. Key Technical Considerations

*   **Debouncing**: User input validation (especially for sliders) and the trigger for server-side recalculation are debounced to prevent excessive processing and API calls during rapid user interactions.
*   **State Management**:
    *   `editingAllocation` provides immediate UI feedback for inputs.
    *   `monthlyData` (from `useBudgetData`) serves as the source of truth for persisted allocation values.
*   **User Feedback**: The system provides feedback for:
    *   Invalid inputs (e.g., non-numeric, exceeding available funds before capping).
    *   Automatic capping of allocations.
    *   Save errors.
    *   Recalculation status (`pending`, `complete`, `error`).
*   **Capping**: If a user attempts to allocate more than is available, the amount is automatically capped to the maximum possible value, and the user is informed. This ensures budget integrity.
*   **Atomicity (Partial)**: While individual allocation updates are atomic writes to Firestore, the overall process (update allocation + trigger recalculation) involves multiple steps. The recalculation step ensures eventual consistency of the `calculated` totals. 