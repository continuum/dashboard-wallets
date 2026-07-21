import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, ReferenceLine, ReferenceArea
} from 'recharts';
import { 
  Users, BarChart3, Database, Calendar, 
  Star, ChevronDown, ChevronUp, AlertCircle, Info, PieChart
} from 'lucide-react';

const COLORS_LIGHT = ['#1a73e8', '#12b5cb', '#ab47bc', '#34a853', '#fbbc05', '#e91e63', '#ff5722', '#607d8b'];
const COLORS_DARK = ['#8ab4f8', '#78d9ec', '#c58af9', '#81c995', '#fdd663', '#f48fb1', '#ffab91', '#b0bec5'];

const JTBD_DETAILS = {
  'Universalidad': 'Pagar desde mi celular en todos los comercios, en cualquier momento, sin fricciones y con las mismas condiciones que las tarjetas.',
  'Seguridad': 'Sentirme seguro y confiado al pagar, con la certeza de que no seré estafado y que mis datos personales están protegidos.',
  'Control': 'Tener control sobre la manera en que hago mis pagos para ajustarlos a mis necesidades y consideraciones del momento.',
  'Retribución': 'Ser reconocido por los comercios y acceder a ofertas, descuentos y beneficios especiales por mi uso continuo.',
  'Trazabilidad': 'Tener trazabilidad y evidencia de cualquier pago hecho, por ejemplo, guardando la boleta digital del comercio.',
  'Rentabilidad del saldo': 'Hacer que mi dinero guardado esté en movimiento generando intereses o ganancias de manera simple y automática.',
  'Gestión de presupuesto': 'Capacidad de gestionar mi dinero para crear un presupuesto realista y planificar el ahorro de forma sencilla.',
  'Acceso para terceros': 'Proveer a un tercero (como hijos) un método de pago seguro y controlado sin requisitos bancarios complejos.',
  'Servicios cotidianos': 'Acceder a servicios diarios de transporte y alimentación simplificados, sin tener que manejar múltiples aplicaciones.',
  'Diversidad de pagos': 'Contar con métodos de pago alternativos (pagar directo de la cuenta, cuotas sin tarjeta de crédito, etc.).'
};

const JTBD_META = {
  universalidad: { num: 1, color: '#3b82f6' }, // Blue
  seguridad: { num: 2, color: '#ef4444' },     // Red
  control: { num: 3, color: '#f59e0b' },       // Amber
  retribucion: { num: 4, color: '#ec4899' },    // Pink
  trazabilidad: { num: 5, color: '#8b5cf6' },   // Purple
  rentabilidad: { num: 6, color: '#10b981' },   // Green
  presupuesto: { num: 7, color: '#06b6d4' },    // Cyan
  terceros: { num: 8, color: '#f97316' },       // Orange
  servicios_cotidianos: { num: 9, color: '#a855f7' }, // Light Purple
  diversidad: { num: 10, color: '#14b8a6' }     // Teal
};

const CustomScatterPoint = (props) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy || !payload) return null;
  
  const meta = JTBD_META[payload.key] || { num: '?', color: 'var(--accent-color)' };
  const r = 13; // Radio 13px (diámetro 26px) es perfecto y muy claro.
  
  return (
    <g style={{ cursor: 'pointer' }}>
      {/* Sombra de relieve */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        fill="none" 
        stroke="rgba(0,0,0,0.15)" 
        strokeWidth={3} 
      />
      {/* Círculo relleno de color del Job */}
      <circle 
        cx={cx} 
        cy={cy} 
        r={r} 
        fill={meta.color} 
        stroke="#ffffff" 
        strokeWidth={2}
      />
      {/* Número en el centro del círculo */}
      <text
        x={cx}
        y={cy}
        dy=".35em"
        textAnchor="middle"
        fill="#ffffff"
        style={{ fontSize: '10px', fontWeight: '800', fontFamily: 'var(--font-family)', userSelect: 'none' }}
      >
        {meta.num}
      </text>
    </g>
  );
};

const CustomJTBDTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const meta = JTBD_META[data.key] || { num: '?', color: 'var(--accent-color)' };
    return (
      <div className="card" style={{ padding: '12px 14px', margin: 0, fontSize: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--card-bg)', backdropFilter: 'blur(12px)', boxShadow: 'var(--shadow-md)', maxWidth: '240px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ 
            width: '18px', 
            height: '18px', 
            borderRadius: '50%', 
            backgroundColor: meta.color, 
            color: '#ffffff', 
            fontSize: '10px', 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {meta.num}
          </div>
          <strong style={{ color: 'var(--text-primary)', whiteSpace: 'normal', lineHeight: '1.2' }}>{data.name}</strong>
        </div>
        <div style={{ color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', marginTop: '4px' }}>
          <span>Importancia: <strong>{data.importance}</strong></span>
          <span>Dificultad: <strong>{data.difficulty}</strong></span>
          <span>Oportunidad: <strong style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{data.opportunity}</strong></span>
        </div>
      </div>
    );
  }
  return null;
};

function WalletBrandBadge({ name }) {
  const lower = name.toLowerCase().trim();
  
  const badgeStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '20px',
    padding: '1px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '180px'
  };

  if (lower.includes('mercado') && lower.includes('pago')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#009ee3', color: '#ffffff', fontWeight: 600 }}>
        Mercado Pago
      </div>
    );
  }
  if (lower.includes('apple') && lower.includes('pay')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#1d1d1f', color: '#ffffff', fontWeight: 600 }}>
         Apple Pay
      </div>
    );
  }
  if (lower.includes('google') && lower.includes('pay')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#f1f3f4', border: '1px solid #dadce0', color: '#202124', fontWeight: 600 }}>
        <span style={{ color: '#4285F4' }}>G</span>
        <span style={{ color: '#EA4335' }}>o</span>
        <span style={{ color: '#FBBC05' }}>o</span>
        <span style={{ color: '#4285F4' }}>g</span>
        <span style={{ color: '#34A853' }}>l</span>
        <span style={{ color: '#EA4335' }}>e</span> Pay
      </div>
    );
  }
  if (lower === 'mach') {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#2f124d', color: '#39ff14', fontWeight: 700, letterSpacing: '0.5px' }}>
        MACH
      </div>
    );
  }
  if (lower === 'tenpo') {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#5c10a4', color: '#ffffff', fontWeight: 600 }}>
        Tenpo
      </div>
    );
  }
  if (lower.includes('copec')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#002f6c', color: '#ffffff', fontWeight: 600 }}>
        Copec Pay
      </div>
    );
  }
  if (lower.includes('mi banco') || lower.includes('aplicación') || lower.includes('aplicacion')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#e8f0fe', border: '1px solid #1a73e8', color: '#1a73e8', fontWeight: 500 }}>
        🏦 Mi Banco
      </div>
    );
  }
  if (lower.includes('bancoestado') || lower.includes('banco estado')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#ff5b00', color: '#ffffff', fontWeight: 600 }}>
        BancoEstado
      </div>
    );
  }
  if (lower.includes('cencopay')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#0072ce', color: '#ffffff', fontWeight: 600 }}>
        CencoPay
      </div>
    );
  }
  if (lower.includes('global') && lower.includes('66')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#0c1630', color: '#ffd700', fontWeight: 600 }}>
        Global 66
      </div>
    );
  }
  if (lower === 'tapp') {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#00bfff', color: '#ffffff', fontWeight: 600 }}>
        Tapp
      </div>
    );
  }
  if (lower === 'revolut') {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#000000', color: '#ffffff', fontWeight: 600 }}>
        Revolut
      </div>
    );
  }

  return (
    <span style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>
      {name}
    </span>
  );
}

// Componente auxiliar para renderizar barras de progreso horizontales minimalistas
function DemographicsBarList({ title, dataObj, total, limit = null, isWalletList = false }) {
  if (!dataObj || Object.keys(dataObj).length === 0) {
    return (
      <div className="card" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>{title}</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin datos disponibles.</p>
      </div>
    );
  }

  // Ordenar de mayor a menor frecuencia
  let items = Object.keys(dataObj)
    .map(name => ({ name, count: dataObj[name] }))
    .sort((a, b) => b.count - a.count);

  if (limit) {
    items = items.slice(0, limit);
  }

  return (
    <div className="card" style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>{title}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(item => {
          const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
          return (
            <div key={item.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', height: '24px' }}>
                {isWalletList ? (
                  <WalletBrandBadge name={item.name} />
                ) : (
                  <span style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '75%' }}>{item.name}</span>
                )}
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

function SurveyBrandBadge({ name }) {
  const lower = name.toLowerCase();
  
  const badgeStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    height: '24px',
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    whiteSpace: 'nowrap'
  };

  if (lower.includes('continuum')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#0f172a', color: '#ffffff' }}>
        <span style={{ color: '#00d2ff', marginRight: '-2px' }}>/</span> Continuum
      </div>
    );
  }
  if (lower.includes('chócale') || lower.includes('chocale')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#f25c05', color: '#ffffff' }}>
        Chócale
      </div>
    );
  }
  if (lower.includes('chilepay') || lower.includes('chile pay')) {
    return (
      <div style={{ ...badgeStyle, backgroundColor: '#002855', color: '#ffffff' }}>
        <span style={{ color: '#da291c', marginRight: '2px' }}>★</span> Chilepay
      </div>
    );
  }

  return (
    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{name}</span>
  );
}

export default function Dashboard({ data, lastUpdated, onForceRefresh, isRefreshing, theme = 'system' }) {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'breakdown'
  const [selectedSource, setSelectedSource] = useState('consolidated');
  const [expandedQuestions, setExpandedQuestions] = useState({});
  
  // Determinar si el modo oscuro está activo basado en el prop theme y la preferencia del sistema
  const [systemDark, setSystemDark] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e) => setSystemDark(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  const colors = isDark ? COLORS_DARK : COLORS_LIGHT;
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.25)' : '#dadce0';
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

  const handleSurveyCardClick = (sourceName) => {
    setSelectedSource(sourceName);
    setActiveTab('breakdown');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Mapear los datos JTBD agregando la coordenada Y invertida (10 - difficulty) para el gráfico
  const jtbdChartData = (data.jtbdOpportunityData || []).map(job => ({
    ...job,
    opportunityY: parseFloat((10 - job.difficulty).toFixed(2))
  }));

  // Filtrar preguntas para la pestaña de desglose
  const filteredQuestions = data.aggregatedQuestions.filter(q => {
    if (selectedSource === 'consolidated') {
      return true;
    }
    return q.involvedSurveys.includes(selectedSource);
  });

  const renderQuestionChart = (q, uniqueId) => {
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

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>
        {/* Header de la Pregunta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {q.title.split(':')[0]} {/* Extraer "Importancia" o "Dificultad" */}
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
              {isConsolidated ? (
                <span className="badge badge-info" style={{ fontSize: '9px', padding: '1px 4px' }}>Común</span>
              ) : (
                <span className="badge" style={{ fontSize: '9px', padding: '1px 4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  Exclusiva
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>N = {
              selectedSource === 'consolidated' 
                ? q.totalCount 
                : (q.type === 'text' 
                    ? q.data.filter(c => c.survey === selectedSource).length 
                    : chartData.reduce((acc, curr) => acc + curr.cantidad, 0)
                  )
            }</span>
          </div>
        </div>

        {/* 1. Rating/Choice */}
        {(q.type === 'choice' || q.type === 'rating') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {q.type === 'rating' && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', flexWrap: 'wrap', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Star size={13} fill="#fbbc05" stroke="#fbbc05" />
                  <span style={{ color: 'var(--text-secondary)' }}>Promedio:</span>
                  <strong style={{ fontWeight: 600 }}>
                    {selectedSource === 'consolidated' ? q.average : q.averageBySurvey[selectedSource]}
                  </strong>
                </div>
                {selectedSource === 'consolidated' && isConsolidated && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderLeft: '1px solid var(--border-color)', paddingLeft: '8px' }}>
                    {q.involvedSurveys.map(s => (
                      <span key={s} style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        {s.replace('Encuesta ', '')}: <strong style={{ fontWeight: 500 }}>{q.averageBySurvey[s]}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ width: '100%', height: '180px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid stroke={gridColor} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                  <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                  
                  {selectedSource === 'consolidated' ? (
                    <>
                      <Legend wrapperStyle={{ fontSize: 9, paddingTop: 4 }} />
                      {q.involvedSurveys.map((surveyName, sIdx) => (
                        <Bar 
                          key={surveyName} 
                          dataKey={surveyName} 
                          name={surveyName.replace('Encuesta ', '')}
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
                      barSize={24}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* 2. Text */}
        {q.type === 'text' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(() => {
              const surveyComments = selectedSource === 'consolidated' 
                ? q.data 
                : q.data.filter(c => c.survey === selectedSource);
              
              if (surveyComments.length === 0) {
                return <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin comentarios.</p>;
              }

              return (
                <>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => toggleExpand(uniqueId)}
                    style={{ alignSelf: 'flex-start', padding: '4px 10px', fontSize: '11px', height: 'auto' }}
                  >
                    {expandedQuestions[uniqueId] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {expandedQuestions[uniqueId] ? 'Ocultar comentarios' : `Ver comentarios (${surveyComments.length})`}
                  </button>

                  {expandedQuestions[uniqueId] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px', marginTop: '4px', borderTop: '1px solid var(--border-color)', paddingTop: '6px' }}>
                      {surveyComments.map((c, cIdx) => (
                        <div key={cIdx} style={{ padding: '6px 8px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '11px' }}>
                          <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.4' }}>"{c.text}"</p>
                          {selectedSource === 'consolidated' && (
                            <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', display: 'block', marginTop: '2px', textAlign: 'right' }}>
                              &mdash; {c.survey}
                            </span>
                          )}
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
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Info - Stats strip */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 style={{ color: 'var(--accent-color)' }} />
            Estudio Billeteras Digitales 2026
          </h1>
          <p style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <Calendar size={14} />
            Última sincronización: {formatLastUpdated(lastUpdated)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary btn-sync" 
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
              
              {/* Stat Cards Grid - Dos columnas (Consolidado Grande Izq / Individuales Der) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '8px' }}>
                {/* Columna Izquierda: Consolidado */}
                <div 
                  className="card interactive-card" 
                  onClick={() => handleSurveyCardClick('consolidated')}
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'flex-start', 
                    padding: '24px 32px', 
                    position: 'relative', 
                    minHeight: '180px',
                    cursor: 'pointer'
                  }}
                  title="Haz clic para ver el desglose detallado de todas las respuestas"
                >
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 500 }}>
                    Respuestas Totales
                  </span>
                  <span style={{ fontSize: '64px', fontWeight: 200, color: 'var(--accent-color)', marginTop: '8px', lineHeight: 1 }}>
                    {data.totalResponses}
                  </span>
                  <Users size={32} style={{ position: 'absolute', right: '32px', top: '32px', color: 'var(--text-tertiary)', opacity: 0.3 }} />
                </div>

                {/* Columna Derecha: Individuales apiladas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'space-between' }}>
                  {data.rawSurveys.map((survey, index) => {
                    const getSurveyLabel = (name) => {
                      const lower = name.toLowerCase();
                      if (lower.includes('continuum')) return 'Respuestas Continuum';
                      if (lower.includes('chócale') || lower.includes('chocale')) return 'Respuestas Chócale';
                      if (lower.includes('chilepay') || lower.includes('chile pay')) return 'Respuestas ChilePay';
                      return `Respuestas ${name}`;
                    };
                    return (
                      <div 
                        className="card interactive-card" 
                        key={survey.name} 
                        onClick={() => handleSurveyCardClick(survey.name)}
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          justifyContent: 'center', 
                          padding: '12px 20px', 
                          minHeight: '52px', 
                          margin: 0, 
                          position: 'relative',
                          cursor: 'pointer'
                        }}
                        title={`Haz clic para ver el desglose detallado filtrado por ${survey.name}`}
                      >
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 500 }}>
                          {getSurveyLabel(survey.name)}
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {survey.rows.length}
                        </span>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: '4px',
                          backgroundColor: survey.name.toLowerCase().includes('continuum') ? '#00d2ff' : survey.name.toLowerCase().includes('chócale') || survey.name.toLowerCase().includes('chocale') ? '#f25c05' : '#002855',
                          borderRadius: '4px 0 0 4px'
                        }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sección A: Mapa de Oportunidad de Jobs to be Done (JTBD) */}
              {hasJtbdData ? (
                <div className="card jtbd-card">
                  <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                    <div>
                      <h2>Mapa de Oportunidades JTBD 2026</h2>
                    </div>
                  </div>
                  
                  <div className="jtbd-grid" style={{ marginTop: '8px' }}>
                    {/* Gráfico de Dispersión / Scatter Plot */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        Importancia vs Dificultad para las 10 metas financieras de los chilenos
                      </p>
                      
                      <div className="jtbd-plotter-container" style={{ width: '100%', position: 'relative' }}>
                        {/* Indicadores en los extremos de los ejes */}
                        <div style={{ position: 'absolute', left: '35px', top: '15px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', zIndex: 10 }}>(-)</div>
                        <div style={{ position: 'absolute', left: '35px', bottom: '55px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', zIndex: 10 }}>(+)</div>
                        <div style={{ position: 'absolute', left: '55px', bottom: '25px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', zIndex: 10 }}>(-)</div>
                        <div style={{ position: 'absolute', right: '35px', bottom: '25px', fontSize: '10px', fontWeight: 'bold', color: 'var(--text-tertiary)', zIndex: 10 }}>(+)</div>

                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            
                            {/* Cuadrantes de fondo */}
                            <ReferenceArea x1={0} x2={5} y1={0} y2={5} fill="rgba(16, 185, 129, 0.05)" stroke="none" label={{ value: 'Standby', position: 'insideTopLeft', offset: 12, fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, opacity: 0.8 }} />
                            <ReferenceArea x1={5} x2={10} y1={0} y2={5} fill="rgba(139, 92, 246, 0.05)" stroke="none" label={{ value: 'Espacio de crecimiento', position: 'insideTopRight', offset: 12, fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, opacity: 0.8 }} />
                            <ReferenceArea x1={0} x2={5} y1={5} y2={10} fill="rgba(236, 72, 153, 0.05)" stroke="none" label={{ value: 'Mínima apuesta', position: 'insideBottomLeft', offset: 12, fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, opacity: 0.8 }} />
                            <ReferenceArea x1={5} x2={10} y1={5} y2={10} fill="rgba(59, 130, 246, 0.05)" stroke="none" label={{ value: 'Foco de mercado', position: 'insideBottomRight', offset: 12, fill: 'var(--text-secondary)', fontSize: 11, fontWeight: 600, opacity: 0.8 }} />
                            
                            <XAxis 
                              type="number" 
                              dataKey="importance" 
                              name="Importancia" 
                              domain={[0, 10]} 
                              stroke="var(--text-secondary)"
                              tick={{ fontSize: 10 }}
                              label={{ value: 'JTBD Score (Demanda - Importancia - Dificultad para lograrlo)', position: 'bottom', offset: 0, style: { fontSize: 11, fill: 'var(--text-secondary)', fontWeight: 500 } }}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="opportunityY" 
                              name="Cobertura de la Oferta" 
                              domain={[0, 10]} 
                              reversed={true}
                              stroke="var(--text-secondary)"
                              tick={{ fontSize: 10 }}
                              label={{ value: 'Cobertura del mercado (oferta)', angle: -90, position: 'insideLeft', offset: -10, style: { fontSize: 11, fill: 'var(--text-secondary)', textAnchor: 'middle', fontWeight: 500 } }}
                            />
                            
                            {/* Líneas de cuadrantes (Cortan en X=5 y Y=5) */}
                            <ReferenceLine x={5} stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth={1.5} />
                            <ReferenceLine y={5} stroke="var(--border-color)" strokeDasharray="4 4" strokeWidth={1.5} />
                            
                            <Tooltip content={<CustomJTBDTooltip />} />
                            
                            <Scatter 
                              name="Metas Financieras" 
                              data={jtbdChartData} 
                              shape={<CustomScatterPoint />}
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '8px', fontSize: '10px', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                        <span>Arriba: Mayor Dificultad / Menor Cobertura de Oferta (-)</span>
                        <span>Abajo: Menor Dificultad / Mayor Cobertura de Oferta (+)</span>
                      </div>
                    </div>

                    {/* Tabla de Ranking de Oportunidad */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
                        Ranking de metas según dolor observado
                      </p>
                      <div className="no-scrollbar jtbd-ranking-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {data.jtbdOpportunityData.map((job) => {
                          const meta = JTBD_META[job.key] || { num: '?', color: 'var(--text-secondary)' };
                          return (
                            <div 
                              key={job.key} 
                              title={JTBD_DETAILS[job.name.trim()] || ''}
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                padding: '8px 10px', 
                                borderRadius: 'var(--radius-md)', 
                                backgroundColor: meta.color, 
                                border: '1px solid rgba(255, 255, 255, 0.15)', 
                                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                                cursor: 'help',
                                flex: 1
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '85%', minWidth: 0 }}>
                                <div style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '50%', 
                                  backgroundColor: '#ffffff', 
                                  color: meta.color, 
                                  fontSize: '11px', 
                                  fontWeight: '800', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                }}>
                                  {meta.num}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
                                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {job.name}
                                  </span>
                                  <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.85)' }}>
                                    Imp: {job.importance} | Dif: {job.difficulty}
                                  </span>
                                </div>
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginLeft: '8px' }}>
                                {job.opportunity}
                              </span>
                            </div>
                          );
                        })}
                      </div>
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
                    limit={5}
                    isWalletList={true}
                  />
                  
                  <DemographicsBarList 
                    title="Género" 
                    dataObj={data.demographics.gender} 
                    total={data.totalResponses} 
                    limit={5}
                  />

                  <DemographicsBarList 
                    title="Situación Laboral" 
                    dataObj={data.demographics.employment} 
                    total={data.totalResponses} 
                    limit={5}
                  />

                  <DemographicsBarList 
                    title="Gestión de Finanzas" 
                    dataObj={data.demographics.budget} 
                    total={data.totalResponses} 
                    limit={5}
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: DESGLOSE DE PREGUNTAS (CON FILTRO DE ORIGEN HÍBRIDO) */}
          {activeTab === 'breakdown' && (() => {
            const jtbdPairs = [];
            const otherQuestions = [];
            const jobNamesOrder = [
              'Universalidad',
              'Seguridad',
              'Control',
              'Retribución',
              'Trazabilidad',
              'Rentabilidad del saldo',
              'Gestión de presupuesto',
              'Acceso para terceros',
              'Servicios cotidianos',
              'Diversidad de pagos'
            ];
            
            jobNamesOrder.forEach(job => {
              const impQuestion = filteredQuestions.find(q => q.title === `Importancia: ${job}`);
              const difQuestion = filteredQuestions.find(q => q.title === `Dificultad: ${job}`);
              
              if (impQuestion || difQuestion) {
                jtbdPairs.push({
                  jobName: job,
                  importance: impQuestion,
                  difficulty: difQuestion
                });
              }
            });
            
            filteredQuestions.forEach(q => {
              const isJtbd = jobNamesOrder.some(job => 
                q.title === `Importancia: ${job}` || q.title === `Dificultad: ${job}`
              );
              if (!isJtbd) {
                otherQuestions.push(q);
              }
            });

            return (
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

                {/* Listado de Preguntas Filtradas en Filas de Jobs */}
                {filteredQuestions.length === 0 ? (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '32px' }}>Sin preguntas cargadas para esta selección.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Renderizar los 10 pares de JTBD */}
                    {jtbdPairs.map(pair => (
                      <div 
                        key={pair.jobName} 
                        style={{ 
                          border: '1px solid var(--border-color)', 
                          borderRadius: 'var(--radius-lg)', 
                          padding: '20px', 
                          backgroundColor: 'var(--bg-primary)', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '16px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                        }}
                      >
                        {/* Row Header */}
                        <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                            Job: {pair.jobName}
                          </h3>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                            {JTBD_DETAILS[pair.jobName] || ''}
                          </span>
                        </div>
                        
                        {/* Grid de 2 columnas (Importancia y Dificultad) */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                          <div>
                            {pair.importance ? (
                              renderQuestionChart(pair.importance, `${pair.jobName}-imp`)
                            ) : (
                              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin datos de Importancia para este Job.</p>
                            )}
                          </div>
                          
                          <div>
                            {pair.difficulty ? (
                              renderQuestionChart(pair.difficulty, `${pair.jobName}-dif`)
                            ) : (
                              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin datos de Dificultad para este Job.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Renderizar otras preguntas que no son JTBD (como comentarios finales) */}
                    {otherQuestions.map((q, idx) => (
                      <div key={`other-${idx}`} className="card" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '16px' }}>
                          {q.title}
                        </h3>
                        {renderQuestionChart(q, `other-${idx}`)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

    </div>
  );
}
