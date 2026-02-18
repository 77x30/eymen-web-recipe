import { useState, useEffect } from 'react';
import VirtualKeyboard from './VirtualKeyboard';

export default function DataRecordTable({ elements, record, onSave }) {
  const [values, setValues] = useState({});
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [activeField, setActiveField] = useState(null);

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

  const handleFieldClick = (element) => {
    setActiveField(element);
    setKeyboardOpen(true);
  };

  const handleKeyboardSubmit = (newValue) => {
    if (activeField) {
      setValues(prev => ({
        ...prev,
        [activeField.id]: newValue
      }));
      
      // Move to next field
      const sortedElements = [...elements].sort((a, b) => a.sort_order - b.sort_order);
      const currentIndex = sortedElements.findIndex(el => el.id === activeField.id);
      if (currentIndex < sortedElements.length - 1) {
        setTimeout(() => {
          setActiveField(sortedElements[currentIndex + 1]);
          setKeyboardOpen(true);
        }, 100);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valueArray = Object.entries(values).map(([element_id, value]) => ({
      element_id: parseInt(element_id),
      value
    }));
    onSave(valueArray);
  };

  const getStatusColor = (element, value) => {
    if (!value) return 'bg-gray-100';
    if (element.data_type === 'integer' || element.data_type === 'float') {
      const num = parseFloat(value);
      if (isNaN(num)) return 'bg-red-100';
      if (element.min_value !== null && num < parseFloat(element.min_value)) return 'bg-red-100';
      if (element.max_value !== null && num > parseFloat(element.max_value)) return 'bg-red-100';
    }
    return 'bg-green-50';
  };

  const sortedElements = [...elements].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <form id="record-form" onSubmit={handleSubmit} className="bg-gray-900 rounded-lg overflow-hidden">
        {/* HMI Style Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-white font-semibold">RECIPE DATA</span>
          </div>
          <span className="text-blue-300 text-sm">
            {sortedElements.length} Parameters
          </span>
        </div>

        {/* HMI Style Table */}
        <div className="divide-y divide-gray-700">
          {sortedElements.map((element, index) => {
            const value = values[element.id] || '';
            const statusColor = getStatusColor(element, value);
            
            return (
              <div 
                key={element.id} 
                className={`flex items-center hover:bg-gray-800 transition cursor-pointer ${
                  index % 2 === 0 ? 'bg-gray-850' : 'bg-gray-900'
                }`}
                onClick={() => handleFieldClick(element)}
              >
                {/* Row Number */}
                <div className="w-12 text-center py-4 text-gray-500 font-mono text-sm border-r border-gray-700">
                  {String(index + 1).padStart(2, '0')}
                </div>
                
                {/* Parameter Name */}
                <div className="flex-1 px-4 py-4">
                  <div className="text-white font-medium">{element.name}</div>
                  <div className="text-gray-500 text-xs mt-0.5">
                    {element.data_type.toUpperCase()}
                    {element.min_value !== null && element.max_value !== null && 
                      ` • ${element.min_value} - ${element.max_value}`
                    }
                  </div>
                </div>

                {/* Value Display */}
                <div className="w-48 px-2 py-2">
                  <div className={`${statusColor} rounded-lg px-4 py-3 text-right font-mono text-lg font-bold 
                    border-2 ${activeField?.id === element.id ? 'border-blue-500' : 'border-transparent'}
                    transition-all hover:border-blue-400`}
                  >
                    {value || <span className="text-gray-400">---</span>}
                  </div>
                </div>

                {/* Unit */}
                <div className="w-20 text-center py-4 text-gray-400 font-medium">
                  {element.unit || ''}
                </div>

                {/* Status Indicator */}
                <div className="w-12 text-center py-4">
                  <div className={`w-3 h-3 rounded-full mx-auto ${
                    value ? 'bg-green-500' : 'bg-gray-600'
                  }`}></div>
                </div>
              </div>
            );
          })}
          
          {elements.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500 text-lg">No parameters defined</div>
              <div className="text-gray-600 text-sm mt-1">Add elements to this recipe</div>
            </div>
          )}
        </div>

        {/* HMI Footer */}
        <div className="bg-gray-800 px-4 py-2 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              Ready
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-400">Touch value to edit</span>
          </div>
          <div className="text-gray-500">
            {Object.values(values).filter(v => v).length} / {sortedElements.length} filled
          </div>
        </div>
      </form>

      {/* Virtual Keyboard */}
      <VirtualKeyboard
        isOpen={keyboardOpen}
        onClose={() => setKeyboardOpen(false)}
        onSubmit={handleKeyboardSubmit}
        dataType={activeField?.data_type || 'string'}
        currentValue={activeField ? (values[activeField.id] || '') : ''}
        fieldName={activeField?.name || ''}
        unit={activeField?.unit || ''}
        min={activeField?.min_value ? parseFloat(activeField.min_value) : null}
        max={activeField?.max_value ? parseFloat(activeField.max_value) : null}
      />
    </>
  );
}
