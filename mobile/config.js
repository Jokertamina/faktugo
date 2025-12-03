// faktugo/mobile/config.js
// Configuración fija que debe usar la app móvil en PRODUCCIÓN.
// Para desarrollo, si quieres apuntar a otro backend o Supabase,
// puedes cambiar estos valores temporalmente en tu máquina.

// URL base de la API web (Next.js)
export const API_BASE_URL = "https://www.faktugo.com";

// Configuración de Supabase (misma que en la web)
export const SUPABASE_URL = "https://gvfosbunvfodjicypsmo.supabase.co";

// Clave anon pública de Supabase (segura para exponer en el cliente)
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2Zm9zYnVudmZvZGppY3lwc21vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2MjQsImV4cCI6MjA3OTc0ODYyNH0.g6HeyQ81DuRQTLz_O25HJCwYkMLR0aheHx_Ms48ChPU";
