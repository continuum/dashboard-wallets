/**
 * CONFIGURACIÓN POR DEFECTO PARA EL DASHBOARD
 * 
 * Configura aquí los enlaces de compartir de tus Google Sheets reales usando variables de entorno.
 * Cualquier persona que visite la web de GitHub Pages verá estos datos por defecto.
 * 
 * Requisito: Las Google Sheets deben estar compartidas con acceso:
 * "Cualquier persona con el enlace puede ver" (Lector).
 */
export const DEFAULT_SHEET_CONFIG = {
  syncHours: 2, // Horas de caché recomendadas
  sheets: [
    {
      name: 'Encuesta Continuum',
      url: import.meta.env.VITE_URL_CONTINUUM || ''
    },
    {
      name: 'Encuesta Chócale',
      url: import.meta.env.VITE_URL_CHOCALE || ''
    },
    {
      name: 'Encuesta Chilepay',
      url: import.meta.env.VITE_URL_CHILEPAY || ''
    }
  ]
};

// Contraseña para proteger el acceso al panel de "Ajustes" en el dashboard.
// Nota: Dado que es un sitio estático, se valida en el cliente.
export const CONFIG_PASSWORD = import.meta.env.VITE_CONFIG_PASSWORD || '';
