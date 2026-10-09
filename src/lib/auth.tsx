import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
export const AuthContext=createContext<{user:User|null;ready:boolean}>({user:null,ready:false});
export const useAuth=()=>useContext(AuthContext);
