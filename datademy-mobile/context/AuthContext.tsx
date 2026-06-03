import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  jwt: string | null;
  gToken: string | null;
  guardarTokens: (jwt: string, gToken: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  cargando: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwt] = useState<string | null>(null);
  const [gToken, setGToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la app, revisamos si el usuario ya tenía sesión iniciada en el SecureStore
  useEffect(() => {
    async function cargarTokens() {
      try {
        const storedJwt = await SecureStore.getItemAsync('jwt');
        const storedGToken = await SecureStore.getItemAsync('gToken');
        
        if (storedJwt && storedGToken) {
          setJwt(storedJwt);
          setGToken(storedGToken);
        }
      } catch (error) {
        console.error("Error leyendo del SecureStore", error);
      } finally {
        setCargando(false);
      }
    }
    
    cargarTokens();
  }, []);

  const guardarTokens = async (nuevoJwt: string, nuevoGToken: string) => {
    await SecureStore.setItemAsync('jwt', nuevoJwt);
    await SecureStore.setItemAsync('gToken', nuevoGToken);
    setJwt(nuevoJwt);
    setGToken(nuevoGToken);
  };

  const cerrarSesion = async () => {
    await SecureStore.deleteItemAsync('jwt');
    await SecureStore.deleteItemAsync('gToken');
    setJwt(null);
    setGToken(null);
  };

  return (
    <AuthContext.Provider value={{ jwt, gToken, guardarTokens, cerrarSesion, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}