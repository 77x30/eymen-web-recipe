import { useState, useEffect } from 'react';

export default function DataRecordTable({ elements, record, onSave }) {
  const [values, setValues] = useState({});

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

  const handleValueChange = (elementId, value) => {
    setValues(prev => ({
      ...prev,
      [elementId]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const valueArray = Object.entries(values).map(([element_id, value]) => ({
      element_id: parseInt(element_id),
      value
    }));
    onSave(valueArray);
  };

  const validateValue = (element, value) => {
    if (element.data_type === 'integer' || element.data_type === 'float') {
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      if (element.min_value !== null && num < element.min_value) return false;
      if (element.max_value !== null && num > element.max_value) return false;
    }
    return true;
  };

  return (
    <form id="record-form" onSubmit={handleSubmit} className="p-4">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2 text-left w-1/2">Entry Name</th>
            <th className="border px-4 py-2 text-left">Value</th>
            <th className="border px-4 py-2 text-left w-20">Unit</th>
          </tr>
        </thead>
        <tbody>
          {elements.sort((a, b) => a.sort_order - b.sort_order).map(element => {
            const value = values[element.id] || '';
            const isValid = validateValue(element, value);
            
            return (
              <tr key={element.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2 font-medium text-gray-700">
                  {element.name}
                </td>
                <td className="border px-2 py-1">
                  {element.data_type === 'boolean' ? (
                    <select
                      value={value}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    >
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <input
                      type={element.data_type === 'integer' || element.data_type === 'float' ? 'number' : 'text'}
                      step={element.data_type === 'float' ? '0.01' : '1'}
                      min={element.min_value}
                      max={element.max_value}
                      value={value}
                      onChange={(e) => handleValueChange(element.id, e.target.value)}
                      className={`w-full px-2 py-1 border rounded text-right ${
                        !isValid ? 'border-red-500 bg-red-50' : ''
                      }`}
                    />
                  )}
                </td>
                <td className="border px-4 py-2 text-gray-500 text-sm">
                  {element.unit || ''}
                </td>
              </tr>
            );
          })}
          
          {elements.length === 0 && (
            <tr>
              <td colSpan="3" className="border px-4 py-8 text-center text-gray-500">
                No elements defined. Add elements to this recipe.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </form>
  );
}
