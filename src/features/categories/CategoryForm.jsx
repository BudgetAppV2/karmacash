import React from 'react';
import PropTypes from 'prop-types';

const CategoryForm = ({
  categoryName,
  setCategoryName,
  categoryType,
  setCategoryType,
  categoryColor,
  setCategoryColor,
  handleSubmit,
  handleCancel,
  colorOptions,
  editMode,
  formErrors,
}) => {
  return (
    <div className="category-form-container">
      <h2 className="form-title">{editMode ? 'Modifier la catégorie' : 'Ajouter une catégorie'}</h2>
      <form onSubmit={handleSubmit} className="category-form">
        <div className="form-group">
          <label htmlFor="categoryName">Nom de la catégorie</label>
          <input
            id="categoryName"
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Nom de la catégorie"
            className={formErrors.name ? 'error' : ''}
            autoFocus
          />
          {formErrors.name && <div className="error-message">{formErrors.name}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="categoryType">Type de catégorie</label>
          <select
            id="categoryType"
            value={categoryType}
            onChange={(e) => setCategoryType(e.target.value)}
            className={formErrors.type ? 'error' : ''}
          >
            <option value="expense">Dépense</option>
            <option value="income">Revenu</option>
          </select>
          {formErrors.type && <div className="error-message">{formErrors.type}</div>}
        </div>

        <div className="form-group">
          <label htmlFor="categoryColor">Couleur</label>
          <div className="color-selector">
            {colorOptions && colorOptions.map((color, index) => (
              <div
                key={index}
                className={`color-option ${color === categoryColor ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setCategoryColor(color)}
                role="button"
                tabIndex="0"
                aria-label={`Couleur ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="cancel-button">
            Annuler
          </button>
          <button type="submit" className="submit-button">
            {editMode ? 'Mettre à jour' : 'Ajouter'}
          </button>
        </div>
      </form>
    </div>
  );
};

CategoryForm.propTypes = {
  categoryName: PropTypes.string.isRequired,
  setCategoryName: PropTypes.func.isRequired,
  categoryType: PropTypes.string.isRequired,
  setCategoryType: PropTypes.func.isRequired,
  categoryColor: PropTypes.string.isRequired,
  setCategoryColor: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  handleCancel: PropTypes.func.isRequired,
  colorOptions: PropTypes.array.isRequired,
  editMode: PropTypes.bool.isRequired,
  formErrors: PropTypes.object.isRequired,
};

export default CategoryForm; 