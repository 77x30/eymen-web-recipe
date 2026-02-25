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

      {/* Recipe Selection - Card Grid */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-500 mb-4 flex items-center gap-2">
          <span className="icon icon-sm text-blue-500">folder</span> Reçete Seçimi
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {recipes.map((recipe, index) => (
            <button
              key={recipe.id}
              onClick={() => handleRecipeChange(recipe.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-md ${
                selectedRecipe?.id === recipe.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/50'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                selectedRecipe?.id === recipe.id
                  ? 'bg-blue-500 text-white'
                  : index % 3 === 0 ? 'bg-blue-100 text-blue-600' :
                    index % 3 === 1 ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
              }`}>
                <span className="icon">receipt_long</span>
              </div>
              <h4 className={`font-medium text-sm truncate ${
                selectedRecipe?.id === recipe.id ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {recipe.name}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {recipe.elements?.length || 0} parametre
              </p>
              {selectedRecipe?.id === recipe.id && (
                <div className="absolute top-2 right-2">
                  <span className="icon icon-sm text-blue-500">check_circle</span>
                </div>
              )}
            </button>
          ))}
        </div>
        {selectedRecipe && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-4 text-sm text-blue-700">
            <span className="icon icon-sm">info</span>
            <span>Seçili: <strong>{selectedRecipe.name}</strong> - {selectedRecipe.elements?.length || 0} parametre</span>
          </div>
        )}
      </div>
        
      {/* Data Record Selection - Horizontal Scroll Cards */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <label className="block text-sm font-medium text-gray-500 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <span className="icon icon-sm text-green-500">description</span> Veri Kayıtları
          </span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{records.length} kayıt</span>
        </label>
        {records.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {records.map((record, index) => (
              <button
                key={record.id}
                onClick={() => handleRecordChange(record.id)}
                className={`flex-shrink-0 p-4 rounded-xl border-2 transition-all duration-200 min-w-[140px] text-left ${
                  selectedRecord?.id === record.id
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-gray-50 hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-sm font-bold ${
                  selectedRecord?.id === record.id
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <h4 className={`font-medium text-sm truncate ${
                  selectedRecord?.id === record.id ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {record.name}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  No: {record.record_number}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <span className="icon text-3xl text-gray-300 block mb-2">folder_off</span>
            <p className="text-sm">Bu reçete için kayıt yok</p>
          </div>
        )}
      </div>

      {/* Data Table */}
      {selectedRecipe && selectedRecipe.elements && selectedRecipe.elements.length > 0 && (
        <ModernDataTable
          elements={selectedRecipe.elements}
          record={selectedRecord}
          onSave={handleSaveRecord}
          readOnly={isViewOnly}
        />
      )}

      {selectedRecipe && (!selectedRecipe.elements || selectedRecipe.elements.length === 0) && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <span className="icon text-5xl text-gray-300 block mb-4">inventory_2</span>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Bu reçetede parametre yok</h3>
          <p className="text-gray-400">Reçeteye element ekleyerek parametreleri tanımlayın</p>
        </div>
      )}

      {!selectedRecipe && recipes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <span className="icon text-5xl text-blue-300 block mb-4">receipt_long</span>
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Henüz reçete oluşturulmadı</h3>
          <p className="text-gray-400 mb-6">İlk reçetenizi oluşturmak için aşağıdaki butona tıklayın</p>
          {!isViewOnly && (
            <button
              onClick={() => setShowRecipeEditor(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition inline-flex items-center gap-2"
            >
              <span className="icon icon-sm">add</span> İlk Reçeteyi Oluştur
            </button>
          )}
        </div>
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
