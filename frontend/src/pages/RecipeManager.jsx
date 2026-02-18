import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import RecipeEditor from '../components/RecipeEditor';
import ModernDataTable from '../components/ModernDataTable';
import { useAuth } from '../context/AuthContext';

export default function RecipeManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [status, setStatus] = useState({ type: 'info', message: 'Ready' });
  const [showRecipeEditor, setShowRecipeEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if user needs biometric verification (view only mode)
  const isViewOnly = user && !user.biometric_verified && user.role !== 'admin';

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
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedRecipe.name}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setStatus({ type: 'success', message: 'Recipe exported' });
    } catch (error) {
      console.error('Export error:', error);
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
    <div className="space-y-6">
      {/* View Only Warning Banner */}
      {isViewOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <span className="icon text-amber-600">warning</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-800">Biyometrik Doğrulama Gerekli</h3>
            <p className="text-amber-600 text-sm">
              Düzenleme yapmak için biyometrik doğrulamanızı tamamlayın. Dashboard'dan başlatabilirsiniz.
            </p>
          </div>
          <a href="/" className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
            Dashboard'a Git
          </a>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="icon icon-lg text-white">receipt_long</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Reçete Yöneticisi</h1>
              <p className="text-gray-500">Endüstriyel reçete sistemi</p>
            </div>
          </div>
          {!isViewOnly && (
            <button
              onClick={() => setShowRecipeEditor(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition flex items-center gap-2 shadow-sm"
            >
              <span className="icon icon-sm">add</span> Yeni Reçete
            </button>
          )}
        </div>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipe Selection */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <span className="icon icon-sm text-blue-500">folder</span> Reçete Seçimi
          </label>
          <select
            value={selectedRecipe?.id || ''}
            onChange={(e) => handleRecipeChange(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {recipes.map(recipe => (
              <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
            ))}
          </select>
          {selectedRecipe && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <span className="icon icon-sm">tag</span> ID: {selectedRecipe.id}
              </span>
              <span className="flex items-center gap-1">
                <span className="icon icon-sm">tune</span> {selectedRecipe.elements?.length || 0} parametre
              </span>
            </div>
          )}
        </div>
        
        {/* Data Record Selection */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <label className="block text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
            <span className="icon icon-sm text-green-500">description</span> Veri Kaydı
          </label>
          <select
            value={selectedRecord?.id || ''}
            onChange={(e) => handleRecordChange(parseInt(e.target.value))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={records.length === 0}
          >
            {records.length === 0 ? (
              <option>Kayıt yok</option>
            ) : (
              records.map(record => (
                <option key={record.id} value={record.id}>{record.name}</option>
              ))
            )}
          </select>
          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <span className="icon icon-sm">format_list_numbered</span> {records.length} kayıt
            </span>
            {selectedRecord && (
              <span className="flex items-center gap-1">
                <span className="icon icon-sm">numbers</span> No: {selectedRecord.record_number}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Data Table */}
      {selectedRecipe && (
        <ModernDataTable
          elements={selectedRecipe.elements || []}
          record={selectedRecord}
          onSave={handleSaveRecord}
          readOnly={isViewOnly}
        />
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => selectedRecord && handleRecordChange(selectedRecord.id)}
            className="flex-1 min-w-32 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <span className="icon">refresh</span> Yenile
          </button>
          <button
            onClick={() => {
              if (isViewOnly) return;
              const form = document.getElementById('record-form');
              if (form) form.requestSubmit();
            }}
            disabled={isViewOnly}
            className={`flex-1 min-w-32 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              isViewOnly 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <span className="icon">save</span> Kaydet
          </button>
          <button
            onClick={isViewOnly ? undefined : handleNewRecord}
            disabled={isViewOnly}
            className={`flex-1 min-w-32 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              isViewOnly 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <span className="icon">add</span> Yeni Kayıt
          </button>
          <button
            onClick={isViewOnly ? undefined : handleDeleteRecord}
            disabled={isViewOnly}
            className={`flex-1 min-w-32 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              isViewOnly 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            <span className="icon">delete</span> Sil
          </button>
          <button
            onClick={isViewOnly ? undefined : handleExport}
            disabled={isViewOnly}
            className={`flex-1 min-w-32 py-3 rounded-xl font-medium transition flex items-center justify-center gap-2 ${
              isViewOnly 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-purple-500 hover:bg-purple-600 text-white'
            }`}
          >
            <span className="icon">download</span> Dışa Aktar
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`rounded-xl px-5 py-3 flex items-center gap-3 ${
        status.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
        status.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
        'bg-gray-50 border border-gray-200 text-gray-600'
      }`}>
        <span className="icon icon-sm">
          {status.type === 'success' ? 'check_circle' : status.type === 'error' ? 'error' : 'info'}
        </span>
        <span className="text-sm">{status.message}</span>
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
