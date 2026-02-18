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
  const [status, setStatus] = useState({ type: 'info', message: 'Ready' });
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
      setStatus({ type: 'error', message: 'Error loading recipes' });
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
      setStatus({ type: 'success', message: `Recipe "${recipeRes.data.name}" loaded` });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error loading recipe data' });
    }
  };

  const handleRecordChange = async (recordId) => {
    try {
      const response = await api.get(`/records/${recordId}`);
      setSelectedRecord(response.data);
      setStatus({ type: 'success', message: 'Data record read successfully' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error loading record' });
    }
  };

  const handleSaveRecord = async (values) => {
    try {
      if (selectedRecord) {
        await api.put(`/records/${selectedRecord.id}`, {
          name: selectedRecord.name,
          values
        });
        setStatus({ type: 'success', message: 'Data record saved successfully' });
        handleRecordChange(selectedRecord.id);
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error saving record' });
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
      setStatus({ type: 'success', message: 'New record created' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error creating record' });
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
      setStatus({ type: 'success', message: 'Record deleted' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error deleting record' });
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
      setStatus({ type: 'success', message: 'Recipe exported' });
    } catch (error) {
      setStatus({ type: 'error', message: 'Error exporting recipe' });
    }
  };

  const handleRecipeCreated = (recipe) => {
    setRecipes([...recipes, recipe]);
    handleRecipeChange(recipe.id);
    setShowRecipeEditor(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
      {/* HMI-Style Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-700 to-blue-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="icon icon-lg text-white">receipt_long</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Recipe Manager</h1>
            <p className="text-blue-200 text-sm">Industrial Recipe System</p>
          </div>
        </div>
        <button
          onClick={() => setShowRecipeEditor(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg transition flex items-center gap-2"
        >
          <span className="icon icon-sm">add</span> New Recipe
        </button>
      </div>

      {/* Recipe & Record Selection - HMI Style */}
      <div className="p-4 bg-gray-800 border-b border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recipe Selection */}
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <label className="block text-blue-400 text-sm font-medium mb-2 flex items-center gap-1">
              <span className="icon icon-sm">folder</span> RECIPE
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRecipe?.id || ''}
                onChange={(e) => handleRecipeChange(parseInt(e.target.value))}
                className="flex-1 bg-gray-900 border-2 border-blue-500 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-blue-400"
              >
                {recipes.map(recipe => (
                  <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                ))}
              </select>
              <div className="bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-3 text-center min-w-16">
                <span className="text-gray-400 text-xs block">No.</span>
                <span className="text-white font-bold">{selectedRecipe?.id || '-'}</span>
              </div>
            </div>
          </div>
          
          {/* Data Record Selection */}
          <div className="bg-gray-750 rounded-lg p-4 border border-gray-600">
            <label className="block text-green-400 text-sm font-medium mb-2 flex items-center gap-1">
              <span className="icon icon-sm">description</span> DATA RECORD
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRecord?.id || ''}
                onChange={(e) => handleRecordChange(parseInt(e.target.value))}
                className="flex-1 bg-gray-900 border-2 border-green-500 rounded-lg px-4 py-3 text-white text-lg font-medium focus:outline-none focus:border-green-400"
                disabled={records.length === 0}
              >
                {records.length === 0 ? (
                  <option>No records</option>
                ) : (
                  records.map(record => (
                    <option key={record.id} value={record.id}>{record.name}</option>
                  ))
                )}
              </select>
              <div className="bg-gray-900 border-2 border-gray-600 rounded-lg px-4 py-3 text-center min-w-16">
                <span className="text-gray-400 text-xs block">No.</span>
                <span className="text-white font-bold">{selectedRecord?.record_number || '-'}</span>
              </div>
            </div>
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

      {/* HMI-Style Action Buttons */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => selectedRecord && handleRecordChange(selectedRecord.id)}
            className="flex-1 min-w-32 py-4 bg-gradient-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white rounded-lg font-bold text-lg shadow-lg transition border-2 border-gray-500 flex items-center justify-center gap-2"
          >
            <span className="icon">menu_book</span> READ
          </button>
          <button
            onClick={() => {
              const form = document.getElementById('record-form');
              if (form) form.requestSubmit();
            }}
            className="flex-1 min-w-32 py-4 bg-gradient-to-b from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white rounded-lg font-bold text-lg shadow-lg transition border-2 border-green-500 flex items-center justify-center gap-2"
          >
            <span className="icon">save</span> SAVE
          </button>
          <button
            onClick={handleNewRecord}
            className="flex-1 min-w-32 py-4 bg-gradient-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg font-bold text-lg shadow-lg transition border-2 border-blue-500 flex items-center justify-center gap-2"
          >
            <span className="icon">add</span> NEW
          </button>
          <button
            onClick={handleDeleteRecord}
            className="flex-1 min-w-32 py-4 bg-gradient-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg font-bold text-lg shadow-lg transition border-2 border-red-500 flex items-center justify-center gap-2"
          >
            <span className="icon">delete</span> DELETE
          </button>
          <button
            onClick={handleExport}
            className="flex-1 min-w-32 py-4 bg-gradient-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg font-bold text-lg shadow-lg transition border-2 border-purple-500 flex items-center justify-center gap-2"
          >
            <span className="icon">download</span> EXPORT
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`px-6 py-3 border-t flex items-center gap-3 ${
        status.type === 'success' ? 'bg-green-900/50 border-green-700 text-green-300' :
        status.type === 'error' ? 'bg-red-900/50 border-red-700 text-red-300' :
        'bg-gray-800 border-gray-700 text-gray-400'
      }`}>
        <div className={`w-3 h-3 rounded-full ${
          status.type === 'success' ? 'bg-green-400 animate-pulse' :
          status.type === 'error' ? 'bg-red-400' :
          'bg-gray-500'
        }`}></div>
        <span className="font-medium">{status.message}</span>
        <span className="ml-auto text-xs opacity-60">{new Date().toLocaleTimeString()}</span>
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
