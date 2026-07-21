/**
 * Detecta el tipo de pregunta en función de los valores de respuesta observados.
 * Los tipos posibles son:
 * - 'rating': Valores numéricos discretos en un rango pequeño (ej. 1 a 5, 1 a 10).
 * - 'choice': Valores categóricos con pocas opciones únicas (ej. "Sí", "No", "Tal vez").
 * - 'text': Comentarios abiertos, strings largos o gran variedad de valores únicos.
 * - 'empty': Sin respuestas.
 * 
 * @param {Array<any>} responses - Arreglo con todos los valores de respuesta para esta pregunta.
 * @returns {string} El tipo detectado.
 */
function detectQuestionType(responses) {
  const nonNull = responses.filter(r => r !== null && r !== undefined && r !== '');
  if (nonNull.length === 0) return 'empty';
  
  // Verificar si todas las respuestas son números
  const isAllNumbers = nonNull.every(r => {
    const val = String(r).trim();
    return val !== '' && !isNaN(Number(val));
  });
  
  if (isAllNumbers) {
    const numbers = nonNull.map(Number);
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    // Si están dentro de un rango de escala típico (0-10)
    if (min >= 0 && max <= 10) {
      return 'rating';
    }
  }

  // Verificar la cantidad de opciones únicas
  const uniqueValues = new Set(nonNull.map(r => String(r).trim()));
  
  // Si hay 10 o menos opciones únicas, se trata de una pregunta de opción múltiple (choice)
  if (uniqueValues.size <= 10) {
    return 'choice';
  }

  return 'text';
}

/**
 * Normaliza los nombres de las preguntas para agruparlas.
 * Ignora diferencias en espacios extras, signos de interrogación y mayúsculas/minúsculas.
 * 
 * @param {string} text - El título original de la pregunta.
 * @returns {string} El texto normalizado.
 */
function normalizeQuestionText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/^[¿\s'"“‘+-]+|[?\s!'"”’.:]+$/g, '') // Elimina signos comunes al inicio y fin (¿, ?, !, ., :, comillas, etc)
    .replace(/\s+/g, ' '); // Colapsa múltiples espacios
}

/**
 * Agrega y consolida los datos de las encuestas suministradas.
 * 
 * @param {Array<Object>} surveys - Un arreglo de encuestas: [{ name: string, rows: Array<Object> }]
 * @returns {Object} El reporte consolidado de datos.
 */
export function aggregateSurveyData(surveys) {
  const result = {
    totalSurveys: surveys.length,
    totalResponses: 0,
    responsesPerSurvey: {},
    aggregatedQuestions: [],
    rawSurveys: surveys
  };

  // 1. Contar respuestas generales y por encuesta
  surveys.forEach(survey => {
    const count = survey.rows.length;
    result.totalResponses += count;
    result.responsesPerSurvey[survey.name] = count;
  });

  // 2. Mapear todas las preguntas de todas las encuestas
  // Llave: texto normalizado de la pregunta
  // Valor: { originalTitle: string, type: string, surveys: Set, allRawResponses: Array<{ surveyName, value }> }
  const questionMap = new Map();

  surveys.forEach(survey => {
    const surveyName = survey.name;
    
    survey.rows.forEach(row => {
      Object.keys(row).forEach(question => {
        // Omitir columnas de marca temporal comunes en Google Forms
        const normQ = normalizeQuestionText(question);
        if (normQ === 'marca temporal' || normQ === 'timestamp' || normQ === 'fecha') {
          return;
        }

        const rawVal = row[question];

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
        if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== '') {
          qInfo.allRawResponses.push({
            surveyName,
            value: typeof rawVal === 'string' ? rawVal.trim() : rawVal
          });
        }
      });
    });
  });

  // 3. Procesar y agrupar respuestas para cada pregunta única
  questionMap.forEach((qInfo, normTitle) => {
    const values = qInfo.allRawResponses.map(r => r.value);
    const type = detectQuestionType(values);
    
    if (type === 'empty') return; // Ignorar preguntas sin ninguna respuesta

    const consolidatedQuestion = {
      title: qInfo.originalTitle,
      normalizedTitle: normTitle,
      type: type,
      involvedSurveys: Array.from(qInfo.surveys),
      totalCount: values.length,
      responses: []
    };

    if (type === 'choice' || type === 'rating') {
      // Agregación de frecuencias
      const optionCounts = {}; // { option: totalCount }
      const optionCountsBySurvey = {}; // { surveyName: { option: count } }

      // Inicializar estructura por encuesta
      consolidatedQuestion.involvedSurveys.forEach(sName => {
        optionCountsBySurvey[sName] = {};
      });

      // Rellenar frecuencias
      qInfo.allRawResponses.forEach(resp => {
        const option = String(resp.value);
        const sName = resp.surveyName;

        optionCounts[option] = (optionCounts[option] || 0) + 1;
        optionCountsBySurvey[sName][option] = (optionCountsBySurvey[sName][option] || 0) + 1;
      });

      // Si es un rating numérico, nos aseguramos de ordenar los valores del 1 al 5/10
      // Si son cadenas normales, ordenamos por frecuencia de mayor a menor
      let sortedOptions = Object.keys(optionCounts);
      if (type === 'rating') {
        sortedOptions.sort((a, b) => Number(a) - Number(b));
      } else {
        sortedOptions.sort((a, b) => optionCounts[b] - optionCounts[a]);
      }

      // Estructurar el resultado final para gráficos
      // Formato adecuado para Recharts
      consolidatedQuestion.data = sortedOptions.map(option => {
        const dataPoint = { name: option, total: optionCounts[option] };
        consolidatedQuestion.involvedSurveys.forEach(sName => {
          dataPoint[sName] = optionCountsBySurvey[sName][option] || 0;
        });
        return dataPoint;
      });

      // Calcular promedio si es de tipo rating
      if (type === 'rating') {
        const sum = values.reduce((acc, curr) => acc + Number(curr), 0);
        consolidatedQuestion.average = parseFloat((sum / values.length).toFixed(2));
        
        // Calcular promedio por encuesta
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
      // Tipo 'text': guardamos las respuestas de texto crudo organizadas
      consolidatedQuestion.data = qInfo.allRawResponses.map(resp => ({
        survey: resp.surveyName,
        text: String(resp.value)
      }));
    }

    result.aggregatedQuestions.push(consolidatedQuestion);
  });

  // Ordenar preguntas consolidadas:
  // Primero aquellas que se encuentran en más encuestas (para mostrar los resultados sumados arriba)
  result.aggregatedQuestions.sort((a, b) => {
    const surveyCountDiff = b.involvedSurveys.length - a.involvedSurveys.length;
    if (surveyCountDiff !== 0) return surveyCountDiff;
    return b.totalCount - a.totalCount; // Desempate por volumen de respuestas
  });

  return result;
}
