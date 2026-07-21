/**
 * Extrae el ID de la hoja de cálculo de Google Sheets a partir de su URL.
 * Soporta formatos de compartir estándar.
 * 
 * @param {string} url - La URL de compartir de Google Sheets.
 * @returns {string|null} El ID de la hoja de cálculo o null si no se encuentra.
 */
export function extractSpreadsheetId(url) {
  if (!url) return null;
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Parsea el valor de una celda de la API de visualización de Google Sheets.
 * Convierte strings de fecha tipo 'Date(2026,6,21,12,30,0)' a formato legible.
 * 
 * @param {any} value - El valor crudo devuelto por la API.
 * @returns {any} El valor parseado.
 */
function parseCellValue(value) {
  if (typeof value === 'string' && value.startsWith('Date(')) {
    const match = value.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10); // El mes en JS es 0-indexed, en gviz también
      const day = parseInt(match[3], 10);
      const hours = match[4] ? parseInt(match[4], 10) : 0;
      const minutes = match[5] ? parseInt(match[5], 10) : 0;
      const seconds = match[6] ? parseInt(match[6], 10) : 0;
      
      const date = new Date(year, month, day, hours, minutes, seconds);
      // Retorna una fecha formateada en formato local
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  }
  return value;
}

/**
 * Consulta los datos de una Google Sheet compartida públicamente como lector.
 * 
 * @param {string} urlOrId - La URL de compartir o el ID de la Google Sheet.
 * @returns {Promise<Array<Object>>} Un arreglo de objetos, donde cada objeto representa una fila (pregunta -> respuesta).
 */
export async function fetchSheetData(urlOrId) {
  const spreadsheetId = urlOrId.includes('/') ? extractSpreadsheetId(urlOrId) : urlOrId;
  
  if (!spreadsheetId) {
    throw new Error('La URL o ID de Google Sheets proporcionado no es válido.');
  }

  const endpointUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;

  try {
    const response = await fetch(endpointUrl);
    if (!response.ok) {
      throw new Error(`Error en la red: ${response.statusText}`);
    }

    const text = await response.text();
    
    // La respuesta de gviz/tq viene envuelta en google.visualization.Query.setResponse(...)
    const startStr = 'setResponse(';
    const jsonStartIdx = text.indexOf(startStr);
    if (jsonStartIdx === -1) {
      throw new Error('La respuesta de Google Sheets no tiene el formato esperado.');
    }
    
    const jsonStart = jsonStartIdx + startStr.length;
    const jsonEnd = text.lastIndexOf(')');
    const jsonString = text.substring(jsonStart, jsonEnd);
    
    const data = JSON.parse(jsonString);
    
    if (data.status === 'error') {
      const reasons = data.errors ? data.errors.map(e => e.message).join(', ') : 'Desconocida';
      throw new Error(`Google Sheets devolvió un error: ${reasons}`);
    }

    const table = data.table;
    if (!table || !table.cols || !table.rows) {
      return [];
    }

    // Obtener los nombres de las columnas (las preguntas de la encuesta)
    // Usamos label si está definida; si no, el ID de columna (A, B, C...)
    const headers = table.cols.map((col, idx) => {
      return col.label ? col.label.trim() : `Columna ${idx + 1}`;
    });

    // Parsear las filas
    const rows = table.rows.map(row => {
      const parsedRow = {};
      headers.forEach((header, idx) => {
        // En algunas filas cortas de gviz, row.c puede ser más corto que los headers
        const cell = row.c && row.c[idx];
        parsedRow[header] = cell ? parseCellValue(cell.v) : null;
      });
      return parsedRow;
    });

    return rows;
  } catch (error) {
    console.error('Error al obtener datos de Google Sheets:', error);
    throw new Error(`No se pudo acceder a los datos de la hoja de cálculo. Asegúrate de que el enlace de compartir está en "Cualquier persona con el enlace puede ver" (Lector) y que la URL es correcta. Detalle: ${error.message}`);
  }
}
