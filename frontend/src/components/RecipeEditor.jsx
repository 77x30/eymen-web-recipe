import { useState } from 'react';
import api from '../services/api';

export default function RecipeEditor({ onClose, onCreated, recipe }) {
  const [name, setName] = useState(recipe?.name || '');
  const [description, setDescription] = useState(recipe?.description || '');
  const [elements, setElements] = useState(recipe?.elements || []);
  const [error, setError] = useState('');

  const addElement = () => {
    setElements([
      ...elements,
      {
        name: '',
        data_type: 'string',
        unit: '',
        min_value: null,
        max_value: null,
        default_value: '',
        sort_order: elements.length
      }
    ]);
  };

  const updateElement = (index, field, value) => {
    const newElements = [...elements];
    newElements[index] = { ...newElements[index], [field]: value };
    setElements(newElements);
  };

  const removeElement = (index) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Recipe name is required');
      return;
    }

    if (elements.some(el => !el.name.trim())) {
      setError('All elements must have a name');
      return;
    }

    try {
      const data = { name, description, elements };
      const response = await api.post('/recipes', data);
      onCreated(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error creating recipe');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden">
        <div className="bg-gray-200 px-4 py-3 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">
            {recipe ? 'Edit Recipe' : 'Create New Recipe'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipe Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border rounded px-3 py-2"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Recipe Elements</h3>
              <button
                type="button"
                onClick={addElement}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                + Add Element
              </button>
            </div>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Name *</th>
                  <th className="border px-2 py-1 text-left">Type</th>
                  <th className="border px-2 py-1 text-left">Unit</th>
                  <th className="border px-2 py-1 text-left">Min</th>
                  <th className="border px-2 py-1 text-left">Max</th>
                  <th className="border px-2 py-1 text-left">Default</th>
                  <th className="border px-2 py-1 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {elements.map((el, index) => (
                  <tr key={index}>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={el.name}
                        onChange={(e) => updateElement(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                        required
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <select
                        value={el.data_type}
                        onChange={(e) => updateElement(index, 'data_type', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      >
                        <option value="string">String</option>
                        <option value="integer">Integer</option>
                        <option value="float">Float</option>
                        <option value="boolean">Boolean</option>
                      </select>
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={el.unit || ''}
                        onChange={(e) => updateElement(index, 'unit', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="number"
                        value={el.min_value || ''}
                        onChange={(e) => updateElement(index, 'min_value', e.target.value || null)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="number"
                        value={el.max_value || ''}
                        onChange={(e) => updateElement(index, 'max_value', e.target.value || null)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="border px-1 py-1">
                      <input
                        type="text"
                        value={el.default_value || ''}
                        onChange={(e) => updateElement(index, 'default_value', e.target.value)}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </td>
                    <td className="border px-1 py-1 text-center">
                      <button
                        type="button"
                        onClick={() => removeElement(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {elements.length === 0 && (
              <p className="text-center text-gray-500 py-4 border border-t-0">
                No elements. Click "Add Element" to define recipe fields.
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm">{error}</div>
          )}
        </form>

        <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-2 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('form').requestSubmit();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create Recipe
          </button>
        </div>
      </div>
    </div>
  );
}
