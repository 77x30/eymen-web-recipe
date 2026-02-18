import { useState, useEffect, useRef } from 'react';

export default function VirtualKeyboard({ 
  isOpen, 
  onClose, 
  onSubmit, 
  dataType = 'string', 
  currentValue = '',
  fieldName = '',
  unit = '',
  min = null,
  max = null
}) {
  const [value, setValue] = useState(currentValue);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(currentValue);
    setError('');
  }, [currentValue, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const isNumeric = dataType === 'integer' || dataType === 'float';
  const isInteger = dataType === 'integer';

  const handleKeyPress = (key) => {
    setError('');
    
    if (key === 'backspace') {
      setValue(prev => prev.slice(0, -1));
    } else if (key === 'clear') {
      setValue('');
    } else if (key === 'enter') {
      handleSubmit();
    } else if (key === '.' && !isInteger && !value.includes('.')) {
      setValue(prev => prev + '.');
    } else if (key === '-' && isNumeric && value === '') {
      setValue('-');
    } else if (key === ' ' && !isNumeric) {
      setValue(prev => prev + ' ');
    } else if (key.length === 1) {
      if (isNumeric) {
        if (/[0-9]/.test(key)) {
          setValue(prev => prev + key);
        }
      } else {
        setValue(prev => prev + key);
      }
    }
  };

  const handleSubmit = () => {
    // Validation
    if (isNumeric) {
      const num = parseFloat(value);
      if (isNaN(num) && value !== '' && value !== '-') {
        setError('Invalid number');
        return;
      }
      if (min !== null && num < min) {
        setError(`Min: ${min}`);
        return;
      }
      if (max !== null && num > max) {
        setError(`Max: ${max}`);
        return;
      }
    }
    
    onSubmit(value);
    onClose();
  };

  if (!isOpen) return null;

  // Number pad layout
  const numericKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    [isInteger ? '' : '.', '0', '-']
  ];

  // Full keyboard layout
  const alphaKeys = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '_', '-']
  ];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-white font-bold text-lg">{fieldName}</h3>
            <p className="text-blue-200 text-sm">
              {dataType === 'integer' ? 'Integer' : dataType === 'float' ? 'Decimal' : 'Text'}
              {unit && ` • ${unit}`}
              {min !== null && max !== null && ` • Range: ${min} - ${max}`}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Input Display */}
        <div className="p-4 bg-gray-800">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`w-full text-3xl font-mono p-4 rounded-xl text-right pr-16 
                ${error ? 'bg-red-900/50 border-2 border-red-500 text-red-200' : 'bg-gray-700 text-white border-2 border-gray-600'}
                focus:outline-none focus:border-blue-500`}
              placeholder="Enter value..."
              readOnly
            />
            {unit && (
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                {unit}
              </span>
            )}
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2 text-center">{error}</p>
          )}
        </div>

        {/* Keyboard */}
        <div className="p-4 bg-gray-850">
          {isNumeric ? (
            // Numeric Keyboard
            <div className="grid grid-cols-4 gap-2">
              {numericKeys.flat().filter(k => k).map((key, idx) => (
                <button
                  key={idx}
                  onClick={() => handleKeyPress(key)}
                  className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-2xl font-bold py-5 rounded-xl transition shadow-lg"
                >
                  {key}
                </button>
              ))}
              <button
                onClick={() => handleKeyPress('backspace')}
                className="bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-400 text-white text-xl font-bold py-5 rounded-xl transition shadow-lg"
              >
                ⌫
              </button>
              <button
                onClick={() => handleKeyPress('clear')}
                className="bg-red-600 hover:bg-red-500 active:bg-red-400 text-white text-xl font-bold py-5 rounded-xl transition shadow-lg"
              >
                CLR
              </button>
              <button
                onClick={() => handleKeyPress('enter')}
                className="col-span-2 bg-green-600 hover:bg-green-500 active:bg-green-400 text-white text-xl font-bold py-5 rounded-xl transition shadow-lg"
              >
                ENTER ↵
              </button>
            </div>
          ) : (
            // Full Keyboard
            <div className="space-y-2">
              {alphaKeys.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1">
                  {row.map((key, keyIdx) => (
                    <button
                      key={keyIdx}
                      onClick={() => handleKeyPress(key)}
                      className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-lg font-bold w-12 h-12 rounded-lg transition shadow-lg"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={() => handleKeyPress(' ')}
                  className="bg-gray-700 hover:bg-gray-600 text-white text-lg font-bold px-20 py-3 rounded-lg transition shadow-lg"
                >
                  SPACE
                </button>
                <button
                  onClick={() => handleKeyPress('backspace')}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white text-lg font-bold px-6 py-3 rounded-lg transition shadow-lg"
                >
                  ⌫
                </button>
                <button
                  onClick={() => handleKeyPress('clear')}
                  className="bg-red-600 hover:bg-red-500 text-white text-lg font-bold px-6 py-3 rounded-lg transition shadow-lg"
                >
                  CLR
                </button>
                <button
                  onClick={() => handleKeyPress('enter')}
                  className="bg-green-600 hover:bg-green-500 text-white text-lg font-bold px-8 py-3 rounded-lg transition shadow-lg"
                >
                  ENTER ↵
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-gray-800 px-4 py-2 text-center text-gray-500 text-sm border-t border-gray-700">
          Touch keyboard • Press ENTER to confirm
        </div>
      </div>
    </div>
  );
}
