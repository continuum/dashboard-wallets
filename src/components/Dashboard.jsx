import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { 
  FileText, Users, BarChart3, Database, Calendar, CheckCircle2, 
  MessageSquare, Star, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';

const COLORS_LIGHT = ['#1a73e8', '#12b5cb', '#ab47bc', '#34a853', '#fbbc05'];
const COLORS_DARK = ['#8ab4f8', '#78d9ec', '#c58af9', '#81c995', '#fdd663'];

export default function Dashboard({ data, lastUpdated, onForceRefresh, isRefreshing }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'breakdown'
  const [selectedSource, setSelectedSource] = useState('consolidated'); // 'consolidated' or survey name
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

  // Preparar datos para el gráfico de respuestas por encuesta (Resumen Ejecutivo)
  const summaryChartData = Object.keys(data.responsesPerSurvey).map((name, idx) => ({
    name: name,
    respuestas: data.responsesPerSurvey[name],
    fill: colors[idx % colors.length]
  }));

  const hasResponses = data.totalResponses > 0;

  // Filtrar preguntas según el origen seleccionado
  const filteredQuestions = data.aggregatedQuestions.filter(q => {
    if (selectedSource === 'consolidated') {
      return true; // Mostrar absolutamente todas las preguntas
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
            Resultados de Encuestas
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

      {/* Main Tab Navigation (Solo 2 Pestañas) */}
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
          Desglose por Encuesta
        </button>
      </div>

      {!hasResponses ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <AlertCircle size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 16px auto' }} />
          <h2>No hay datos cargados</h2>
          <p style={{ maxWidth: '400px', margin: '8px auto 0 auto' }}>
            El caché está vacío y no pudimos conectar con los enlaces ingresados. 
            Haz clic en "Sincronizar ahora" o comprueba la configuración de tus Google Sheets.
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: RESUMEN EJECUTIVO */}
          {activeTab === 'summary' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* Stat Cards Grid */}
              <div className="grid-cols-3">
                <div className="card">
                  <div className="stat-box">
                    <span className="stat-label">Total de Respuestas</span>
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

              {/* Graphic breakdown */}
              <div className="grid-cols-3" style={{ gridTemplateColumns: '2fr 1fr' }}>
                <div className="card">
                  <div className="card-header">
                    <h2>Distribución de Respuestas</h2>
                  </div>
                  <div style={{ width: '100%', height: '260px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summaryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                        <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                        <Bar dataKey="respuestas" radius={[4, 4, 0, 0]} barSize={40}>
                          {summaryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h2>Participación</h2>
                  </div>
                  <div style={{ width: '100%', height: '200px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={summaryChartData}
                          dataKey="respuestas"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                        >
                          {summaryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                    {summaryChartData.map((item, idx) => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.fill }}></span>
                          {item.name}
                        </span>
                        <strong style={{ fontWeight: 500 }}>
                          {((item.respuestas / data.totalResponses) * 100).toFixed(1)}%
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DESGLOSE POR ENCUESTA (CON FILTRO DE ORIGEN HÍBRIDO) */}
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
              {filteredQuestions.map((q, idx) => {
                const isConsolidated = q.involvedSurveys.length > 1;
                
                // Preparar datos del gráfico según el origen seleccionado
                let chartData = [];
                if (selectedSource === 'consolidated') {
                  chartData = q.data || [];
                } else {
                  // Filtramos para mostrar únicamente las respuestas pertenecientes a la encuesta seleccionada
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
              })}
            </div>
          )}
        </>
      )}

    </div>
  );
}
