const JTBD_JOBS = [
  { key: 'universalidad', label: 'Universalidad', keywords: ['universalidad', 'pagar desde mi celular', 'todos los comercios'] },
  { key: 'seguridad', label: 'Seguridad', keywords: ['seguridad', 'estafa', 'resguardado', 'datos personales'] },
  { key: 'control', label: 'Control', keywords: ['control sobre', 'ajusta a mis', 'manera en que'] },
  { key: 'retribucion', label: 'Retribución', keywords: ['retribución', 'retribucion', 'reconocido', 'premiado', 'descuento', 'ofertas', 'beneficios'] },
  { key: 'trazabilidad', label: 'Trazabilidad', keywords: ['trazabilidad', 'boleta', 'evidencia'] },
  { key: 'rentabilidad', label: 'Rentabilidad del saldo', keywords: ['rentabilidad', 'intereses', 'ganancias', 'dinero en movimiento', 'saldo'] },
  { key: 'presupuesto', label: 'Gestión de presupuesto', keywords: ['presupuesto', 'gestionar mi dinero', 'límite de mis gastos', 'planificar posibilidades'] },
  { key: 'terceros', label: 'Acceso para terceros', keywords: ['terceros', 'padre', 'madre', 'hijo', 'tercero'] },
  { key: 'servicios_cotidianos', label: 'Servicios cotidianos', keywords: ['servicios cotidianos', 'transporte', 'alimentación', 'trámites'] },
  { key: 'diversidad', label: 'Diversidad de pagos', keywords: ['diversidad', 'alternativos', 'criptomonedas', 'cuotas'] }
];

/**
 * Parsea e intenta extraer un número entero de un valor de encuesta.
 * Útil para Likert scales como "5 (Muy importante)" o "1 - Muy difícil".
 */
function parseLikertValue(val) {
  if (val === null || val === undefined || String(val).trim() === '') return null;
  const numVal = Number(val);
  if (!isNaN(numVal)) return numVal;

  const match = String(val).match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Normaliza los nombres de las preguntas para agruparlas.
 */
function normalizeQuestionText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/^[¿\s'"“‘+-]+|[?\s!'"”’.:]+$/g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Intenta emparejar una pregunta con un Job de JTBD y una métrica (Importancia o Dificultad)
 */
function matchJTBDQuestion(header) {
  const text = header.toLowerCase();
  
  let metric = null;
  if (text.includes('dificultad') || text.includes('difícil') || text.includes('dificil')) {
    metric = 'difficulty';
  } else if (text.includes('importancia') || text.includes('importante')) {
    metric = 'importance';
  } else {
    return null;
  }
  
  for (const job of JTBD_JOBS) {
    const matchesJob = job.keywords.some(kw => text.includes(kw)) || text.includes(job.key.replace('_', ' '));
    if (matchesJob) {
      return { jobKey: job.key, jobLabel: job.label, metric };
    }
  }
  
  return null;
}

/**
 * Agrega y consolida los datos de las encuestas suministradas.
 */
export function aggregateSurveyData(surveys) {
  const result = {
    totalSurveys: surveys.length,
    totalResponses: 0,
    responsesPerSurvey: {},
    aggregatedQuestions: [],
    jtbdOpportunityData: [],
    demographics: {
      gender: {},
      employment: {},
      budget: {},
      wallets: {}
    },
    rawSurveys: surveys
  };

  // 1. Contar respuestas por encuesta y global
  surveys.forEach(survey => {
    const count = survey.rows.length;
    result.totalResponses += count;
    result.responsesPerSurvey[survey.name] = count;
  });

  if (result.totalResponses === 0) {
    return result;
  }

  // 2. Mapear todas las preguntas y procesarlas
  const questionMap = new Map();
  // Para agrupar los scores de JTBD a nivel global
  // Estructura: { [jobKey]: { label, importanceScores: [], difficultyScores: [] } }
  const jtbdScores = {};
  JTBD_JOBS.forEach(j => {
    jtbdScores[j.key] = { label: j.label, importance: [], difficulty: [] };
  });

  surveys.forEach(survey => {
    const surveyName = survey.name;
    
    survey.rows.forEach(row => {
      Object.keys(row).forEach(question => {
        const normQ = normalizeQuestionText(question);
        if (normQ === 'marca temporal' || normQ === 'timestamp' || normQ === 'fecha') {
          return;
        }

        const rawVal = row[question];
        const val = typeof rawVal === 'string' ? rawVal.trim() : rawVal;

        // --- A. Procesamiento para Pregunta General ---
        if (!questionMap.has(normQ)) {
          questionMap.set(normQ, {
            originalTitle: question.trim(),
            normalizedTitle: normQ,
            surveys: new Set(),
            allRawResponses: []
          });
        }
        const qInfo = questionMap.get(normQ);
        qInfo.surveys.add(surveyName);
        if (val !== null && val !== undefined && String(val) !== '') {
          qInfo.allRawResponses.push({ surveyName, value: val });
        }

        // --- B. Procesamiento de Preguntas JTBD (Importancia / Dificultad) ---
        const jtbdMatch = matchJTBDQuestion(question);
        if (jtbdMatch && val !== null && val !== undefined && String(val) !== '') {
          const parsedScore = parseLikertValue(val);
          if (parsedScore !== null) {
            jtbdScores[jtbdMatch.jobKey][jtbdMatch.metric].push(parsedScore);
          }
        }

        // --- C. Detección de Demografía y Perfil ---
        const lowerQ = question.toLowerCase();
        if (val !== null && val !== undefined && String(val) !== '') {
          // 1. Género
          if (lowerQ.includes('género') || lowerQ.includes('genero') || lowerQ.includes('identifica con el género') || lowerQ.includes('sexo')) {
            result.demographics.gender[val] = (result.demographics.gender[val] || 0) + 1;
          }
          // 2. Situación Laboral / Ocupación
          else if (lowerQ.includes('ocupación') || lowerQ.includes('ocupacion') || lowerQ.includes('situación laboral') || lowerQ.includes('trabajo') || lowerQ.includes('empleo')) {
            result.demographics.employment[val] = (result.demographics.employment[val] || 0) + 1;
          }
          // 3. Gestión Financiera (Presupuesto en pareja / colaborativo)
          else if (lowerQ.includes('gestion') || lowerQ.includes('gestiona') || lowerQ.includes('administra') || lowerQ.includes('pareja') || lowerQ.includes('conjunto') || lowerQ.includes('presupuesto compartido')) {
            result.demographics.budget[val] = (result.demographics.budget[val] || 0) + 1;
          }
          // 4. Billeteras digitales preferidas
          else if (lowerQ.includes('billetera') || lowerQ.includes('aplicación') || lowerQ.includes('utiliza frecuentemente') || lowerQ.includes('cuál de estas')) {
            // A veces las billeteras vienen separadas por comas si es pregunta de opción múltiple con checkbox
            const splitVals = String(val).split(/[,;]/);
            splitVals.forEach(v => {
              const cleanVal = v.trim();
              if (cleanVal !== '') {
                result.demographics.wallets[cleanVal] = (result.demographics.wallets[cleanVal] || 0) + 1;
              }
            });
          }
        }

      });
    });
  });

  // 3. Construir Estructuras de Gráficos Generales para las Preguntas Consolidadas
  questionMap.forEach((qInfo, normTitle) => {
    const values = qInfo.allRawResponses.map(r => r.value);
    
    // Auto-detectar tipo de pregunta
    const nonNull = values.filter(v => v !== null && v !== undefined && String(v) !== '');
    if (nonNull.length === 0) return;

    let type = 'text';
    const isAllNumbers = nonNull.every(v => !isNaN(Number(v)));
    
    if (isAllNumbers) {
      const numbers = nonNull.map(Number);
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      if (min >= 0 && max <= 10) {
        type = 'rating';
      }
    } else {
      const uniqueValues = new Set(nonNull.map(v => String(v).toLowerCase()));
      if (uniqueValues.size <= 10) {
        type = 'choice';
      }
    }

    const consolidatedQuestion = {
      title: qInfo.originalTitle,
      normalizedTitle: normTitle,
      type: type,
      involvedSurveys: Array.from(qInfo.surveys),
      totalCount: values.length,
      data: []
    };

    if (type === 'choice' || type === 'rating') {
      const optionCounts = {};
      const optionCountsBySurvey = {};
      
      consolidatedQuestion.involvedSurveys.forEach(sName => {
        optionCountsBySurvey[sName] = {};
      });

      qInfo.allRawResponses.forEach(resp => {
        const option = String(resp.value);
        const sName = resp.surveyName;

        optionCounts[option] = (optionCounts[option] || 0) + 1;
        optionCountsBySurvey[sName][option] = (optionCountsBySurvey[sName][option] || 0) + 1;
      });

      let sortedOptions = Object.keys(optionCounts);
      if (type === 'rating') {
        sortedOptions.sort((a, b) => Number(a) - Number(b));
      } else {
        sortedOptions.sort((a, b) => optionCounts[b] - optionCounts[a]);
      }

      consolidatedQuestion.data = sortedOptions.map(option => {
        const dataPoint = { name: option, total: optionCounts[option] };
        consolidatedQuestion.involvedSurveys.forEach(sName => {
          dataPoint[sName] = optionCountsBySurvey[sName][option] || 0;
        });
        return dataPoint;
      });

      if (type === 'rating') {
        const sum = values.reduce((acc, curr) => acc + Number(curr), 0);
        consolidatedQuestion.average = parseFloat((sum / values.length).toFixed(2));
        consolidatedQuestion.averageBySurvey = {};
        consolidatedQuestion.involvedSurveys.forEach(sName => {
          const sValues = qInfo.allRawResponses.filter(r => r.surveyName === sName).map(r => Number(r.value));
          if (sValues.length > 0) {
            const sSum = sValues.reduce((acc, curr) => acc + curr, 0);
            consolidatedQuestion.averageBySurvey[sName] = parseFloat((sSum / sValues.length).toFixed(2));
          } else {
            consolidatedQuestion.averageBySurvey[sName] = 0;
          }
        });
      }
    } else {
      consolidatedQuestion.data = qInfo.allRawResponses.map(resp => ({
        survey: resp.surveyName,
        text: String(resp.value)
      }));
    }

    result.aggregatedQuestions.push(consolidatedQuestion);
  });

  // Ordenar preguntas consolidadas por relevancia
  result.aggregatedQuestions.sort((a, b) => {
    const diff = b.involvedSurveys.length - a.involvedSurveys.length;
    if (diff !== 0) return diff;
    return b.totalCount - a.totalCount;
  });

  // 4. Procesar el análisis de Oportunidad JTBD
  // Calcular promedios para cada uno de los 10 Jobs
  JTBD_JOBS.forEach(job => {
    const scores = jtbdScores[job.key];
    const impScores = scores.importance;
    const difScores = scores.difficulty;

    if (impScores.length > 0 || difScores.length > 0) {
      let avgImp = 0;
      let avgDif = 0;

      if (impScores.length > 0) {
        const sum = impScores.reduce((acc, curr) => acc + curr, 0);
        avgImp = sum / impScores.length;
      }

      if (difScores.length > 0) {
        const sum = difScores.reduce((acc, curr) => acc + curr, 0);
        avgDif = sum / difScores.length;
      }

      // Detectar la escala. Si el valor máximo es menor o igual a 5, escalamos los promedios a base 10.
      const maxImp = impScores.length > 0 ? Math.max(...impScores) : 0;
      const maxDif = difScores.length > 0 ? Math.max(...difScores) : 0;
      
      const requiresScaling = (maxImp > 0 && maxImp <= 5) || (maxDif > 0 && maxDif <= 5);
      
      if (requiresScaling) {
        avgImp = avgImp * 2;
        avgDif = avgDif * 2;
      }

      avgImp = parseFloat(avgImp.toFixed(2));
      avgDif = parseFloat(avgDif.toFixed(2));

      // Fórmula clásica de oportunidad de Ulwick/JTBD:
      // Oportunidad = Importancia + max(Importancia - Satisfacción, 0)
      // Como medimos dificultad, a mayor dificultad, mayor es la oportunidad no resuelta.
      // Así que: Oportunidad = Importancia + max(Dificultad - (10 - Importancia), 0) o simplemente:
      // Oportunidad = (Importancia + Dificultad) / 2 o la tensión directa:
      // En la metodología de Continuum, las oportunidades están determinadas por los puntajes más altos combinados de importancia y dificultad.
      // Calculamos la puntuación de Oportunidad combinada:
      const opportunityScore = parseFloat(((avgImp + avgDif) / 2).toFixed(2));

      result.jtbdOpportunityData.push({
        key: job.key,
        name: job.label,
        importance: avgImp,
        difficulty: avgDif,
        opportunity: opportunityScore
      });
    }
  });

  // Ordenar los Jobs por la puntuación de Oportunidad de mayor a menor
  result.jtbdOpportunityData.sort((a, b) => b.opportunity - a.opportunity);

  return result;
}
