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
  const [shift, setShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(currentValue);
    setCursorPos(currentValue.length);
    setError('');
  }, [currentValue, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, [isOpen, cursorPos]);

  const isNumeric = dataType === 'integer' || dataType === 'float';
  const isInteger = dataType === 'integer';
  const isUpperCase = shift || capsLock;

  const handleKeyPress = (key) => {
    setError('');
    let newValue = value;
    let newPos = cursorPos;
    
    switch(key) {
      case 'BACKSPACE':
        if (cursorPos > 0) {
          newValue = value.slice(0, cursorPos - 1) + value.slice(cursorPos);
          newPos = cursorPos - 1;
        }
        break;
      case 'DELETE':
        if (cursorPos < value.length) {
          newValue = value.slice(0, cursorPos) + value.slice(cursorPos + 1);
        }
        break;
      case 'CLEAR':
        newValue = '';
        newPos = 0;
        break;
      case 'ENTER':
        handleSubmit();
        return;
      case 'SPACE':
        if (!isNumeric) {
          newValue = value.slice(0, cursorPos) + ' ' + value.slice(cursorPos);
          newPos = cursorPos + 1;
        }
        break;
      case 'LEFT':
        newPos = Math.max(0, cursorPos - 1);
        break;
      case 'RIGHT':
        newPos = Math.min(value.length, cursorPos + 1);
        break;
      case 'HOME':
        newPos = 0;
        break;
      case 'END':
        newPos = value.length;
        break;
      case 'SHIFT':
        setShift(!shift);
        return;
      case 'CAPS':
        setCapsLock(!capsLock);
        return;
      case '+/-':
        if (isNumeric) {
          if (value.startsWith('-')) {
            newValue = value.slice(1);
            newPos = Math.max(0, cursorPos - 1);
          } else {
            newValue = '-' + value;
            newPos = cursorPos + 1;
          }
        }
        break;
      case '.':
        if (dataType === 'float' && !value.includes('.')) {
          newValue = value.slice(0, cursorPos) + '.' + value.slice(cursorPos);
          newPos = cursorPos + 1;
        }
        break;
      default:
        // Regular character
        if (isNumeric) {
          if (/[0-9]/.test(key)) {
            newValue = value.slice(0, cursorPos) + key + value.slice(cursorPos);
            newPos = cursorPos + 1;
          }
        } else {
          let char = key;
          if (isUpperCase && /[a-zğüşıöç]/.test(key)) {
            char = key.toUpperCase();
          }
          newValue = value.slice(0, cursorPos) + char + value.slice(cursorPos);
          newPos = cursorPos + 1;
          if (shift) setShift(false);
        }
    }
    
    setValue(newValue);
    setCursorPos(newPos);
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleSubmit = () => {
    if (isNumeric) {
      const num = parseFloat(value);
      if (isNaN(num) && value !== '' && value !== '-') {
        setError('Geçersiz sayı');
        return;
      }
      if (min !== null && num < min) {
        setError(`Minimum: ${min}`);
        return;
      }
      if (max !== null && num > max) {
        setError(`Maksimum: ${max}`);
        return;
      }
    }
    
    onSubmit(value);
    onClose();
  };

  if (!isOpen) return null;

  // Number pad layout - correct order
  const numericKeys = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['+/-', '0', dataType === 'float' ? '.' : '00']
  ];

  // Turkish Q keyboard layout
  const letterRows = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'ı', 'o', 'p', 'ğ', 'ü'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ş', 'i'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', 'ö', 'ç']
  ];

  const numberRow = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  const symbolRow = ['!', '"', '#', '₺', '%', '&', '/', '(', ')', '='];
  const punctuation = ['.', ',', '?', '!', '-', '_', '@', ':', ';', "'"];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50" onClick={onClose}>
      <div 
        className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-3xl w-full max-w-5xl shadow-2xl border-t border-gray-600"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gray-800 rounded-t-3xl px-6 py-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <span className="icon text-blue-400 text-2xl">keyboard</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{fieldName}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs ${
                  dataType === 'integer' ? 'bg-blue-500/30 text-blue-300' :
                  dataType === 'float' ? 'bg-green-500/30 text-green-300' :
                  'bg-purple-500/30 text-purple-300'
                }`}>
                  {dataType === 'integer' ? 'Tam Sayı' : dataType === 'float' ? 'Ondalık' : 'Metin'}
                </span>
                {unit && <span className="text-gray-500">• {unit}</span>}
                {min !== null && max !== null && (
                  <span className="text-gray-500">• Aralık: {min} - {max}</span>
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-700 rounded-xl p-3 transition"
          >
            <span className="icon text-2xl">close</span>
          </button>
        </div>

        {/* Input Display */}
        <div className="p-4 bg-gray-800/50">
          <div className="bg-gray-950 rounded-2xl p-4 flex items-center gap-4 border border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setCursorPos(e.target.selectionStart);
              }}
              onSelect={(e) => setCursorPos(e.target.selectionStart)}
              className={`flex-1 bg-transparent text-4xl font-mono text-right outline-none ${
                error ? 'text-red-400' : 'text-white'
              }`}
              placeholder="0"
            />
            {unit && (
              <span className="text-2xl text-gray-500 font-medium">{unit}</span>
            )}
          </div>
          {error && (
            <p className="text-red-400 text-center mt-2 flex items-center justify-center gap-2">
              <span className="icon icon-sm">error</span> {error}
            </p>
          )}
        </div>

        {/* Keyboard */}
        <div className="p-4">
          {isNumeric ? (
            // Numeric Keyboard
            <div className="flex gap-4 max-w-2xl mx-auto">
              {/* Number Pad */}
              <div className="flex-1">
                <div className="grid grid-cols-3 gap-2">
                  {numericKeys.flat().map((key, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleKeyPress(key)}
                      className={`py-6 text-3xl font-bold rounded-2xl transition active:scale-95 ${
                        key === '+/-' 
                          ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          : 'bg-gray-800 hover:bg-gray-700 text-white shadow-lg'
                      }`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Panel - Actions & Navigation */}
              <div className="w-56 flex flex-col gap-2">
                {/* Clear & Backspace */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleKeyPress('CLEAR')}
                    className="py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition active:scale-95"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handleKeyPress('BACKSPACE')}
                    className="py-4 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition active:scale-95 flex items-center justify-center"
                  >
                    <span className="icon text-2xl">backspace</span>
                  </button>
                </div>

                {/* Arrow Keys */}
                <div className="bg-gray-800 rounded-xl p-2">
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      onClick={() => handleKeyPress('HOME')}
                      className="py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition"
                    >
                      HOME
                    </button>
                    <button
                      onClick={() => handleKeyPress('DELETE')}
                      className="py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition"
                    >
                      DEL
                    </button>
                    <button
                      onClick={() => handleKeyPress('END')}
                      className="py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs font-medium transition"
                    >
                      END
                    </button>
                  </div>
                  <div className="flex justify-center gap-1 mt-1">
                    <button
                      onClick={() => handleKeyPress('LEFT')}
                      className="w-14 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center justify-center"
                    >
                      <span className="icon">arrow_back</span>
                    </button>
                    <button
                      onClick={() => handleKeyPress('RIGHT')}
                      className="w-14 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition flex items-center justify-center"
                    >
                      <span className="icon">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Mouse Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleSubmit}
                    className="py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition active:scale-95 flex flex-col items-center"
                    title="Sol Tık - Kaydet"
                  >
                    <span className="icon">mouse</span>
                    <span className="text-xs mt-1">SOL</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition active:scale-95 flex flex-col items-center"
                    title="Sağ Tık - İptal"
                  >
                    <span className="icon">mouse</span>
                    <span className="text-xs mt-1">SAĞ</span>
                  </button>
                </div>

                {/* Enter Button */}
                <button
                  onClick={handleSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-xl transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <span className="icon">check</span>
                  KAYDET
                </button>
              </div>
            </div>
          ) : (
            // Full Text Keyboard
            <div className="space-y-2">
              {/* Number/Symbol Row */}
              <div className="flex justify-center gap-1">
                {(shift ? symbolRow : numberRow).map((key, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleKeyPress(key)}
                    className="w-11 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition active:scale-95"
                  >
                    {key}
                  </button>
                ))}
                <button
                  onClick={() => handleKeyPress('BACKSPACE')}
                  className="w-20 h-11 bg-yellow-600 hover:bg-yellow-500 text-white rounded-xl transition active:scale-95 flex items-center justify-center"
                >
                  <span className="icon">backspace</span>
                </button>
              </div>

              {/* Letter Rows */}
              {letterRows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-1">
                  {rowIdx === 2 && (
                    <button
                      onClick={() => handleKeyPress('SHIFT')}
                      className={`w-14 h-11 rounded-xl font-medium transition active:scale-95 flex items-center justify-center ${
                        shift ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      <span className="icon">shift</span>
                    </button>
                  )}
                  {row.map((key, keyIdx) => (
                    <button
                      key={keyIdx}
                      onClick={() => handleKeyPress(key)}
                      className="w-11 h-11 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition active:scale-95"
                    >
                      {isUpperCase ? key.toUpperCase() : key}
                    </button>
                  ))}
                  {rowIdx === 1 && (
                    <button
                      onClick={handleSubmit}
                      className="w-20 h-11 bg-green-600 hover:bg-green-500 text-white rounded-xl font-medium transition active:scale-95 flex items-center justify-center"
                    >
                      ENTER
                    </button>
                  )}
                  {rowIdx === 2 && (
                    <button
                      onClick={() => handleKeyPress('CAPS')}
                      className={`w-14 h-11 rounded-xl font-medium transition active:scale-95 flex items-center justify-center text-xs ${
                        capsLock ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      CAPS
                    </button>
                  )}
                </div>
              ))}

              {/* Punctuation Row */}
              <div className="flex justify-center gap-1">
                {punctuation.map((key, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleKeyPress(key)}
                    className="w-11 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition active:scale-95"
                  >
                    {key}
                  </button>
                ))}
              </div>

              {/* Bottom Row - Space & Navigation */}
              <div className="flex justify-center gap-2 mt-2">
                {/* Left Actions */}
                <button
                  onClick={() => handleKeyPress('CLEAR')}
                  className="px-4 h-11 bg-red-600 hover:bg-red-500 text-white rounded-xl font-medium transition active:scale-95"
                >
                  TEMIZLE
                </button>

                {/* Arrow Keys */}
                <button
                  onClick={() => handleKeyPress('LEFT')}
                  className="w-11 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition active:scale-95 flex items-center justify-center"
                >
                  <span className="icon">arrow_back</span>
                </button>

                {/* Space Bar */}
                <button
                  onClick={() => handleKeyPress('SPACE')}
                  className="w-64 h-11 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition active:scale-95 font-medium"
                >
                  BOŞLUK
                </button>

                {/* Arrow Keys */}
                <button
                  onClick={() => handleKeyPress('RIGHT')}
                  className="w-11 h-11 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition active:scale-95 flex items-center justify-center"
                >
                  <span className="icon">arrow_forward</span>
                </button>

                {/* Mouse Actions */}
                <button
                  onClick={handleSubmit}
                  className="px-4 h-11 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition active:scale-95 flex items-center gap-2"
                  title="Sol Tık - Kaydet"
                >
                  <span className="icon icon-sm">mouse</span>
                  <span className="text-sm font-medium">SOL</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-4 h-11 bg-gray-600 hover:bg-gray-500 text-white rounded-xl transition active:scale-95 flex items-center gap-2"
                  title="Sağ Tık - İptal"
                >
                  <span className="icon icon-sm">mouse</span>
                  <span className="text-sm font-medium">SAĞ</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-800/50 px-6 py-3 flex justify-between items-center border-t border-gray-700">
          <div className="flex items-center gap-6 text-gray-500 text-sm">
            <span className="flex items-center gap-1">
              <span className="icon icon-sm">mouse</span> Sol Tık = Kaydet
            </span>
            <span className="flex items-center gap-1">
              <span className="icon icon-sm">mouse</span> Sağ Tık = İptal
            </span>
            <span className="flex items-center gap-1">
              <span className="icon icon-sm">keyboard_return</span> Enter = Onayla
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium transition"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              className="px-8 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition flex items-center gap-2"
            >
              <span className="icon">check</span>
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
