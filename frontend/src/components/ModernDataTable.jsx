import { useState, useEffect } from 'react';

export default function ModernDataTable({ elements, record, onSave, readOnly = false }) {
  const [values, setValues] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (record && record.values) {
      const valueMap = {};
      record.values.forEach(v => {
        valueMap[v.element_id] = v.value || '';
      });
      setValues(valueMap);
    } else {
      const defaultValues = {};
      elements.forEach(el => {
        defaultValues[el.id] = el.default_value || '';
      });
      setValues(defaultValues);
    }
  }, [record, elements]);

  const handleStartEdit = (element) => {
    if (readOnly) return;
    setEditingField(element);
    setEditValue(values[element.id] || '');
  };

  const handleSaveEdit = () => {
    if (editingField) {
      setValues(prev => ({
        ...prev,
        [editingField.id]: editValue
      }));
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (readOnly) return;
    const valueArray = Object.entries(values).map(([element_id, value]) => ({
      element_id: parseInt(element_id),
      value
    }));
    onSave(valueArray);
  };

  const getValidationStatus = (element, value) => {
    if (!value) return 'empty';
    if (element.data_type === 'integer' || element.data_type === 'float') {
      const num = parseFloat(value);
      if (isNaN(num)) return 'error';
      if (element.min_value !== null && num < parseFloat(element.min_value)) return 'warning';
      if (element.max_value !== null && num > parseFloat(element.max_value)) return 'warning';
    }
    return 'valid';
  };

  const sortedElements = [...elements].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <form id="record-form" onSubmit={handleSubmit}>
      {/* Modern Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="icon text-blue-600">tune</span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Reçete Parametreleri</h3>
                <p className="text-sm text-gray-500">{sortedElements.length} parametre</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                Object.values(values).filter(v => v).length === sortedElements.length
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {Object.values(values).filter(v => v).length} / {sortedElements.length} dolu
              </span>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-gray-100">
          {sortedElements.map((element, index) => {
            const value = values[element.id] || '';
            const status = getValidationStatus(element, value);
            const isEditing = editingField?.id === element.id;

            return (
              <div 
                key={element.id} 
                className={`flex items-center px-6 py-4 transition ${
                  !readOnly ? 'hover:bg-gray-50 cursor-pointer' : ''
                } ${isEditing ? 'bg-blue-50' : ''}`}
                onClick={() => !isEditing && handleStartEdit(element)}
              >
                {/* Index */}
                <div className="w-10 text-center">
                  <span className="text-sm font-medium text-gray-400">{index + 1}</span>
                </div>

                {/* Parameter Info */}
                <div className="flex-1 min-w-0 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{element.name}</span>
                    {element.unit && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                        {element.unit}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400 capitalize">{element.data_type}</span>
                    {element.min_value !== null && element.max_value !== null && (
                      <span className="text-xs text-gray-400">
                        Aralık: {element.min_value} - {element.max_value}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="w-48">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type={element.data_type === 'integer' || element.data_type === 'float' ? 'number' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        step={element.data_type === 'float' ? '0.01' : '1'}
                        min={element.min_value}
                        max={element.max_value}
                        className="w-full px-3 py-2 border-2 border-blue-500 rounded-lg text-right font-mono focus:outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
                        className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        <span className="icon icon-sm">check</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                        className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        <span className="icon icon-sm">close</span>
                      </button>
                    </div>
                  ) : (
                    <div className={`px-4 py-2 rounded-lg text-right font-mono text-lg ${
                      status === 'valid' ? 'bg-green-50 text-green-800' :
                      status === 'warning' ? 'bg-amber-50 text-amber-800' :
                      status === 'error' ? 'bg-red-50 text-red-800' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {value || '—'}
                    </div>
                  )}
                </div>

                {/* Status Icon */}
                <div className="w-12 text-center">
                  {status === 'valid' && <span className="icon text-green-500">check_circle</span>}
                  {status === 'warning' && <span className="icon text-amber-500">warning</span>}
                  {status === 'error' && <span className="icon text-red-500">error</span>}
                  {status === 'empty' && <span className="icon text-gray-300">radio_button_unchecked</span>}
                </div>

                {/* Edit Icon */}
                {!readOnly && !isEditing && (
                  <div className="w-10 text-center opacity-0 group-hover:opacity-100 transition">
                    <span className="icon text-gray-400">edit</span>
                  </div>
                )}
              </div>
            );
          })}

          {elements.length === 0 && (
            <div className="px-6 py-12 text-center">
              <span className="icon text-4xl text-gray-300 mb-4 block">inventory_2</span>
              <p className="text-gray-500">Bu reçetede parametre tanımlanmamış</p>
              <p className="text-gray-400 text-sm mt-1">Reçeteye element ekleyin</p>
            </div>
          )}
        </div>

        {/* Table Footer */}
        {!readOnly && (
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <span className="icon icon-sm">info</span>
              Değer düzenlemek için satıra tıklayın
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
