import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const DEFAULT_VERSION = '1.0.0';

const VersionContext = createContext();

export function VersionProvider({ children }) {
  const [version, setVersion] = useState(DEFAULT_VERSION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVersion();
  }, []);

  const fetchVersion = async () => {
    try {
      const response = await api.get('/system/version');
      if (response.data?.version) {
        setVersion(response.data.version);
      }
    } catch (error) {
      // Use default version if API fails
    } finally {
      setLoading(false);
    }
  };

  const refreshVersion = () => {
    fetchVersion();
  };

  return (
    <VersionContext.Provider value={{ version, loading, refreshVersion }}>
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const context = useContext(VersionContext);
  if (!context) {
    return { version: DEFAULT_VERSION, loading: false, refreshVersion: () => {} };
  }
  return context;
}
