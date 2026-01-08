import React, { useState } from 'react';
import data from '../../cajasan-ai-inbox/resultado_final_cajasan.json';
import logoCajasan from './assets/cajasan.png'; // Ajusta el nombre del archivo

export default function App() {
  const [activeTab, setActiveTab] = useState('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Lógica de Filtrado Combinada
  const filteredData = data.filter(item => {
    const matchesTab = activeTab === 'TODOS' || item.categoria === activeTab;
    const matchesSearch = 
      item.resumen_ejecutivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.accion_inmediata.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesTab && matchesSearch;
  });

  // 2. Cálculo de métricas para los StatCards
  const stats = {
    total: data.length,
    criticos: data.filter(d => d.prioridad >= 4).length,
    enojados: data.filter(d => d.sentimiento === 'Enojado').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* BARRA SUPERIOR CORPORATIVA */}
      <nav className="bg-cajasan-blue w-full py-4 px-8 flex justify-between items-center shadow-xl border-b border-blue-900">
        {/* Contenedor de Logo + Texto */}
        <div className="flex items-center gap-4">
          <img 
            src={logoCajasan} 
            alt="Logo Cajasan" 
            className="h-10 w-auto object-contain bg-white p-1 rounded-md" 
          />
          <h1 className="text-white text-2xl font-black tracking-tighter">
            CAJASAN <span className="font-light opacity-90">| AI Smart Inbox</span>
          </h1>
        </div>

        {/* Indicador de sistema (se mantiene igual) */}
        <div className="flex items-center gap-3 bg-blue-800/50 py-2 px-4 rounded-lg border border-blue-700">
            <div className="h-2.5 w-2.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-bold uppercase tracking-widest">Sistema Activo</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* KPI CARDS (Métricas Superiores) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white border-2 border-cajasan-blue/40 p-6 rounded-xl shadow-[0_4px_0_0_#0033A0]">
            <p className="text-[11px] font-black text-cajasan-blue uppercase mb-2">Mensajes Analizados</p>
            <p className="text-5xl font-black text-cajasan-blue">{stats.total}</p>
          </div>

          <div className="bg-white border-2 border-red-500 p-6 rounded-xl shadow-[0_4px_0_0_#dc2626]">
            <p className="text-[11px] font-black text-slate-500 uppercase mb-2">Casos Críticos (P4-P5)</p>
            <p className="text-5xl font-black text-red-600">{stats.criticos}</p>
          </div>

          <div className="bg-white border-2 border-orange-400 p-6 rounded-xl shadow-[0_4px_0_0_#ea580c]">
            <p className="text-[11px] font-black text-slate-500 uppercase mb-2">Alertas de Tono</p>
            <div className="flex justify-between items-end">
              <p className="text-5xl font-black text-orange-500">{stats.enojados}</p>
              <span className="text-3xl">😠</span>
            </div>
          </div>
        </div>

        {/* CONTROLES: Filtros y Buscador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b-2 border-slate-300 pb-4">
          <div className="flex overflow-x-auto">
            {['TODOS', 'SALUD', 'VIVIENDA', 'SUBSIDIOS', 'TURISMO', 'PQRS'].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-6 py-3 text-sm font-bold transition-all border-b-4 -mb-[18px] ${
                  activeTab === cat 
                  ? 'border-cajasan-blue text-cajasan-blue bg-blue-50' 
                  : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por ID o palabra clave..."
              className="block w-full pl-4 pr-3 py-2.5 border-2 border-slate-300 rounded-xl bg-white text-sm font-bold focus:ring-2 focus:ring-cajasan-blue focus:border-cajasan-blue transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="overflow-hidden border-2 border-slate-300 rounded-xl shadow-md bg-white">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-300">
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-600 uppercase">Prioridad</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-600 uppercase">Información del Afiliado</th>
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-600 uppercase">Hoja de Ruta IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-6 align-top">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 font-bold text-xs ${
                      item.prioridad >= 4 ? 'bg-red-100 border-red-400 text-red-700' : 'bg-white border-slate-300 text-slate-700'
                    }`}>
                      <div className={`h-2.5 w-2.5 rounded-full ${item.prioridad >= 4 ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      P{item.prioridad}
                    </div>
                  </td>
                  
                  <td className="px-6 py-6">
                    <div className="flex flex-wrap gap-2 items-center mb-2">
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-black uppercase rounded border border-slate-300">
                          ID: {item.id.replace('MSG-', '')}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 text-cajasan-blue text-[10px] font-black uppercase rounded border border-blue-200">
                          {item.categoria}
                        </span>
                        <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded border ${
                            item.sentimiento === 'Enojado' ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                            {item.sentimiento}
                        </span>
                    </div>
                    <p className="text-slate-900 font-bold text-[15px] leading-tight mb-2">{item.resumen_ejecutivo}</p>
                    <p className="text-xs font-medium text-slate-500 italic">📌 {item.datos_clave || 'Sin datos adicionales'}</p>
                  </td>
                  
                  <td className="px-6 py-6 bg-slate-50/50">
                    <div className="border-l-4 border-cajasan-blue pl-4 py-1">
                      <p className="text-[10px] font-bold text-cajasan-blue uppercase mb-1">Acción Recomendada:</p>
                      <p className="text-sm font-bold text-slate-800 leading-snug">{item.accion_inmediata}</p>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="p-20 text-center bg-white">
              <p className="text-slate-400 font-bold text-lg">No se encontraron mensajes para esta búsqueda.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}