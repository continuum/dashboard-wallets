import React, { useState } from 'react';
import { Settings, HelpCircle, FloppyDisk, Page } from 'iconoir-react';
import { extractSpreadsheetId } from '../utils/sheetFetcher';

export default function ConfigPanel({ currentConfig, onSave, onCancel, showCancel }) {
  const [configs, setConfigs] = useState(
    currentConfig || [
      { name: 'Encuesta 1', url: '' },
      { name: 'Encuesta 2', url: '' },
      { name: 'Encuesta 3', url: '' },
    ]
  );
  const [syncHours, setSyncHours] = useState(currentConfig?.syncHours || 2);
  const [errors, setErrors] = useState(['', '', '']);
  const [generalError, setGeneralError] = useState('');

  const handleUrlChange = (index, val) => {
    const nextConfigs = [...configs];
    nextConfigs[index].url = val;
    setConfigs(nextConfigs);

    const nextErrors = [...errors];
    if (val && !extractSpreadsheetId(val)) {
      nextErrors[index] = 'URL inválida. Debe ser un enlace de Google Sheets.';
    } else {
      nextErrors[index] = '';
    }
    setErrors(nextErrors);
  };

  const handleNameChange = (index, val) => {
    const nextConfigs = [...configs];
    nextConfigs[index].name = val;
    setConfigs(nextConfigs);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');

    // Validar que al menos una URL esté provista e id válido
    const activeConfigs = configs.filter(c => c.url.trim() !== '');
    if (activeConfigs.length === 0) {
      setGeneralError('Debes ingresar al menos una URL de Google Sheet para continuar.');
      return;
    }

    const hasErrors = errors.some(err => err !== '');
    if (hasErrors) {
      setGeneralError('Por favor corrige las URLs inválidas antes de guardar.');
      return;
    }

    onSave({
      sheets: configs.map(c => ({
        name: c.name.trim() || `Encuesta ${c.index + 1}`,
        url: c.url.trim()
      })),
      syncHours: Number(syncHours)
    });
  };

  return (
    <div className="card" style={{ maxWidth: '640px', margin: '40px auto 0 auto', width: '100%' }}>
      <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} style={{ color: 'var(--accent-color)' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 500 }}>Configuración de Google Sheets</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
          Ingresa los enlaces de compartir de las hojas de cálculo de respuestas de Google Sheets.
          Asegúrate de que estén compartidas como <strong>"Cualquier persona con el enlace puede ver"</strong>.
        </p>

        {configs.map((config, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div className="input-group" style={{ flex: '1' }}>
                <label className="input-label">Nombre de la Encuesta {idx + 1}</label>
                <input
                  type="text"
                  className="text-input"
                  value={config.name}
                  onChange={(e) => handleNameChange(idx, e.target.value)}
                  placeholder={`Ej. Encuesta ${idx + 1}`}
                  required
                />
              </div>
              <div className="input-group" style={{ flex: '3' }}>
                <label className="input-label">Enlace de Compartir Google Sheet</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="text-input"
                    value={config.url}
                    onChange={(e) => handleUrlChange(idx, e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  />
                </div>
              </div>
            </div>
            {errors[idx] && (
              <span style={{ color: 'var(--danger-color)', fontSize: '12px', marginTop: '4px' }}>
                {errors[idx]}
              </span>
            )}
          </div>
        ))}

        <div className="input-group">
          <label className="input-label">Frecuencia de Auto-Sincronización</label>
          <select
            className="text-input"
            value={syncHours}
            onChange={(e) => setSyncHours(Number(e.target.value))}
            style={{ appearance: 'none', cursor: 'pointer' }}
          >
            <option value={1}>Cada 1 hora</option>
            <option value={2}>Cada 2 horas (Recomendado)</option>
            <option value={4}>Cada 4 horas</option>
            <option value={8}>Cada 8 horas</option>
            <option value={12}>Cada 12 horas</option>
          </select>
        </div>

        {generalError && (
          <div className="alert alert-danger">
            {generalError}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          {showCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
          <button type="submit" className="btn btn-primary">
            <FloppyDisk size={16} />
            Guardar Configuración
          </button>
        </div>
      </form>

      <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <HelpCircle size={16} />
          <h3 style={{ fontSize: '13px', fontWeight: 500 }}>¿Cómo obtener el enlace correcto?</h3>
        </div>
        <ol style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>En tu Google Form, ve a <strong>Respuestas</strong> y haz clic en <strong>Ver respuestas en Sheets</strong>.</li>
          <li>En la Google Sheet abierta, haz clic en el botón <strong>Compartir</strong> (arriba a la derecha).</li>
          <li>En <em>Acceso general</em>, cambia de "Restringido" a <strong>"Cualquier persona con el enlace"</strong> como <strong>Lector</strong>.</li>
          <li>Haz clic en <strong>Copiar enlace</strong> y pégalo arriba.</li>
        </ol>
      </div>
    </div>
  );
}
