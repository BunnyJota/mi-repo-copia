/**
 * Cliente de Supabase
 * 
 * Configuración:
 * 1. Crea un archivo .env.local en la raíz del proyecto
 * 2. Añade las siguientes variables:
 *    VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
 *    VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key
 * 
 * Obtén estas credenciales en: Supabase Dashboard -> Settings -> API
 */
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Validación de variables de entorno
if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error(`
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️  ERROR: Variables de entorno de Supabase no configuradas     ║
╠══════════════════════════════════════════════════════════════════╣
║  Crea un archivo .env.local en la raíz del proyecto con:         ║
║                                                                  ║
║  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co               ║
║  VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key                       ║
║                                                                  ║
║  Obtén estas credenciales en:                                    ║
║  Supabase Dashboard -> Settings -> API                           ║
╚══════════════════════════════════════════════════════════════════╝
  `);
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'placeholder-key',
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);