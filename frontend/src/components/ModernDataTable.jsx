import { useState, useEffect } from 'react';
import VirtualKeyboard from './VirtualKeyboard';

export default function ModernDataTable({ elements, record, onSave, readOnly = false }) {
  const [values, setValues] = useState({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardElement, setKeyboardElement] = useState(null);

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
    setKeyboardElement(element);
    setKeyboardOpen(true);
  };

  const handleKeyboardSubmit = (newValue) => {
    if (keyboardElement) {
      setValues(prev => ({
        ...prev,
        [keyboardElement.id]: newValue
      }));
    }
  };

  const handleCloseKeyboard = () => {
    setKeyboardOpen(false);
    setKeyboardElement(null);
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
    <>
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

            return (
              <div 
                key={element.id} 
                className={`flex items-center px-6 py-4 transition group ${
                  !readOnly ? 'hover:bg-blue-50 cursor-pointer' : ''
                }`}
                onClick={() => handleStartEdit(element)}
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
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      element.data_type === 'integer' ? 'bg-blue-100 text-blue-600' :
                      element.data_type === 'float' ? 'bg-green-100 text-green-600' :
                      'bg-purple-100 text-purple-600'
                    }`}>
                      {element.data_type === 'integer' ? 'Tam Sayı' : 
                       element.data_type === 'float' ? 'Ondalık' : 'Metin'}
                    </span>
                    {element.min_value !== null && element.max_value !== null && (
                      <span className="text-xs text-gray-400">
                        Aralık: {element.min_value} - {element.max_value}
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <div className="w-56">
                  <div className={`px-4 py-3 rounded-xl text-right font-mono text-xl border-2 transition ${
                    status === 'valid' ? 'bg-green-50 text-green-800 border-green-200' :
                    status === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    status === 'error' ? 'bg-red-50 text-red-800 border-red-200' :
                    'bg-gray-50 text-gray-400 border-gray-200'
                  } ${!readOnly ? 'group-hover:border-blue-400 group-hover:bg-blue-50' : ''}`}>
                    {value || '—'}
                    {element.unit && value && (
                      <span className="text-sm text-gray-500 ml-2">{element.unit}</span>
                    )}
                  </div>
                </div>

                {/* Status Icon */}
                <div className="w-12 text-center">
                  {status === 'valid' && <span className="icon text-green-500">check_circle</span>}
                  {status === 'warning' && <span className="icon text-amber-500">warning</span>}
                  {status === 'error' && <span className="icon text-red-500">error</span>}
                  {status === 'empty' && <span className="icon text-gray-300">radio_button_unchecked</span>}
                </div>

                {/* Edit Icon */}
                {!readOnly && (
                  <div className="w-10 text-center opacity-0 group-hover:opacity-100 transition">
                    <span className="icon text-blue-500">keyboard</span>
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-t border-gray-200 px-6 py-3">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="icon icon-sm text-blue-500">touch_app</span>
              Değer düzenlemek için satıra dokunun - Ekran klavyesi açılacaktır
            </p>
          </div>
        )}
      </div>
    </form>

    {/* Virtual Keyboard */}
    <VirtualKeyboard
      isOpen={keyboardOpen}
      onClose={handleCloseKeyboard}
      onSubmit={handleKeyboardSubmit}
      dataType={keyboardElement?.data_type || 'string'}
      currentValue={keyboardElement ? (values[keyboardElement.id] || '') : ''}
      fieldName={keyboardElement?.name || ''}
      unit={keyboardElement?.unit || ''}
      min={keyboardElement?.min_value !== null ? parseFloat(keyboardElement.min_value) : null}
      max={keyboardElement?.max_value !== null ? parseFloat(keyboardElement.max_value) : null}
    />
  </>
  );
}
