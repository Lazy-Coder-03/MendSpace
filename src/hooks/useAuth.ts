import { useContext } from 'react';
import { AuthContext, type AuthContextType } from '@/providers/FirebaseProvider';

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context;
};
