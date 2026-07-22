import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Refresh, WarningTriangle,
  SunLight, HalfMoon, Computer
} from 'iconoir-react';
import { fetchSheetData } from './utils/sheetFetcher';
import { aggregateSurveyData } from './utils/dataAggregator';
import ConfigPanel from './components/ConfigPanel';
import Dashboard from './components/Dashboard';
import { DEFAULT_SHEET_CONFIG, CONFIG_PASSWORD } from './config';
import logoContinuum from './assets/logo-continuum.png';

export default function App() {
  const [config, setConfig] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [theme, setTheme] = useState('system'); // 'system', 'light', 'dark'
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Estados para proteger Ajustes y Restablecer
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'settings' | 'reset'

  const applyTheme = (themeName) => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark');
    if (themeName === 'light') {
      root.classList.add('theme-light');
    } else if (themeName === 'dark') {
      root.classList.add('theme-dark');
    }
  };

  const cycleTheme = () => {
    let nextTheme = 'system';
    if (theme === 'system') nextTheme = 'light';
    else if (theme === 'light') nextTheme = 'dark';
    else if (theme === 'dark') nextTheme = 'system';
    
    setTheme(nextTheme);
    localStorage.setItem('survey_theme', nextTheme);
    applyTheme(nextTheme);
  };

  // 1. Función para refrescar datos desde las Google Sheets
  const triggerRefresh = useCallback(async (activeConfig, background = false) => {
    if (!activeConfig || !activeConfig.sheets) return;
    
    if (!background) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const activeSheets = activeConfig.sheets.filter(s => s.url.trim() !== '');
      
      // Consultar todas las hojas en paralelo
      const fetchedSurveys = await Promise.all(
        activeSheets.map(async (sheet) => {
          const rows = await fetchSheetData(sheet.url);
          return {
            name: sheet.name,
            rows: rows
          };
        })
      );

      // Consolidar los resultados de todas las encuestas
      const consolidated = aggregateSurveyData(fetchedSurveys);
      
      // Guardar en cache y actualizar estado
      localStorage.setItem('survey_cache_data', JSON.stringify(consolidated));
      localStorage.setItem('survey_cache_timestamp', Date.now().toString());

      setData(consolidated);
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('Error al sincronizar las encuestas:', err);
      if (!background) {
        setError(err.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // 2. Cargar configuración, caché y tema desde localStorage al iniciar
  useEffect(() => {
    const savedTheme = localStorage.getItem('survey_theme') || 'system';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const savedConfigStr = localStorage.getItem('survey_config');
    const cachedDataStr = localStorage.getItem('survey_cache_data');
    const cachedTimestampStr = localStorage.getItem('survey_cache_timestamp');

    const hasDefaultConfig = DEFAULT_SHEET_CONFIG.sheets.some(s => s.url && s.url.trim() !== '');
    let activeConfig = null;

    if (savedConfigStr) {
      activeConfig = JSON.parse(savedConfigStr);
    } else if (hasDefaultConfig) {
      activeConfig = DEFAULT_SHEET_CONFIG;
    }

    if (activeConfig) {
      setConfig(activeConfig);

      if (cachedDataStr && cachedTimestampStr) {
        try {
          const parsedData = JSON.parse(cachedDataStr);
          const timestamp = Number(cachedTimestampStr);

          // Validar que el caché tenga la estructura esperada de la nueva versión (incluyendo demografía generacional de edad)
          if (parsedData && Array.isArray(parsedData.rawSurveys) && Array.isArray(parsedData.jtbdOpportunityData) && parsedData.demographics && parsedData.demographics.age && Object.keys(parsedData.demographics.age).length > 0) {
            setData(parsedData);
            setLastUpdated(timestamp);

            // Verificar si el caché ha expirado
            const expiryMs = activeConfig.syncHours * 60 * 60 * 1000;
            if (Date.now() - timestamp > expiryMs) {
              // Expirado: refrescar en segundo plano de manera asíncrona
              triggerRefresh(activeConfig, true);
            }
          } else {
            // Estructura incompatible: limpiar e iniciar refresco limpio
            localStorage.removeItem('survey_cache_data');
            localStorage.removeItem('survey_cache_timestamp');
            triggerRefresh(activeConfig, false);
          }
        } catch (_e) {
          localStorage.removeItem('survey_cache_data');
          localStorage.removeItem('survey_cache_timestamp');
          triggerRefresh(activeConfig, false);
        }
      } else {
        // Con configuración pero sin caché: refrescar en primer plano
        triggerRefresh(activeConfig, false);
      }
    } else {
      // Sin configuración ni valores por defecto: inicializar vacío
      setData(null);
      setLastUpdated(null);
    }
  }, [triggerRefresh]);

  // 3. Manejo de guardado del panel de configuración
  const handleSaveConfig = (newConfig) => {
    localStorage.setItem('survey_config', JSON.stringify(newConfig));
    setConfig(newConfig);
    setShowConfig(false);
    
    // Limpiar caché anterior
    localStorage.removeItem('survey_cache_data');
    localStorage.removeItem('survey_cache_timestamp');

    // Forzar actualización inmediata de los nuevos orígenes
    triggerRefresh(newConfig, false);
  };

  // 4. Volver a datos Mock / Restablecer configuración
  const confirmResetConfig = () => {
    if (window.confirm('¿Estás seguro de que deseas eliminar la configuración personalizada? Se volverá a cargar la configuración por defecto de la aplicación.')) {
      localStorage.removeItem('survey_config');
      localStorage.removeItem('survey_cache_data');
      localStorage.removeItem('survey_cache_timestamp');
      
      const hasDefaultConfig = DEFAULT_SHEET_CONFIG.sheets.some(s => s.url && s.url.trim() !== '');
      if (hasDefaultConfig) {
        setConfig(DEFAULT_SHEET_CONFIG);
        triggerRefresh(DEFAULT_SHEET_CONFIG, false);
      } else {
        setConfig(null);
        setData(null);
        setLastUpdated(null);
      }
      setError(null);
      setShowConfig(false);
    }
  };

  const handleResetConfig = () => {
    if (isUnlocked || !CONFIG_PASSWORD) {
      confirmResetConfig();
    } else {
      setPendingAction('reset');
      setShowPasswordPrompt(true);
      setPasswordError(false);
      setPasswordInput('');
    }
  };

  // 5. Manejo de botones protegidos por contraseña
  const handleSettingsClick = () => {
    if (showConfig) {
      setShowConfig(false);
      return;
    }
    if (isUnlocked || !CONFIG_PASSWORD) {
      setShowConfig(true);
    } else {
      setPendingAction('settings');
      setShowPasswordPrompt(true);
      setPasswordError(false);
      setPasswordInput('');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === CONFIG_PASSWORD) {
      setIsUnlocked(true);
      setShowPasswordPrompt(false);
      setPasswordError(false);
      
      if (pendingAction === 'settings') {
        setShowConfig(true);
      } else if (pendingAction === 'reset') {
        confirmResetConfig();
      }
      setPendingAction(null);
    } else {
      setPasswordError(true);
    }
  };

  // 5. Configurar timer periódico (cada 30 minutos)
  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (config && lastUpdated && !isRefreshing) {
        const expiryMs = config.syncHours * 60 * 60 * 1000;
        if (Date.now() - lastUpdated > expiryMs) {
          triggerRefresh(config, true); // Auto-sincronización silenciosa en background
        }
      }
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(checkInterval);
  }, [config, lastUpdated, triggerRefresh, isRefreshing]);

  // Hook para cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = () => setDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [dropdownOpen]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', overflowX: 'hidden', backgroundColor: 'transparent' }}>
      
      {/* Fondo difuminado de círculos de color (estilo ContinuumHQ) */}
      <div className="blurry-bg-container">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
        <div className="circle circle-5"></div>
      </div>

      {/* App Header */}
      <header className="app-header">
        <div className="header-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src={logoContinuum} 
            alt="Continuum" 
            style={{ 
              height: '20px', 
              display: 'block',
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none',
              opacity: theme === 'dark' ? 0.95 : 1
            }} 
          />
        </div>
        <div className="header-actions" style={{ position: 'relative' }}>
          {/* Único botón de engranaje sin etiqueta */}
          <button 
            className="btn btn-secondary btn-icon"
            onClick={(e) => { e.stopPropagation(); setDropdownOpen(!dropdownOpen); }}
            title="Opciones"
            style={{ width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Settings size={18} />
          </button>
          
          {/* Dropdown de opciones */}
          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '42px',
                right: 0,
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-md)',
                zIndex: 100,
                minWidth: '170px',
                display: 'flex',
                flexDirection: 'column',
                padding: '4px 0',
                overflow: 'hidden'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Opción 1: Modo / Tema */}
              <button 
                className="dropdown-item"
                onClick={() => { cycleTheme(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-primary)'
                }}
              >
                {theme === 'system' && <Computer size={14} />}
                {theme === 'light' && <SunLight size={14} />}
                {theme === 'dark' && <HalfMoon size={14} />}
                <span style={{ fontWeight: 500 }}>
                  Tema: {theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Oscuro'}
                </span>
              </button>

              {/* Opción 2: Ajustes */}
              <button 
                className="dropdown-item"
                onClick={() => { handleSettingsClick(); setDropdownOpen(false); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  borderTop: '1px solid var(--border-color)'
                }}
              >
                <Settings size={14} />
                <span style={{ fontWeight: 500 }}>
                  {config ? 'Ajustes' : 'Configurar'}
                </span>
              </button>

              {/* Opción 3: Restablecer */}
              {config && (
                <button 
                  className="dropdown-item"
                  onClick={() => { handleResetConfig(); setDropdownOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: 'var(--danger-color)',
                    borderTop: '1px solid var(--border-color)'
                  }}
                >
                  <WarningTriangle size={14} />
                  <span style={{ fontWeight: 500 }}>
                    Restablecer
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Body Container */}
      <main className="app-container">
        
        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WarningTriangle size={16} />
              <strong>Error de Sincronización</strong>
            </div>
            <p style={{ color: 'inherit', fontSize: '13px', margin: 0 }}>{error}</p>
            <button 
              className="btn btn-secondary" 
              onClick={() => triggerRefresh(config, false)}
              style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '11px', height: 'auto', marginTop: '4px' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {showConfig ? (
          <ConfigPanel 
            currentConfig={config ? { ...config } : null}
            onSave={handleSaveConfig}
            onCancel={() => setShowConfig(false)}
            showCancel={!!config}
          />
        ) : (
          !config ? (
            <div className="card" style={{ maxWidth: '540px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
              <WarningTriangle size={48} style={{ color: 'var(--accent-color)' }} />
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 500 }}>Estudio Billeteras Digitales 2026</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.6' }}>
                  No hay encuestas configuradas en la aplicación. Para poder visualizar el dashboard consolidado y analizar las metas financieras de los usuarios, debes configurar las URLs de tus hojas de respuestas de Google Sheets.
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleSettingsClick}
                style={{ padding: '10px 24px' }}
              >
                Configurar Hojas de Google Sheets
              </button>
            </div>
          ) : (
            isRefreshing && !data ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
                <Refresh size={32} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Cargando datos de las encuestas...</p>
              </div>
            ) : (
              data ? (
                <Dashboard 
                  data={data}
                  lastUpdated={lastUpdated}
                  onForceRefresh={() => triggerRefresh(config, false)}
                  isRefreshing={isRefreshing}
                  theme={theme}
                />
              ) : (
                <div className="card" style={{ maxWidth: '540px', margin: '40px auto', width: '100%', textAlign: 'center', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                  <WarningTriangle size={48} style={{ color: 'var(--danger-color)' }} />
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 500 }}>No se pudieron cargar los datos</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.6' }}>
                      Las URLs configuradas no respondieron correctamente. Por favor, asegúrate de que cada Google Sheet esté compartida como <strong>"Cualquier persona con el enlace puede ver" (Lector)</strong> y que los enlaces sean correctos.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => triggerRefresh(config, false)}
                    >
                      Reintentar Sincronización
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={handleSettingsClick}
                    >
                      Revisar Enlaces
                    </button>
                  </div>
                </div>
              )
            )
          )
        )}
      </main>

      {/* Clean, minimalist footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: 'auto' }}>
        © 2026 Continuum Dashboard • Desarrollado para Google Sheets
      </footer>

      {/* Modal de prompt de contraseña */}
      {showPasswordPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(2px)'
        }}>
          <div className="card" style={{ maxWidth: '360px', width: '100%', padding: '24px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 500, margin: 0 }}>Acceso Protegido</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
              Ingresa la contraseña del sistema para poder modificar la configuración de las encuestas.
            </p>
            
            <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                type="password"
                className="text-input"
                placeholder="Contraseña"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
                style={{ width: '100%', height: '36px', padding: '0 12px' }}
              />
              {passwordError && (
                <span style={{ fontSize: '12px', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Contraseña incorrecta. Inténtalo de nuevo.
                </span>
              )}
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowPasswordPrompt(false)}
                  style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ height: '32px', padding: '0 16px', fontSize: '12px' }}
                >
                  Acceder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
