import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import RecipeEditor from '../components/RecipeEditor';
import DataRecordTable from '../components/DataRecordTable';

export default function RecipeManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [status, setStatus] = useState('');
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecipes();
  }, []);

  useEffect(() => {
    if (id && recipes.length > 0) {
      const recipe = recipes.find(r => r.id === parseInt(id));
      if (recipe) {
        handleRecipeChange(recipe.id);
      }
    }
  }, [id, recipes]);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
      if (response.data.length > 0 && !id) {
        handleRecipeChange(response.data[0].id);
      }
    } catch (error) {
      setStatus('Error loading recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeChange = async (recipeId) => {
    try {
      const [recipeRes, recordsRes] = await Promise.all([
        api.get(`/recipes/${recipeId}`),
        api.get(`/recipes/${recipeId}/records`)
      ]);
      setSelectedRecipe(recipeRes.data);
      setRecords(recordsRes.data);
      setSelectedRecord(recordsRes.data[0] || null);
      navigate(`/recipes/${recipeId}`, { replace: true });
    } catch (error) {
      setStatus('Error loading recipe data');
    }
  };

  const handleRecordChange = async (recordId) => {
    try {
      const response = await api.get(`/records/${recordId}`);
      setSelectedRecord(response.data);
      setStatus('Data record read');
    } catch (error) {
      setStatus('Error loading record');
    }
  };

  const handleSaveRecord = async (values) => {
    try {
      if (selectedRecord) {
        await api.put(`/records/${selectedRecord.id}`, {
          name: selectedRecord.name,
          values
        });
        setStatus('Data record saved');
        handleRecordChange(selectedRecord.id);
      }
    } catch (error) {
      setStatus('Error saving record');
    }
  };

  const handleNewRecord = async () => {
    if (!selectedRecipe) return;
    
    const name = prompt('Enter record name:');
    if (!name) return;

    try {
      const values = selectedRecipe.elements.map(el => ({
        element_id: el.id,
        value: el.default_value || ''
      }));

      const response = await api.post(`/recipes/${selectedRecipe.id}/records`, {
        name,
        values
      });
      
      setRecords([...records, response.data]);
      setSelectedRecord(response.data);
      setStatus('New record created');
    } catch (error) {
      setStatus('Error creating record');
    }
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    if (!confirm('Delete this record?')) return;

    try {
      await api.delete(`/records/${selectedRecord.id}`);
      const newRecords = records.filter(r => r.id !== selectedRecord.id);
      setRecords(newRecords);
      setSelectedRecord(newRecords[0] || null);
      setStatus('Record deleted');
    } catch (error) {
      setStatus('Error deleting record');
    }
  };

  const handleExport = async () => {
    if (!selectedRecipe) return;
    
    try {
      const response = await api.get(`/recipes/${selectedRecipe.id}/export`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedRecipe.name}_export.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setStatus('Recipe exported');
    } catch (error) {
      setStatus('Error exporting recipe');
    }
  };

  const handleRecipeCreated = (recipe) => {
    setRecipes([...recipes, recipe]);
    handleRecipeChange(recipe.id);
    setShowRecipeEditor(false);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="bg-gray-200 px-4 py-2 rounded-t-lg border-b flex justify-between items-center">
        <span className="font-semibold text-gray-700">Recipe Manager</span>
        <button
          onClick={() => setShowRecipeEditor(true)}
          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          + New Recipe
        </button>
      </div>

      {/* Recipe & Record Selection */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <label className="w-32 font-medium text-gray-700">Recipe Name:</label>
            <select
              value={selectedRecipe?.id || ''}
              onChange={(e) => handleRecipeChange(parseInt(e.target.value))}
              className="flex-1 border rounded px-3 py-2 bg-white"
            >
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
              ))}
            </select>
            <span className="ml-2 text-gray-500 w-16">No.: {selectedRecipe?.id}</span>
          </div>
          
          <div className="flex items-center">
            <label className="w-32 font-medium text-gray-700">Data Record:</label>
            <select
              value={selectedRecord?.id || ''}
              onChange={(e) => handleRecordChange(parseInt(e.target.value))}
              className="flex-1 border rounded px-3 py-2 bg-white"
              disabled={records.length === 0}
            >
              {records.map(record => (
                <option key={record.id} value={record.id}>{record.name}</option>
              ))}
            </select>
            <span className="ml-2 text-gray-500 w-16">No.: {selectedRecord?.record_number}</span>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {selectedRecipe && (
        <DataRecordTable
          elements={selectedRecipe.elements || []}
          record={selectedRecord}
          onSave={handleSaveRecord}
        />
      )}

      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-t flex items-center space-x-2">
        <button
          onClick={() => selectedRecord && handleRecordChange(selectedRecord.id)}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
        >
          📖 Read
        </button>
        <button
          onClick={() => {
            const form = document.getElementById('record-form');
            if (form) form.requestSubmit();
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
        >
          💾 Save
        </button>
        <button
          onClick={handleNewRecord}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
        >
          ➕ New
        </button>
        <button
          onClick={handleDeleteRecord}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
        >
          🗑 Delete
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center"
        >
          📤 Export
        </button>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-gray-100 border-t rounded-b-lg text-sm text-gray-600">
        Status: {status || 'Ready'}
      </div>

      {/* Recipe Editor Modal */}
      {showRecipeEditor && (
        <RecipeEditor
          onClose={() => setShowRecipeEditor(false)}
          onCreated={handleRecipeCreated}
        />
      )}
    </div>
  );
}
