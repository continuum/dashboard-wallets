import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, Cell, LabelList
} from 'recharts';
import { 
  FileText, Users, BarChart3, Database, Calendar, CheckCircle2, 
  Star, ChevronDown, ChevronUp, AlertCircle, Info, PieChart
} from 'lucide-react';

const COLORS_LIGHT = ['#1a73e8', '#12b5cb', '#ab47bc', '#34a853', '#fbbc05', '#e91e63', '#ff5722', '#607d8b'];
const COLORS_DARK = ['#8ab4f8', '#78d9ec', '#c58af9', '#81c995', '#fdd663', '#f48fb1', '#ffab91', '#b0bec5'];

// Componente auxiliar para renderizar barras de progreso horizontales minimalistas
function DemographicsBarList({ title, dataObj, total }) {
  if (!dataObj || Object.keys(dataObj).length === 0) {
    return (
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '8px', color: 'var(--text-secondary)' }}>{title}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin datos disponibles.</p>
      </div>
    );
  }

  // Ordenar de mayor a menor frecuencia
  const items = Object.keys(dataObj)
    .map(name => ({ name, count: dataObj[name] }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          return (
            <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>{item.name}</span>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{pct}% <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>({item.count})</span></span>
              </div>
              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--accent-color)', borderRadius: '3px' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Dashboard({ data, lastUpdated, onForceRefresh, isRefreshing }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'breakdown'
  const [selectedSource, setSelectedSource] = useState('consolidated');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [isDark, setIsDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Monitorizar cambios en el esquema de color del sistema
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => setIsDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const gridColor = isDark ? '#2d2d2d' : '#f1f3f4';
  const tooltipStyle = {
    backgroundColor: isDark ? '#2d2d2d' : '#ffffff',
    border: `1px solid ${isDark ? '#3c4043' : '#dadce0'}`,
    color: isDark ? '#e8eaed' : '#202124',
    fontFamily: 'var(--font-family)',
    fontSize: '12px',
    borderRadius: '8px',
    padding: '8px'
  };

  const toggleExpand = (qId) => {
    setExpandedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatLastUpdated = (timestamp) => {
    if (!timestamp) return 'Nunca';
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Hace unos momentos';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora(s)`;
    
    return new Date(timestamp).toLocaleString();
  };

  const hasResponses = data.totalResponses > 0;
  const hasJtbdData = data.jtbdOpportunityData && data.jtbdOpportunityData.length > 0;

  // Filtrar preguntas para la pestaña de desglose
  const filteredQuestions = data.aggregatedQuestions.filter(q => {
    if (selectedSource === 'consolidated') {
      return true;
    }
    return q.involvedSurveys.includes(selectedSource);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Info - Stats strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 400, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 style={{ color: 'var(--accent-color)' }} />
            Estudio Billeteras Digitales
          </h1>
          <p style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <Calendar size={14} />
            Última sincronización: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={onForceRefresh} 
            disabled={isRefreshing}
          >
            <Database size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Actualizando...' : 'Sincronizar ahora'}
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Resumen Ejecutivo
        </button>
        <button 
          className={`tab-btn ${activeTab === 'breakdown' ? 'active' : ''}`}
          onClick={() => setActiveTab('breakdown')}
          disabled={!hasResponses}
        >
          Desglose de Preguntas
        </button>
      </div>

      {!hasResponses ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px auto' }} />
          <h2>No hay datos cargados</h2>
          <p style={{ maxWidth: '400px', margin: '8px auto 0 auto' }}>
            El caché está vacío y no hay datos configurados. 
            Ingresa en "Ajustes" para configurar tus URLs de Google Sheets y comenzar a ver los resultados.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: RESUMEN EJECUTIVO (CONSOLIDADO DE LAS 3 ENCUESTAS) */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Stat Cards Grid */}
              <div className="grid-cols-3">
                <div className="card">
                  <div className="stat-box">
                    <span className="stat-label">Total Consolidado de Respuestas</span>
                    <span className="stat-value">{data.totalResponses}</span>
                  </div>
                  <Users size={20} style={{ position: 'absolute', right: '20px', top: '24px', color: 'var(--text-tertiary)' }} />
                </div>
                
                {data.rawSurveys.map((survey, index) => (
                  <div className="card" key={survey.name}>
                    <div className="stat-box">
                      <span className="stat-label">{survey.name}</span>
                      <span className="stat-value">{survey.rows.length}</span>
                    </div>
                    <FileText size={20} style={{ position: 'absolute', right: '20px', top: '24px', color: colors[index % colors.length] }} />
                  </div>
                ))}
              </div>

              {/* Sección A: Mapa de Oportunidad de Jobs to be Done (JTBD) */}
              {hasJtbdData ? (
                <div className="grid-cols-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
                  
                  {/* Gráfico de Dispersión / Scatter Plot */}
                  <div className="card">
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <div>
                        <h2>Mapa de Oportunidades JTBD (2026)</h2>
                        <p style={{ fontSize: '12px', marginTop: '2px' }}>Importancia vs Dificultad para las 10 metas financieras de los chilenos</p>
                      </div>
                    </div>
                    
                    <div style={{ width: '100%', height: '360px', marginTop: '8px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: -20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                          <XAxis 
                            type="number" 
                            dataKey="difficulty" 
                            name="Dificultad" 
                            domain={[0, 10]} 
                            stroke="var(--text-secondary)"
                            tick={{ fontSize: 10 }}
                            label={{ value: 'Dificultad de Resolver (→)', position: 'bottom', offset: 0, style: { fontSize: 11, fill: 'var(--text-secondary)' } }}
                          />
                          <YAxis 
                            type="number" 
                            dataKey="importance" 
                            name="Importancia" 
                            domain={[0, 10]} 
                            stroke="var(--text-secondary)"
                            tick={{ fontSize: 10 }}
                            label={{ value: 'Importancia del Job (↑)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 11, fill: 'var(--text-secondary)', textAnchor: 'middle' } }}
                          />
                          
                          {/* Líneas de cuadrantes (Cortan en X=5 y Y=7.5) */}
                          <ReferenceLine x={5} stroke="var(--border-color)" strokeDasharray="3 3" />
                          <ReferenceLine y={7.5} stroke="var(--border-color)" strokeDasharray="3 3" />
                          
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }} 
                            contentStyle={tooltipStyle}
                            formatter={(value, name) => [value, name]}
                          />
                          
                          <Scatter name="Metas Financieras" data={data.jtbdOpportunityData} fill="var(--accent-color)">
                            {data.jtbdOpportunityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                            <LabelList dataKey="name" position="top" style={{ fontSize: 9, fill: 'var(--text-primary)', fontWeight: 400 }} />
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', fontSize: '10px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      <span>Sup-Derecha: Oportunidades Clave (Alta Importancia / Alta Dificultad)</span>
                      <span>Sup-Izquierda: Básicos (Alta Importancia / Baja Dificultad)</span>
                    </div>
                  </div>

                  {/* Tabla de Ranking de Oportunidad */}
                  <div className="card">
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <div>
                        <h2>Prioridad de Oportunidad</h2>
                        <p style={{ fontSize: '11px', marginTop: '2px' }}>Ranking de metas según dolor observado</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '350px' }}>
                      {data.jtbdOpportunityData.map((job, idx) => (
                        <div key={job.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: 'var(--radius-sm)', backgroundColor: idx < 3 ? 'var(--accent-light)' : 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '75%' }}>
                            <span style={{ fontSize: '12px', fontWeight: idx < 3 ? 500 : 400, color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                              {idx + 1}. {job.name}
                            </span>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              Imp: {job.importance} | Dif: {job.difficulty}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: idx < 3 ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                            {job.opportunity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ) : (
                <div className="card" style={{ display: 'flex', flexDirection: 'row', gap: '16px', alignItems: 'center', padding: '16px 20px', backgroundColor: 'var(--accent-light)', borderColor: 'var(--accent-color)' }}>
                  <Info size={20} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--accent-color)' }}>Evaluación de Oportunidades JTBD</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                      Cuando cargues las hojas de cálculo reales del Estudio 2026, el sistema buscará automáticamente las preguntas de Importancia y Dificultad para calcular el **Mapa de Oportunidades** y el **Ranking de Prioridades** de los 10 Jobs.
                    </p>
                  </div>
                </div>
              )}

              {/* Sección B: Perfil de la Muestra (Consolidado de las 3 encuestas) */}
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 500, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <PieChart size={18} />
                  Perfil Consolidado de la Muestra (Encuestados 2026)
                </h2>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <DemographicsBarList 
                    title="Billeteras Preferidas" 
                    dataObj={data.demographics.wallets} 
                    total={data.totalResponses} 
                  />
                  
                  <DemographicsBarList 
                    title="Género" 
                    dataObj={data.demographics.gender} 
                    total={data.totalResponses} 
                  />

                  <DemographicsBarList 
                    title="Situación Laboral" 
                    dataObj={data.demographics.employment} 
                    total={data.totalResponses} 
                  />

                  <DemographicsBarList 
                    title="Gestión de Finanzas" 
                    dataObj={data.demographics.budget} 
                    total={data.totalResponses} 
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DESGLOSE DE PREGUNTAS (CON FILTRO DE ORIGEN HÍBRIDO) */}
          {activeTab === 'breakdown' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Selector de Origen */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>Mostrar datos de:</span>
                <select 
                  className="text-input" 
                  value={selectedSource} 
                  onChange={(e) => setSelectedSource(e.target.value)}
                  style={{ maxWidth: '320px', padding: '6px 12px', height: '36px', cursor: 'pointer' }}
                >
                  <option value="consolidated">Consolidado (Todas las encuestas)</option>
                  {data.rawSurveys.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Listado de Preguntas Filtradas */}
              {filteredQuestions.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '32px' }}>Sin preguntas cargadas para esta selección.</p>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isConsolidated = q.involvedSurveys.length > 1;
                  
                  // Preparar datos del gráfico según el origen seleccionado
                  let chartData = [];
                  if (selectedSource === 'consolidated') {
                    chartData = q.data || [];
                  } else {
                    chartData = q.data ? q.data.map(item => ({
                      name: item.name,
                      cantidad: item[selectedSource] || 0
                    })).filter(item => item.cantidad > 0) : [];
                  }

                  const questionUniqueId = `${idx}-${selectedSource}`;

                  return (
                    <div className="card" key={idx}>
                      
                      {/* Header de la Pregunta */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', paddingRight: '16px' }}>
                          <h2 style={{ fontSize: '15px', fontWeight: 500, lineHeight: '1.4' }}>{q.title}</h2>
                          
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                            {isConsolidated ? (
                              <span className="badge badge-info">Pregunta Común</span>
                            ) : (
                              <span className="badge" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                Exclusiva
                              </span>
                            )}
                            
                            {/* Mostrar qué encuestas aportan a esta pregunta */}
                            {q.involvedSurveys.map(s => (
                              <span key={s} className="badge" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Contador de respuestas para la pregunta */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '80px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Respuestas</span>
                          <strong style={{ fontSize: '20px', fontWeight: 300, color: 'var(--text-primary)' }}>
                            {selectedSource === 'consolidated' 
                              ? q.totalCount 
                              : (q.type === 'text' 
                                  ? q.data.filter(c => c.survey === selectedSource).length 
                                  : chartData.reduce((acc, curr) => acc + curr.cantidad, 0)
                                )
                            }
                          </strong>
                        </div>
                      </div>

                      {/* Contenido según Tipo de Pregunta */}

                      {/* 1. Opción Múltiple (Choice) o Escala (Rating) */}
                      {(q.type === 'choice' || q.type === 'rating') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          
                          {/* Promedio de valoración si es rating */}
                          {q.type === 'rating' && (
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Star size={16} fill="#fbbc05" stroke="#fbbc05" />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Promedio:</span>
                                <strong style={{ fontSize: '14px', fontWeight: 500 }}>
                                  {selectedSource === 'consolidated' ? q.average : q.averageBySurvey[selectedSource]}
                                </strong>
                              </div>
                              {selectedSource === 'consolidated' && isConsolidated && (
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                                  {q.involvedSurveys.map(s => (
                                    <span key={s} style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                      {s}: <strong style={{ fontWeight: 500 }}>{q.averageBySurvey[s]}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Gráficos de Recharts */}
                          <div style={{ width: '100%', height: '220px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                                <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                                
                                {selectedSource === 'consolidated' ? (
                                  <>
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                                    {q.involvedSurveys.map((surveyName, sIdx) => (
                                      <Bar 
                                        key={surveyName} 
                                        dataKey={surveyName} 
                                        name={surveyName}
                                        stackId="stack" 
                                        fill={colors[data.rawSurveys.findIndex(s => s.name === surveyName) % colors.length]} 
                                      />
                                    ))}
                                  </>
                                ) : (
                                  <Bar 
                                    dataKey="cantidad" 
                                    name="Respuestas" 
                                    fill={colors[data.rawSurveys.findIndex(s => s.name === selectedSource) % colors.length]} 
                                    radius={[4, 4, 0, 0]}
                                    barSize={30}
                                  />
                                )}
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}

                      {/* 2. Respuestas de Texto Libre */}
                      {q.type === 'text' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {(() => {
                            const surveyComments = selectedSource === 'consolidated' 
                              ? q.data 
                              : q.data.filter(c => c.survey === selectedSource);
                            
                            if (surveyComments.length === 0) {
                              return <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin comentarios.</p>;
                            }

                            return (
                              <>
                                <button 
                                  className="btn btn-secondary" 
                                  onClick={() => toggleExpand(questionUniqueId)}
                                  style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '12px', height: 'auto' }}
                                >
                                  {expandedQuestions[questionUniqueId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                  {expandedQuestions[questionUniqueId] ? 'Ocultar comentarios' : `Ver comentarios (${surveyComments.length})`}
                                </button>

                                {expandedQuestions[questionUniqueId] && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '8px', marginTop: '4px', backgroundColor: 'var(--bg-secondary)' }}>
                                    {surveyComments.map((c, cIdx) => (
                                      <div key={cIdx} style={{ padding: '8px 12px', borderBottom: cIdx < surveyComments.length - 1 ? '1px solid var(--border-color)' : 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {selectedSource === 'consolidated' && (
                                          <span className="badge" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '10px', alignSelf: 'flex-start' }}>
                                            {c.survey}
                                          </span>
                                        )}
                                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 300, margin: 0 }}>"{c.text}"</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

    </div>
  );
}
