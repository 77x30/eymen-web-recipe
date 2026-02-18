import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const WorkspaceContext = createContext(null);

export const useWorkspace = () => useContext(WorkspaceContext);

export const WorkspaceProvider = ({ children }) => {
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubdomain, setIsSubdomain] = useState(false);
  const [isMainDomain, setIsMainDomain] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [isIdentityDomain, setIsIdentityDomain] = useState(false);

  useEffect(() => {
    detectWorkspace();
  }, []);

  const detectWorkspace = async () => {
    try {
      const hostname = window.location.hostname;
      
      // Check if we're on a subdomain
      // barida.xyz, www.barida.xyz -> main site
      // workspace1.barida.xyz -> workspace
      // identity.barida.xyz -> identity verification
      const parts = hostname.split('.');
      
      console.log('Hostname:', hostname, 'Parts:', parts.length);
      
      // localhost or IP - treat as main domain for development
      if (hostname === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
        setIsMainDomain(true);
        setLoading(false);
        return;
      }
      
      // barida.xyz (2 parts) - main domain
      if (parts.length === 2) {
        setIsMainDomain(true);
        setLoading(false);
        return;
      }
      
      // Check for subdomain (e.g., workspace1.barida.xyz has 3 parts)
      if (parts.length >= 3) {
        const subdomain = parts[0];
        
        // Skip www and admin - these are main domain
        if (subdomain === 'www' || subdomain === 'admin') {
          setIsMainDomain(true);
          setLoading(false);
          return;
        }

        // Identity subdomain for biometric verification
        if (subdomain === 'identity') {
          setIsIdentityDomain(true);
          setLoading(false);
          return;
        }
        
        // Try to fetch workspace info
        try {
          const response = await api.get(`/workspaces/subdomain/${subdomain}`);
          setWorkspace(response.data);
          setIsSubdomain(true);
        } catch (err) {
          // Workspace not found - show 404
          if (err.response?.status === 404) {
            setNotFound(true);
          }
          console.log('Workspace not found:', subdomain);
        }
      }
    } catch (error) {
      console.error('Error detecting workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    workspace,
    isSubdomain,
    isMainDomain,
    loading,
    notFound,
    isIdentityDomain,
    workspaceName: workspace?.name || 'Barida Recipe Management'
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};
