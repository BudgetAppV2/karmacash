            {categories.map((category) => {
              const allocatedAmount = monthlyData?.allocations?.[category.id] ?? 0;
              const currentInputValue = editingAllocation[category.id] !== undefined 
                                        ? editingAllocation[category.id] 
                                        : allocatedAmount.toString();
              
              const isCurrentCategoryActive = category.id === activeSliderCategoryId;
              const rtaForThisCategoryMaxCalc = (activeSliderCategoryId === null || isCurrentCategoryActive) 
                                           ? instantRemainingToAllocate 
                                           : (debouncedRemainingToAllocateForInactive ?? instantRemainingToAllocate);
              
              const positiveRtaForMax = rtaForThisCategoryMaxCalc > 0 ? rtaForThisCategoryMaxCalc : 0;
              // Old calculation commented out for clarity:
              // const maxPotentialAllocationForCategory = allocatedAmount + positiveRtaForMax;

              // New logic for maxPotentialAllocationForCategory
              const savedAlloc = allocatedAmount; // allocatedAmount is already the saved allocation
              const currentEditingValStr = editingAllocation[category.id];
              let numericCurrentInputValue = parseFloat(currentEditingValStr);

              if (isNaN(numericCurrentInputValue)) {
                  numericCurrentInputValue = savedAlloc;
              }

              // positiveRtaForMax is already Math.max(0, instantRemainingToAllocate) for the active category
              const rtaFromHook = positiveRtaForMax; 

              const maxPotentialAllocationForCategory = Math.max(0, numericCurrentInputValue + rtaFromHook);

              // For debugging, log for all categories.
              // if (category.name === "CATEGORY_NAME_TO_DEBUG" || true) { 
                // const savedAlloc = monthlyData?.allocations?.[category.id] ?? 0; // Commented out: redeclared by fix
                // const currentEditingValStr = editingAllocation[category.id]; // Commented out: redeclared by fix
                // Ensure robust parsing for currentEditingValNum, handling undefined or empty strings gracefully for logging.
                // const currentEditingValNum = parseFloat(currentEditingValStr); // Commented out: numericCurrentInputValue from fix can be used
              
                console.log(`[BudgetPage] Category: ${category.name}`);
                console.log(`  - Saved Allocation (from monthlyData?.allocations):`, savedAlloc); // Uses savedAlloc from the fix
                console.log(`  - Current Input Value (editingAllocation[id]):`, currentEditingValStr); // Uses currentEditingValStr from the fix
                console.log(`  - Numeric Current Input:`, isNaN(numericCurrentInputValue) ? "N/A or Not a Number" : numericCurrentInputValue); // Uses numericCurrentInputValue from the fix
                console.log(`  - instantRemainingToAllocate (from useBudgetData hook):`, instantRemainingToAllocate);
                
                // If rtaForThisCategoryMaxCalc and positiveRtaForMax are defined variables in this scope 
                // AND are directly used to compute the final maxPotentialAllocationForCategory, please log them.
                // Logging them as they are used in maxPotentialAllocationForCategory calculation above.
                console.log(`  - rtaForThisCategoryMaxCalc (derived for max calc):`, rtaForThisCategoryMaxCalc);
                console.log(`  - positiveRtaForMax (derived for max calc):`, positiveRtaForMax);
          
                // Ensure 'maxPotentialAllocationForCategory' logged here is the actual variable 
                // holding the value that will be passed as the 'max' prop.
                console.log(`  - Calculated maxPotentialAllocationForCategory (current slider max):`, maxPotentialAllocationForCategory); 
              // }

              const onSaveHandler = () => handleAllocationChange(category.id, editingAllocation[category.id] ?? allocatedAmount.toString());
              
              return (
                <div key={category.id}>
                  {/* Render your component content here */}
                </div>
              );
            })} 