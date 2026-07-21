import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, Database, HelpCircle, FileSpreadsheet, RefreshCw, AlertTriangle,
  Sun, Moon, Monitor
} from 'lucide-react';
import { fetchSheetData } from './utils/sheetFetcher';
import { aggregateSurveyData } from './utils/dataAggregator';
import { MOCK_SURVEYS } from './utils/mockData';
import ConfigPanel from './components/ConfigPanel';
import Dashboard from './components/Dashboard';
import { DEFAULT_SHEET_CONFIG } from './config';

export default function App() {
  const [config, setConfig] = useState(null);
  const [data, setData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [isUsingMocks, setIsUsingMocks] = useState(false);
  const [theme, setTheme] = useState('system'); // 'system', 'light', 'dark'

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

  // 1. Cargar configuración, caché y tema desde localStorage al iniciar
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
        const parsedData = JSON.parse(cachedDataStr);
        const timestamp = Number(cachedTimestampStr);
        
        setData(parsedData);
        setLastUpdated(timestamp);
        setIsUsingMocks(false);

        // Verificar si el caché ha expirado
        const expiryMs = activeConfig.syncHours * 60 * 60 * 1000;
        if (Date.now() - timestamp > expiryMs) {
          // Expirado: refrescar en segundo plano de manera asíncrona
          triggerRefresh(activeConfig, true);
        }
      } else {
        // Con configuración pero sin caché: refrescar en primer plano
        triggerRefresh(activeConfig, false);
      }
    } else {
      // Sin configuración ni valores por defecto: Cargar datos Mock de demostración
      const aggregatedMocks = aggregateSurveyData(MOCK_SURVEYS);
      setData(aggregatedMocks);
      setLastUpdated(Date.now());
      setIsUsingMocks(true);
    }
  }, []);

  // 2. Función para refrescar datos desde las Google Sheets
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
      setIsUsingMocks(false);
    } catch (err) {
      console.error('Error al sincronizar las encuestas:', err);
      if (!background) {
        setError(err.message);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

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
  const handleResetConfig = () => {
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
        const aggregatedMocks = aggregateSurveyData(MOCK_SURVEYS);
        setData(aggregatedMocks);
        setLastUpdated(Date.now());
        setIsUsingMocks(true);
      }
      setError(null);
      setShowConfig(false);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* App Header */}
      <header className="app-header">
        <div className="header-logo">
          <FileSpreadsheet size={22} />
          <span className="header-title">Survey Dashboard</span>
        </div>
        <div className="header-actions">
          {isUsingMocks && (
            <span className="badge badge-info" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Modo Demostración (Datos Mock)
            </span>
          )}
          
          <button 
            className="btn btn-secondary btn-icon"
            onClick={cycleTheme}
            title={`Tema: ${theme === 'system' ? 'Sistema' : theme === 'light' ? 'Claro' : 'Oscuro'}`}
            style={{ width: '36px', height: '36px', borderRadius: '50%' }}
          >
            {theme === 'system' && <Monitor size={16} />}
            {theme === 'light' && <Sun size={16} />}
            {theme === 'dark' && <Moon size={16} />}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => setShowConfig(!showConfig)}
            style={{ height: '36px', padding: '0 12px' }}
          >
            <Settings size={16} />
            {config ? 'Ajustes' : 'Configurar'}
          </button>
          
          {config && (
            <button 
              className="btn btn-secondary"
              onClick={handleResetConfig}
              style={{ color: 'var(--danger-color)', borderColor: 'var(--danger-color)', height: '36px', padding: '0 12px' }}
            >
              Restablecer
            </button>
          )}
        </div>
      </header>

      {/* Main Body Container */}
      <main className="app-container">
        
        {error && (
          <div className="alert alert-danger" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} />
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
          data && (
            <Dashboard 
              data={data}
              lastUpdated={lastUpdated}
              onForceRefresh={() => triggerRefresh(config, false)}
              isRefreshing={isRefreshing}
            />
          )
        )}
      </main>

      {/* Clean, minimalist footer */}
      <footer style={{ borderTop: '1px solid var(--border-color)', padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '12px', marginTop: 'auto' }}>
        Survey Dashboard &copy; {new Date().getFullYear()} &bull; Desarrollado para Google Sheets
      </footer>

    </div>
  );
}
