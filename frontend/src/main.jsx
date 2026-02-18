import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { WorkspaceProvider } from './context/WorkspaceContext'
import './index.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 max-w-lg text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Uygulama Hatası</h1>
            <p className="text-gray-300 mb-4">Bir hata oluştu. Lütfen sayfayı yenileyin.</p>
            <pre className="text-left text-xs text-red-300 bg-black/50 p-4 rounded overflow-auto max-h-48">
              {this.state.error?.toString()}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <WorkspaceProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </WorkspaceProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
