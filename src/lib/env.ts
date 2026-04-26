
export interface TypedEnv {
  GEMINI_API_KEY: string;
  VITE_MYFATOORAH_TOKEN: string;
  VITE_MYFATOORAH_API_URL: string;
  VITE_APP_URL: string;
  APP_URL: string;
  MYFATOORAH_API_KEY: string;
  VITE_SPLASH_TITLE_EN: string;
  VITE_SPLASH_TITLE_AR: string;
  VITE_SPLASH_BG_COLOR: string;
  VITE_SPLASH_TEXT_COLOR: string;
  VITE_SPLASH_ANIMATION: string;
  VITE_FONT_FAMILY_SANS: string;
  VITE_FONT_FAMILY_DISPLAY: string;
}

export const getEnv = (key: keyof TypedEnv | string): string => {
  // Try process.env first (Server-side)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key] as string;
    // Also try VITE_ prefix on server if needed for shared vars
    const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
    if (process.env[viteKey]) return process.env[viteKey] as string;
  }
  
  // Try import.meta.env (Client-side)
  // Use a safe check since import.meta.env is a compile-time transform in Vite
  try {
    const env = (import.meta as any).env;
    if (env) {
      const viteKey = key.startsWith('VITE_') ? key : `VITE_${key}`;
      return env[viteKey] || env[key] || '';
    }
  } catch (e) {
    // Fallback if import.meta is not available
  }
  
  return '';
};
