import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import logger from '../../services/logger';

/**
 * CategoryDisplay - A component to display a list of categories with color indicators
 * 
 * @param {Object} props
 * @param {Array} props.categories - Array of category objects
 * @returns {JSX.Element} A list of categories with color indicators
 */
const CategoryDisplay = ({ categories }) => {
  // Use ref to prevent duplicate logs in StrictMode
  const hasLogged = useRef(false);
  
  useEffect(() => {
    // Prevent duplicate logs in StrictMode
    if (hasLogged.current) return;
    hasLogged.current = true;
    
    // Log info about the categories being processed
    logger.info('CategoryDisplay', 'processCategories', 'Processing category list', {
      categoryCount: categories.length
    });
    
    // Also log directly to console for visibility during testing
    console.info(`[CategoryDisplay] Processing ${categories.length} categories`);

    // Check for invalid categories
    categories.forEach(category => {
      if (!category.name) {
        // Log with our logger
        logger.error('CategoryDisplay', 'validateCategory', 'Invalid category data encountered', {
          categoryId: category.id,
          categoryData: category
        });
        
        // Also log directly to console for visibility during testing
        console.error(`[CategoryDisplay] Invalid category data: ID=${category.id}, missing name property`, category);
      }
    });
  }, [categories]);

  return (
    <div className="category-display">
      <h2 id="category-list-heading">Categories</h2>
      <ul 
        className="category-list" 
        aria-labelledby="category-list-heading"
      >
        {categories.map(category => {
          // Log debug information for each category being rendered
          logger.debug('CategoryDisplay', 'renderCategory', `Rendering category: ${category.name || 'Unnamed'}`, {
            categoryId: category.id,
            categoryColor: category.color
          });

          // Handle null or undefined name gracefully
          const displayName = category.name || 'Unnamed Category';

          return (
            <li key={category.id} className="category-item">
              <div 
                className="category-color-indicator" 
                style={{ 
                  display: 'inline-block',
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  backgroundColor: category.color || '#CCCCCC',
                  marginRight: '8px',
                  verticalAlign: 'middle'
                }}
                role="presentation"
                aria-hidden="true"
              ></div>
              <span className="category-name">{displayName}</span>
              
              {/* Show a visual indicator for invalid categories */}
              {!category.name && (
                <span 
                  style={{ 
                    fontSize: '12px',
                    backgroundColor: '#FFF3CD',
                    color: '#856404',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    marginLeft: '8px'
                  }}
                >
                  ⚠️ Invalid
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

CategoryDisplay.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      color: PropTypes.string
    })
  ).isRequired
};

export default CategoryDisplay; 