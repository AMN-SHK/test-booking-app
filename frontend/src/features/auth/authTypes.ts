import { createContext } from 'react';
import type { AuthState, UserDTO } from '../../types/auth';

export interface AuthContextType extends AuthState {
  login: (token: string, user: UserDTO) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

