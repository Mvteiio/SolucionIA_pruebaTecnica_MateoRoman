import React, { useState, useRef, useEffect } from 'react';
import data from '../../cajasan-ai-inbox/resultado_final_cajasan.json';
import logoCajasan from './assets/cajasan.png';

// Fallback if data is missing or not an array
const safeData = Array.isArray(data) ? data : [];

// --- Icons Components ---
const IconSearch = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);

const IconTicket = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
);

const IconAlert = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);

const IconFire = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>
);

const IconRobot = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
);

const IconUser = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const IconClock = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);


export default function App() {
  const [activeTab, setActiveTab] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL', 'CRITICAL', 'URGENT'

  // Tab Animation Logic
  const tabsRef = useRef({});
  const [tabStyle, setTabStyle] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const activeElement = tabsRef.current[activeTab];
    if (activeElement) {
      setTabStyle({
        left: activeElement.offsetLeft,
        width: activeElement.offsetWidth,
        opacity: 1
      });
    }
  }, [activeTab]);

  // Debugging
  console.log("App Rendered. Data length:", safeData.length);

  // 0. Simple Mapping & Sorting (No Deduplication)
  const processedData = React.useMemo(() => {
    return [...safeData].sort((a, b) => {
        // Sort final list by date desc
        return new Date(b.fecha_iso || b.fecha) - new Date(a.fecha_iso || a.fecha);
    });
  }, [safeData]);

  // 1. Combined Filtering Logic (Category & Search & Status)
  const filteredData = processedData.filter(item => {
    const matchesTab = activeTab === 'TODOS' || item.categoria === activeTab;
    const matchesSearch = 
      (item.resumen_ejecutivo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.remitente && item.remitente.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.accion_inmediata && item.accion_inmediata.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status Filter Logic
    let matchesStatus = true;
    if (statusFilter === 'CRITICAL') matchesStatus = item.prioridad >= 4;
    if (statusFilter === 'URGENT') matchesStatus = item.sentimiento === 'Urgente';
    if (statusFilter === 'UNSOLVED') matchesStatus = item.solucionado !== true;
    
    return matchesTab && matchesSearch && matchesStatus;
  });

  // 2. Metric Calculations
  const stats = {
    total: processedData.length,
    criticos: processedData.filter(d => d.prioridad >= 4).length,
    urgentes: processedData.filter(d => d.sentimiento === 'Urgente').length,
    pendientes: processedData.filter(d => d.solucionado !== true).length
  };

  const percentCriticos = stats.total > 0 ? (stats.criticos / stats.total) * 100 : 0;
  const percentUrgentes = stats.total > 0 ? (stats.urgentes / stats.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* HEADER */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-1 bg-white rounded-lg shadow-sm border border-slate-100">
              <img src={logoCajasan} alt="Logo Cajasan" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <h1 className="text-slate-900 text-lg font-bold tracking-tight leading-none">
                AI Tech<span className="text-blue-600">Inbox</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Cajasan Intelligent Support</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold tracking-wide">OPERATIONAL</span>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          
          {/* TOTAL TICKETS CARD */}
          <div 
             onClick={() => setStatusFilter('ALL')}
             className={`relative group overflow-hidden bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
               statusFilter === 'ALL' ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 hover:border-slate-300'
             }`}
          >
            <div className="absolute top-0 right-0 p-4 text-blue-500 opacity-10 group-hover:opacity-20 transition-opacity">
              <IconTicket />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Total de Mensajes</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{stats.total}</span>
              <span className="text-xs font-medium text-slate-400">procesados</span>
            </div>
            <div className="w-full bg-blue-50 h-1 mt-4 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${statusFilter === 'ALL' ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* UNSOLVED TICKETS CARD (NEW) */}
          <div 
             onClick={() => setStatusFilter('UNSOLVED')}
             className={`relative group overflow-hidden bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
               statusFilter === 'UNSOLVED' ? 'border-slate-500 ring-2 ring-slate-500/20' : 'border-slate-200 hover:border-slate-300'
             }`}
          >
            <div className="absolute top-0 right-0 p-4 text-slate-400 opacity-10 group-hover:opacity-20 transition-opacity">
              <IconClock />
            </div>
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1">Tickets Sin Resolver</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{stats.pendientes}</span>
              <span className="text-xs font-medium text-slate-400">pendientes</span>
            </div>
            <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${statusFilter === 'UNSOLVED' ? 'bg-slate-600' : 'bg-slate-400'}`} style={{ width: '100%' }}></div>
            </div>
          </div>

          {/* CRITICAL PRIORITY CARD */}
          <div 
             onClick={() => setStatusFilter('CRITICAL')}
             className={`relative group overflow-hidden bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
               statusFilter === 'CRITICAL' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-red-100 hover:border-red-200'
             }`}
          >
            <div className="absolute top-0 right-0 p-4 text-red-500 opacity-10 group-hover:opacity-20 transition-opacity">
              <IconAlert />
            </div>
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Prioridad Crítica</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{stats.criticos}</span>
              <span className="text-xs font-medium text-red-400">P4 - P5</span>
            </div>
             <div className="w-full bg-red-50 h-1 mt-4 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${statusFilter === 'CRITICAL' ? 'bg-red-600' : 'bg-red-500'}`} style={{ width: `${percentCriticos}%` }}></div>
            </div>
          </div>

          {/* URGENT SENTIMENT CARD */}
          <div 
             onClick={() => setStatusFilter('URGENT')}
             className={`relative group overflow-hidden bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer ${
               statusFilter === 'URGENT' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-orange-100 hover:border-orange-200'
             }`}
          >
            <div className="absolute top-0 right-0 p-4 text-orange-500 opacity-10 group-hover:opacity-20 transition-opacity">
              <IconFire />
            </div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Sentimiento Urgente</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-slate-900">{stats.urgentes}</span>
              <span className="text-xs font-medium text-orange-400">solicitudes</span>
            </div>
            <div className="w-full bg-orange-50 h-1 mt-4 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-1000 ${statusFilter === 'URGENT' ? 'bg-orange-600' : 'bg-orange-500'}`} style={{ width: `${percentUrgentes}%` }}></div>
            </div>
          </div>

        </div>

        {/* CONTROL BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          
          <div className="relative flex overflow-x-auto gap-1 p-1 scrollbar-hide">
            {/* Animated Pill */}
            <div 
              className="absolute top-1 bottom-1 bg-slate-900 rounded-xl transition-all duration-300 ease-out shadow-md"
              style={{ 
                left: tabStyle.left, 
                width: tabStyle.width,
                opacity: tabStyle.opacity 
              }}
            />
            
            {['TODOS', 'Soporte Técnico', 'Software', 'Infraestructura', 'Solicitud Acceso', 'Administrativo', 'Otro'].map(cat => (
              <button
                key={cat}
                ref={el => tabsRef.current[cat] = el}
                onClick={() => setActiveTab(cat)}
                className={`relative z-10 px-4 py-2 text-xs font-bold transition-colors duration-300 rounded-xl whitespace-nowrap ${
                  activeTab === cat 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 px-1">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </div>
            <input
              type="text"
              placeholder="Buscar tickets..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TICKET FEED (Replacing Table) */}
        <div className="grid grid-cols-1 gap-4">
          {filteredData.map((item, index) => (
            <div 
              key={index} 
              className={`group bg-white rounded-xl border p-5 transition-all duration-300 ease-out hover:scale-[1.01] hover:shadow-xl cursor-default ${
                item.prioridad >= 4 ? 'border-red-100 shadow-red-100/20' : 
                item.prioridad === 3 ? 'border-orange-100 shadow-orange-100/20' : 
                'border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Priority Status Column */}
                <div className="md:w-24 flex-shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold shadow-sm ${
                      item.prioridad >= 4 ? 'bg-red-50 text-red-600 border border-red-100' : 
                      item.prioridad === 3 ? 'bg-orange-50 text-orange-600 border border-orange-100' : 
                      'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  }`}>
                    {item.prioridad}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-slate-400 leading-tight">Prioridad</span>
                    <span className={`text-xs font-black uppercase ${
                      item.prioridad >= 4 ? 'text-red-600' : item.prioridad === 3 ? 'text-orange-500' : 'text-emerald-600'
                    }`}>
                      {item.prioridad >= 4 ? 'Crítica' : item.prioridad === 3 ? 'Alta' : 'Normal'}
                    </span>
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-md tracking-wide">
                      {item.fecha}
                    </span>
                    <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-md tracking-wide border border-blue-100">
                      {item.categoria}
                    </span>
                    {item.sentimiento === 'Urgente' && (
                       <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-md tracking-wide border border-red-100 flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Urgent
                       </span>
                    )}
                    {/* Solution Status Badge */}
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md tracking-wide border flex items-center gap-1 ${
                      item.solucionado 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {item.solucionado ? (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                          Solucionado
                        </>
                      ) : (
                        <>
                           <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                           Sin Solucionar
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-slate-400"><IconUser /></span>
                    <h3 className="text-slate-900 font-bold text-base">
                      {item.remitente || "Remitente Desconocido"}
                    </h3>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed mb-4">
                    {item.resumen_ejecutivo}
                  </p>

                  {/* Key Data Grid */}
                  {item.datos_clave && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                      {typeof item.datos_clave === 'object' ? (
                        Object.entries(item.datos_clave).map(([key, value]) => (
                          <div key={key} className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-xs flex items-center gap-2">
                            <span className="font-bold text-slate-700">{isNaN(key) ? key : parseInt(key) + 1}:</span> 
                            <span className="text-slate-500 truncate" title={typeof value === 'object' && value !== null ? JSON.stringify(value) : value}>
                              {typeof value === 'object' && value !== null ? JSON.stringify(value) : value}
                            </span>
                          </div>
                        ))
                      ) : (
                         <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 text-xs text-slate-600">
                           {item.datos_clave}
                         </div>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Recommendation Panel */}
                <div className="md:w-72 flex-shrink-0 bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex flex-col justify-center relative overflow-hidden transition-all duration-300 hover:bg-blue-100/80 hover:scale-[1.02] hover:shadow-md group/ai">
                   <div className="absolute -right-4 -top-4 text-blue-100 opacity-50 transition-transform duration-500 group-hover/ai:scale-110 group-hover/ai:rotate-12">
                     <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2M7.5 13A2.5 2.5 0 0 0 5 15.5V19h14v-3.5a2.5 2.5 0 0 0-2.5-2.5h-9z"/></svg>
                   </div>
                   
                   <div className="flex items-center gap-2 mb-2 relative z-10">
                     <span className="text-blue-600"><IconRobot /></span>
                     <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Recomendación IA</span>
                   </div>
                   <p className="text-sm font-bold text-slate-800 leading-snug relative z-10">
                     {item.accion_inmediata || item.accion_sugerida}
                   </p>
                </div>

              </div>
            </div>
          ))}

          {filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-dashed border-slate-300">
              <div className="text-slate-300 mb-4">
                <IconSearch />
              </div>
              <p className="text-slate-500 font-bold">No se encontraron resultados.</p>
              <p className="text-slate-400 text-sm">Intenta ajustar tu búsqueda o filtros.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}