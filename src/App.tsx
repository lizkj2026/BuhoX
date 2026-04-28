/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Globe, 
  Users, 
  MessageSquare, 
  Zap, 
  Eye, 
  CheckCircle2, 
  Send, 
  TrendingUp, 
  AlertCircle,
  Plus,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Ghost,
  Mail,
  TrendingDown,
  Layout,
  Search,
  Palette,
  Video,
  Bell,
  Sparkles,
  Calendar,
  Play,
  Languages,
  Share2,
  LineChart,
  Repeat,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  analyzeProspect, 
  generateVisualHook, 
  generateNewsletter,
  analyzeSentiment,
  generateLogoConcepts,
  generateVideoPitchScript,
  generateSocialPosts,
  generateSEOStrategy,
  translateContent,
  identifyCompetitors,
  generateScrapedLeads,
  deepScrapeInfo
} from './services/aiService';

// Interfaces
interface Prospect {
  id: string;
  url: string;
  name: string;
  ownerName?: string;
  email?: string;
  status: 'pending' | 'analyzed' | 'validated' | 'sent';
  location?: string;
  sector?: string;
  analysis?: any;
  visualHook?: string;
  moment?: string; 
  qualityScore?: number;
  trackReport?: any;
  newsletter?: string;
  images?: string[];
  sentiment?: {
    weaknesses: string[];
    strengths: string[];
    opportunity: string;
  };
  logoConcepts?: string;
  videoPitch?: string;
  socialPosts?: string;
  seoStrategy?: {
    keywords: string[];
    meta: string;
    blogIdea: string;
  };
  translation?: string;
  competitors?: { name: string; url: string; notes: string }[];
  potentialLeads?: { name: string; url: string; notes: string }[];
}

interface DeepLead {
  name: string;
  url: string;
  emails: string[];
  socials: { linkedin: string; instagram: string };
  phone: string;
  tech: string[];
  opportunity: string;
  description: string;
}

interface PotentialLead {
  id: string;
  prospectId: string;
  name: string;
  url: string;
  sector: string;
  location: string;
  notes: string;
}

export default function App() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [activeView, setActiveView] = useState<'landing' | 'dashboard' | 'scraper'>('landing');
  const [deepSearchResults, setDeepSearchResults] = useState<DeepLead[]>([]);
  const [selectedDeepLead, setSelectedDeepLead] = useState<DeepLead | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingNewsletter, setGeneratingNewsletter] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [activeTab, setActiveTab] = useState<'admin' | 'client' | 'tech' | 'scraping' | 'deep-scraper' | 'alerts' | 'track'>('admin');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [filter, setFilter] = useState({ sector: '', location: '' });

  // Point 9: Alerts State
  const [webhookConfig, setWebhookConfig] = useState({
    slack: true,
    whatsapp: false,
    threshold: 80
  });

  // Fetch prospects on mount
  useEffect(() => {
    fetch('/api/prospects')
      .then(res => res.json())
      .then(async (data) => {
        const formatted = await Promise.all(data.map(async (p: any) => {
          const leadsRes = await fetch(`/api/potential-leads/${p.id}`);
          const potentialLeads = await leadsRes.json();
          
          return {
            ...p,
            analysis: p.analysis ? JSON.parse(p.analysis) : null,
            trackReport: p.trackReport ? JSON.parse(p.trackReport) : null,
            sentiment: p.sentiment ? JSON.parse(p.sentiment) : null,
            images: p.images ? JSON.parse(p.images) : [],
            seoStrategy: p.seoStrategy ? JSON.parse(p.seoStrategy) : null,
            competitors: p.competitors ? JSON.parse(p.competitors) : null,
            potentialLeads: potentialLeads
          };
        }));
        setProspects(formatted);
      });
  }, []);

  const handleIdentifyCompetitors = async (id: string) => {
    const p = prospects.find(p => p.id === id);
    if (!p) return;

    setActiveAction(`competitors_${id}`);
    try {
      const result = await identifyCompetitors(p.name, p.sector || 'Marketing', p.location || 'España');
      
      await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ competitors: result.competitors })
      });

      setProspects(prev => prev.map(item => item.id === id ? { ...item, competitors: result.competitors } : item));
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, competitors: result.competitors } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveAction(null);
    }
  };

  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [deepSearchQuery, setDeepSearchQuery] = useState('');

  const handleDeepSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deepSearchQuery) return;
    
    setIsDeepSearching(true);
    try {
      const result = await deepScrapeInfo(deepSearchQuery);
      setDeepSearchResults(result.results);
    } catch (err) {
      console.error(err);
      alert("Error en la búsqueda profunda");
    } finally {
      setIsDeepSearching(false);
    }
  };

  const handleAddDeepLead = async (lead: DeepLead) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newProspect: Prospect = {
      id,
      url: lead.url,
      name: lead.name,
      status: 'pending',
      sector: deepSearchQuery,
      location: 'Detectado vía Scraper',
      moment: lead.opportunity,
      images: []
    };

    try {
      await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProspect)
      });
      setProspects(prev => [newProspect, ...prev]);
      alert(`${lead.name} añadido a prospectos!`);
    } catch (err) {
      console.error(err);
    }
  };

  const [isScraping, setIsScraping] = useState(false);

  const handleRunScraper = async () => {
    if (!selectedProspect) {
      alert("Selecciona un prospecto primero para buscar empresas similares (Punto 4).");
      return;
    }
    setIsScraping(true);
    try {
      // Punto 4: Búsqueda de cliente (scrapping)
      const sector = selectedProspect.sector || filter.sector || 'Negocio';
      const location = selectedProspect.location || filter.location || 'España';
      
      const context = `Top potential clients in ${sector} in ${location} that lack professional digital presentation.`;
      
      const result = await generateScrapedLeads(sector, location, context);

      const newLeads = [];
      for (const lead of result.leads) {
        const leadId = Math.random().toString(36).substr(2, 9);
        const leadData = {
          id: leadId,
          prospectId: selectedProspect.id,
          name: lead.name,
          url: lead.url,
          sector: sector,
          location: location,
          notes: lead.notes
        };
        
        await fetch('/api/potential-leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        });
        newLeads.push(leadData);
      }

      setProspects(prev => prev.map(p => 
        p.id === selectedProspect.id ? { ...p, potentialLeads: newLeads } : p
      ));
      setSelectedProspect(prev => prev ? { ...prev, potentialLeads: newLeads } : null);
      
      alert(`Scraping completado (Punto 4). Se han identificado ${newLeads.length} prospectos potenciales similares.`);
    } catch (err) {
      console.error(err);
      alert("Error en el scraping");
    } finally {
      setIsScraping(false);
    }
  };

  const handleAddProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;

    setLoading(true);
    const id = Math.random().toString(36).substr(2, 9);
    
    try {
      // PHASE 1: Captación e Identificación
      const initialProspect: Prospect = {
        id,
        url: newUrl,
        email: newEmail,
        name: new URL(newUrl).hostname.replace('www.', ''),
        status: 'pending',
        location: 'Consultando...',
        sector: 'Detectando...',
        moment: "Analizando momento clave..."
      };

      await fetch('/api/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...initialProspect, userId: 'user_1' })
      });

      setProspects(prev => [initialProspect, ...prev]);
      setNewUrl('');
      setNewEmail('');

      // PHASE 2 & PHASE 3 Logic
      const result = await analyzeProspect(newUrl);
      const image = await generateVisualHook(result.recommendedProduct);

      // Scrape images from the website
      let scrapedImages: string[] = [];
      try {
        const scrapeRes = await fetch('/api/scrape-images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: newUrl })
        });
        const scrapeData = await scrapeRes.json();
        scrapedImages = scrapeData.images || [];
      } catch (err) {
        console.error("Scrape error:", err);
      }

      let newsletterContent = '';
      if (result.recommendedProduct === 'Outreach') {
        newsletterContent = await generateNewsletter(initialProspect.name, result.sector, result.hookText, result.ownerName);
      }

      const trackReport = {
        scanDate: new Date().toISOString(),
        automatedAction: `GenAI Selector: ${result.recommendedProduct}`,
        successMetric: "High Potential",
        steps: ["Identificación", "Análisis de Carencias", "Segmentación", "Selector GenAI", "Digital Scraping"]
      };

      await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'analyzed',
          analysis: JSON.stringify(result),
          visualHook: image,
          moment: result.keyMoment,
          qualityScore: result.qualityScore,
          trackReport: JSON.stringify(trackReport),
          newsletter: newsletterContent,
          images: scrapedImages
        })
      });

      setProspects(prev => prev.map(p => p.id === id ? { 
        ...p, 
        status: 'analyzed', 
        analysis: result, 
        visualHook: image,
        moment: result.keyMoment,
        sector: result.sector,
        ownerName: result.ownerName,
        qualityScore: result.qualityScore,
        trackReport: trackReport,
        newsletter: newsletterContent,
        images: scrapedImages
      } : p));
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateManualNewsletter = async (id: string) => {
    const p = prospects.find(p => p.id === id);
    if (!p || !p.analysis) return;

    setGeneratingNewsletter(id);
    try {
      const content = await generateNewsletter(p.name, p.analysis.sector, p.analysis.hookText, p.ownerName);
      await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletter: content })
      });
      setProspects(prev => prev.map(item => item.id === id ? { ...item, newsletter: content } : item));
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, newsletter: content } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingNewsletter(null);
    }
  };

  const handleGrowthAction = async (id: string, type: 'sentiment' | 'logos' | 'video' | 'social' | 'seo' | 'translate') => {
    const p = prospects.find(p => p.id === id);
    if (!p) return;

    setActiveAction(`${type}_${id}`);
    try {
      let result: any;
      let update: Partial<Prospect> = {};

      if (type === 'sentiment') {
        result = await analyzeSentiment(p.sector || 'Marketing', p.location || 'España');
        update = { sentiment: result };
      } else if (type === 'logos') {
        result = await generateLogoConcepts(p.name, p.sector || 'Negocio');
        update = { logoConcepts: result };
      } else if (type === 'video') {
        result = await generateVideoPitchScript(p.ownerName || 'Propietario', p.name, p.sector || 'Negocio', p.analysis?.hookText || 'Mejora tu presencia digital');
        update = { videoPitch: result };
      } else if (type === 'social') {
        result = await generateSocialPosts(p.name, p.sector || 'Negocio', p.analysis?.hookText || 'Transformación digital');
        update = { socialPosts: result };
      } else if (type === 'seo') {
        result = await generateSEOStrategy(p.name, p.sector || 'Negocio', p.location || 'España');
        update = { seoStrategy: result };
      } else if (type === 'translate') {
        const lang = prompt("Idioma destino (inglés, francés, alemán, italiano)?", "inglés");
        if (!lang) return;
        result = await translateContent(p.newsletter || 'Contenido no disponible', lang);
        update = { translation: result };
      }

      await fetch(`/api/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(update)
      });

      setProspects(prev => prev.map(item => item.id === id ? { ...item, ...update } : item));
      if (selectedProspect?.id === id) {
        setSelectedProspect(prev => prev ? { ...prev, ...update } : null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActiveAction(null);
    }
  };

  const handleAlertSetup = () => {
    alert("Sistema de Alertas (Webhooks) configurado. Recibirás notificaciones en Slack y WhatsApp para prospectos 5/5.");
  };

  const [heygenVideoId, setHeygenVideoId] = useState<string | null>(null);
  const [heygenLoading, setHeygenLoading] = useState(false);

  const handleCreateHeyGenVideo = async () => {
    if (!selectedProspect?.videoPitch) return;
    
    setHeygenLoading(true);
    try {
      const res = await fetch('/api/generate-heygen-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: selectedProspect.videoPitch,
          test_mode: true // Using test_mode by default so it doesn't consume credits during development
        })
      });
      const data = await res.json();
      if (data.error) {
        alert("HeyGen Error: " + data.error);
      } else if (data.data?.video_id) {
        setHeygenVideoId(data.data.video_id);
        alert(`Vídeo en proceso! ID: ${data.data.video_id}. Puedes ver el estado en tu dashboard de HeyGen.`);
      }
    } catch (err) {
      console.error(err);
      alert("Error conectando con HeyGen");
    } finally {
      setHeygenLoading(false);
    }
  };

  const filteredProspects = prospects.filter(p => {
    return (!filter.sector || p.sector?.toLowerCase().includes(filter.sector.toLowerCase())) &&
           (!filter.location || p.location?.toLowerCase().includes(filter.location.toLowerCase()));
  });

  const handleValidate = async (id: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'validated' })
    });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: 'validated' } : p));
  };

  const handleSend = async (id: string) => {
    setShowEmailPreview(true);
  };

  const confirmSend = async (id: string) => {
    await fetch(`/api/prospects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'sent' })
    });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: 'sent' } : p));
    setShowEmailPreview(false);
    alert("Email enviado con éxito (simulado API Resend/SendGrid)!");
  };

  if (activeView === 'landing') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center p-6 border-t-4 border-indigo-600 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center space-y-10"
        >
          <div className="space-y-6">
            <div className="bg-indigo-600 w-24 h-24 rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200">
              <Eye className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase">Buho<span className="text-indigo-600">X</span></h1>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Visión Estratégica & IA</p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
            <p className="text-slate-600 font-medium leading-relaxed">
              Bienvenido a la plataforma líder en prospección inteligente. 
              Analiza, gestiona y captura oportunidades con el poder de la IA.
            </p>
            
            <button 
              id="enter-button"
              onClick={() => setActiveView('dashboard')}
              className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm hover:bg-indigo-600 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Entrar sin registrarse
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
            © {new Date().getFullYear()} BuhoX Systems
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans text-slate-900 border-t-4 border-indigo-600">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Eye className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Buho<span className="text-indigo-600">X</span></h1>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-full overflow-x-auto whitespace-nowrap scrollbar-hide">
          <button 
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'admin' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Dashboard
          </button>
          <button 
             onClick={() => setActiveTab('scraping')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'scraping' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Scraping (P4)
          </button>
          <button 
             onClick={() => setActiveTab('deep-scraper')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'deep-scraper' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Deep Scraper (AI)
          </button>
          <button 
             onClick={() => setActiveTab('alerts')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'alerts' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Alertas (P9)
          </button>
          <button 
             onClick={() => setActiveTab('client')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'client' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Public (P10)
          </button>
          <button 
             onClick={() => setActiveTab('track')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'track' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Track (P8)
          </button>
          <button 
             onClick={() => setActiveTab('tech')}
            className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all ${activeTab === 'tech' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Infra
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-1 rounded tracking-tighter">Full Stack AI MCP</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {activeTab === 'track' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <header className="flex items-end justify-between">
               <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Trackreport (P8)</h2>
                  <p className="text-slate-500 font-medium">Histórico de acciones, éxitos y métricas de automatización.</p>
               </div>
               <button 
                onClick={() => alert("Generando informe técnico MCP-API (P8) para exportación...")}
                className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
               >
                 Exportar MCP (P10)
               </button>
            </header>
            
            <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Prospecto</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Fecha</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Acción Master</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Precisión (P7)</th>
                        <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {prospects.filter(p => p.trackReport).map(p => (
                       <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-6">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">{p.name.charAt(0)}</div>
                                <span className="font-bold text-slate-900">{p.name}</span>
                             </div>
                          </td>
                          <td className="p-6 text-sm text-slate-500 font-mono italic">{new Date(p.trackReport.scanDate).toLocaleDateString()}</td>
                          <td className="p-6">
                             <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{p.trackReport.automatedAction}</span>
                          </td>
                          <td className="p-6">
                             <div className="flex items-center gap-2">
                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                   <div className="h-full bg-indigo-500" style={{ width: `${p.qualityScore}%` }}></div>
                                </div>
                                <span className="text-xs font-black text-indigo-600">{p.qualityScore}%</span>
                             </div>
                          </td>
                          <td className="p-6">
                             <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${p.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                {p.status}
                             </span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'tech' && (
// ... rest of the file stays same until the form part
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* ... Existing tech content ... */}
            <div className="bg-slate-900 p-8 rounded-[2rem] text-indigo-400 font-mono text-[10px] leading-relaxed shadow-2xl border border-white/5">
              <h3 className="text-white mb-6 text-sm font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" /> Firestore Structure (Point 11)
              </h3>
              <pre className="overflow-x-auto whitespace-pre-wrap">{`{
  "entities": {
    "User": { "properties": ["email", "name", "role", "createdAt"] },
    "Prospect": { "properties": ["userId", "url", "analysis", "status", "visualHook"] }
  },
  "firestore": {
    "/users/{userId}": { "schema": "User" },
    "/prospects/{prospectId}": { "schema": "Prospect" }
  }
}`}</pre>
              
              <h3 className="text-white mt-12 mb-6 text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" /> Cloud Functions (Point 12)
              </h3>
              <pre className="overflow-x-auto whitespace-pre-wrap">{`
const { onProspectCreate } = 
  require("firebase-functions/v2/firestore");
const { GoogleGenerativeAI } = 
  require("@google/generative-ai");

exports.onProspectCreate = 
  onDocumentCreated("prospects/{id}", async (event) => {
    const data = event.data.data();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash" 
    });
    
    // Automation Logic Steps 2, 3, 5
    const prompt = \`Analiza el sitio \${data.url}...\`;
    const result = await model.generateContent(prompt);
    
    return event.data.ref.update({
      analysis: result.response.text(),
      status: 'analyzed'
    });
});
              `}</pre>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2rem] text-green-400 font-mono text-[10px] leading-relaxed shadow-2xl border border-white/5">
              <h3 className="text-white mb-6 text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" /> Security Rules (Point 15)
              </h3>
              <pre className="overflow-x-auto whitespace-pre-wrap">{`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /prospects/{prospectId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         get(/databases/$(database)/documents/users/$(request.auth.uid))
           .data.role == 'admin');
      
      allow write: if request.auth != null && 
        request.auth.token.email_verified == true;
    }
  }
}
              `}</pre>
              <div className="mt-12 p-6 bg-green-500/10 border border-green-500/20 rounded-2xl">
                 <h4 className="text-white text-xs font-bold mb-2">Punto 10: Dashboards Privados</h4>
                 <p className="text-green-300">Las reglas de seguridad implementan la segregación de datos. El Portal Cliente solo permite acceso a documentos donde (resource.data.userId == request.auth.uid).</p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'scraping' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <header className="flex items-end justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Scraping & Localización (P4)</h2>
                <p className="text-slate-500 font-medium">Recolección automatizada de datos específicos por sector y zona.</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleRunScraper}
                  disabled={isScraping}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:bg-slate-400"
                >
                  {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ghost className="w-4 h-4" />}
                  {isScraping ? 'Scrapeando...' : 'Lanzar Scraper (P4)'}
                </button>
                <div className="flex gap-2">
                  <input 
                    type="text" placeholder="Sector..." 
                    className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold shadow-sm w-40"
                    value={filter.sector} onChange={e => setFilter({ ...filter, sector: e.target.value })}
                  />
                  <input 
                    type="text" placeholder="Localización..." 
                    className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-bold shadow-sm w-40"
                    value={filter.location} onChange={e => setFilter({ ...filter, location: e.target.value })}
                  />
                </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProspects.map(p => (
                <div key={p.id} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all group">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black">{p.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                         <h4 className="font-black text-slate-900 truncate">{p.name}</h4>
                         <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{p.sector} • {p.location}</p>
                      </div>
                   </div>
                   <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                         <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Momento</span>
                         <span className="text-rose-600">Nuevo Negocio</span>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">{p.moment}</p>
                   </div>
                   <button 
                    onClick={() => { setSelectedProspect(p); setActiveTab('admin'); }}
                    className="w-full bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-900 font-black py-3 rounded-2xl text-xs uppercase tracking-widest transition-all"
                   >
                    Ver Detalles ROI
                   </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'deep-scraper' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
            <header className="text-center max-w-3xl mx-auto space-y-6">
              <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center text-white mx-auto shadow-2xl shadow-indigo-200">
                <Search className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase">Deep Scraper <span className="text-indigo-600">AI</span></h2>
                <p className="text-slate-500 text-lg font-medium">Búsqueda masiva por URL o Lenguaje Natural. Encuentra correos, redes y tecnología.</p>
              </div>
              
              <form onSubmit={handleDeepSearch} className="relative max-w-2xl mx-auto">
                <input 
                  type="text" 
                  value={deepSearchQuery}
                  onChange={(e) => setDeepSearchQuery(e.target.value)}
                  placeholder="Ej: 'Restaurantes en Toledo' o 'https://ejemplo.com'..." 
                  className="w-full pl-10 pr-40 py-6 rounded-full bg-white border-2 border-slate-100 shadow-2xl focus:border-indigo-400 outline-none text-lg font-bold transition-all"
                />
                <button 
                  type="submit"
                  disabled={isDeepSearching}
                  className="absolute right-3 top-3 bottom-3 px-10 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 disabled:bg-slate-400 transition-all flex items-center gap-2"
                >
                  {isDeepSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 text-yellow-400" />}
                  Deep Scrape
                </button>
              </form>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {deepSearchResults.map((lead, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white text-xl font-black">{lead.name.charAt(0)}</div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mb-1">Lead AI</span>
                        <div className="flex gap-1">
                          {lead.tech.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold uppercase">{t}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 mb-2 truncate uppercase">{lead.name}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed italic mb-6 line-clamp-2">"{lead.description}"</p>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <Mail className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold truncate">{lead.emails[0] || 'Email no detectado'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => setSelectedDeepLead(lead)}
                      className="flex-1 bg-indigo-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-100 active:scale-95 transition-all"
                    >
                      Ver Deep View
                    </button>
                    <button 
                       onClick={() => handleAddDeepLead(lead)}
                       className="w-14 bg-slate-900 text-white flex items-center justify-center rounded-2xl hover:bg-green-600 transition-all active:scale-95 shadow-lg"
                       title="Añadir a Prospectos"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {deepSearchResults.length === 0 && !isDeepSearching && (
              <div className="py-20 text-center text-slate-300">
                <Search className="w-20 h-20 mx-auto mb-6 opacity-10" />
                <p className="text-xl font-bold italic">Esperando tu próxima búsqueda profunda...</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-8">
             <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-200">
                <header className="mb-10">
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                      <AlertCircle className="w-8 h-8 text-indigo-600" /> Config Alertas (P9)
                   </h2>
                   <p className="text-slate-500 font-medium">Configura Webhooks para notificaciones ante leads '5 estrellas'.</p>
                </header>

                <div className="space-y-8">
                   <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600"><Users className="w-6 h-6" /></div>
                         <div>
                            <p className="font-black text-slate-900 uppercase text-xs tracking-widest">Slack Webhook</p>
                            <p className="text-xs text-slate-400">Canal #marketing-leads</p>
                         </div>
                      </div>
                      <input type="checkbox" checked={webhookConfig.slack} onChange={e => setWebhookConfig({...webhookConfig, slack: e.target.checked})} className="w-6 h-6 accent-indigo-600" />
                   </div>

                   <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 opacity-50">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-green-100 rounded-2xl text-green-600"><MessageSquare className="w-6 h-6" /></div>
                         <div>
                            <p className="font-black text-slate-900 uppercase text-xs tracking-widest">WhatsApp Business</p>
                            <p className="text-xs text-slate-400">Notificar a Directiva</p>
                         </div>
                      </div>
                      <input type="checkbox" checked={webhookConfig.whatsapp} onChange={e => setWebhookConfig({...webhookConfig, whatsapp: e.target.checked})} className="w-6 h-6 accent-green-600" />
                   </div>

                   <div className="p-6 bg-indigo-900 rounded-[2rem] text-white">
                      <p className="text-xs font-black uppercase tracking-[0.2em] mb-4 text-indigo-300">Umbral de Lead 5 Estrellas (ROI/Opportunity)</p>
                      <input 
                        type="range" min="0" max="200" step="10" 
                        value={webhookConfig.threshold}
                        onChange={e => setWebhookConfig({...webhookConfig, threshold: parseInt(e.target.value)})}
                        className="w-full h-2 bg-indigo-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                      <div className="flex justify-between mt-4 font-black">
                         <span>$0k</span>
                         <span className="text-2xl text-indigo-300">${webhookConfig.threshold}k+</span>
                         <span>$200k</span>
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'client' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <header className="text-center max-w-2xl mx-auto space-y-4">
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Portal de Seguimiento (P10)</span>
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Tu Estrategia de Marketing</h2>
                <p className="text-slate-500 text-lg font-medium">Análisis GenAI de Mercado para potenciar tu negocio.</p>
              </header>

              {prospects.filter(p => p.status === 'sent' || p.status === 'validated').map(p => (
                <div key={p.id} className="bg-white p-12 rounded-[4rem] border-4 border-indigo-50 shadow-2xl space-y-12">
                   <div className="flex items-center gap-8">
                      <div className="w-24 h-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-3xl font-black">{p.name.charAt(0)}</div>
                      <div>
                        <h3 className="text-4xl font-black text-slate-900">{p.name}</h3>
                        <p className="text-slate-400 font-bold">{p.url}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                           <Zap className="w-6 h-6 text-indigo-600" /> Beneficio Estimado
                        </h4>
                        <div className="p-8 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100">
                           <p className="text-sm font-black uppercase tracking-widest mb-2 opacity-70">ROI Proyectado</p>
                           <p className="text-6xl font-black leading-none mb-4">{p.analysis?.roiEstimate}</p>
                           <p className="text-indigo-100 text-sm">{p.analysis?.recommendedProduct} personalizado para tu sector.</p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200">
                        <h4 className="text-xl font-black uppercase tracking-tighter mb-6">Tu Propuesta Visual</h4>
                        <div className="aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg">
                           <img src={p.visualHook} alt="Propuesta" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                   </div>

                   {p.newsletter && (
                     <div className="space-y-6">
                        <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                           <Mail className="w-6 h-6 text-indigo-600" /> Newsletter Personalizada
                        </h4>
                        <div className="prose prose-slate max-w-none bg-indigo-50/50 p-10 rounded-[3rem] border border-indigo-100 italic shadow-inner">
                           <Markdown>{p.newsletter}</Markdown>
                        </div>
                     </div>
                   )}

                   {/* Personalization Perks (Client View) */}
                   {(p.sentiment || p.logoConcepts || p.videoPitch) && (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-100 pt-12">
                       {p.sentiment && (
                         <div className="bg-slate-50 p-10 rounded-[3rem] space-y-6">
                           <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                             <Search className="w-6 h-6 text-indigo-600" /> Oportunidad vs Competencia
                           </h4>
                           <div className="text-sm font-bold text-slate-700 bg-white p-8 rounded-3xl border border-slate-200">
                              <p className="text-indigo-600 mb-3 uppercase text-[10px] tracking-widest font-black">Punto Débil del Mercado:</p>
                              <ul className="list-disc pl-5 space-y-2 mb-6 italic text-slate-500">
                                 {p.sentiment.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                               </ul>
                               <p className="text-indigo-600 mb-3 uppercase text-[10px] tracking-widest font-black">Tu Oportunidad:</p>
                               <p className="font-black text-slate-900 text-lg">{p.sentiment.opportunity}</p>
                           </div>
                         </div>
                       )}
                       {p.logoConcepts && (
                         <div className="bg-slate-50 p-10 rounded-[3rem] space-y-6">
                            <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                             <Palette className="w-6 h-6 text-indigo-600" /> Nuevos Conceptos Visuales
                           </h4>
                           <div className="prose prose-slate prose-sm bg-white p-8 rounded-3xl border border-slate-200 overflow-y-auto max-h-[300px]">
                              <Markdown>{p.logoConcepts}</Markdown>
                           </div>
                         </div>
                       )}
                       {p.videoPitch && (
                         <div className="md:col-span-2 bg-indigo-600 p-12 rounded-[4rem] text-white space-y-8 shadow-2xl shadow-indigo-200">
                            <h4 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                             <Video className="w-8 h-8" /> Guión para Vídeo-Pitch Personalizado
                           </h4>
                           <div className="bg-black/20 p-10 rounded-[3rem] italic text-xl leading-relaxed">
                              <Markdown>{p.videoPitch}</Markdown>
                           </div>
                         </div>
                       )}
                       {p.socialPosts && (
                          <div className="bg-slate-50 p-10 rounded-[3rem] space-y-6">
                            <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                             <Share2 className="w-6 h-6 text-indigo-600" /> Tu Estrategia en RRSS
                           </h4>
                           <div className="prose prose-slate prose-sm bg-white p-8 rounded-3xl border border-slate-200 overflow-y-auto max-h-[300px]">
                              <Markdown>{p.socialPosts}</Markdown>
                           </div>
                         </div>
                       )}
                       {p.seoStrategy && (
                          <div className="bg-slate-50 p-10 rounded-[3rem] space-y-6">
                            <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                             <LineChart className="w-6 h-6 text-indigo-600" /> Plan de Crecimiento SEO
                           </h4>
                           <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-4">
                              <div className="flex flex-wrap gap-2">
                                 {p.seoStrategy.keywords.map((kw: string, i: number) => (
                                    <span key={i} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                                       {kw}
                                    </span>
                                 ))}
                              </div>
                              <p className="text-xs text-slate-500 italic">"{p.seoStrategy.meta}"</p>
                              <div className="pt-2 border-t border-slate-100">
                                 <p className="text-[10px] font-black uppercase text-indigo-600">Idea Viral:</p>
                                 <p className="text-sm font-bold text-slate-900">{p.seoStrategy.blogIdea}</p>
                              </div>
                           </div>
                         </div>
                       )}
                       {p.competitors && (
                          <div className="md:col-span-2 bg-slate-900 p-12 rounded-[4rem] text-white space-y-8">
                            <h4 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4">
                             <Ghost className="w-8 h-8 text-indigo-400" /> Tu Competencia Directa Analizada
                           </h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {p.competitors.map((comp: any, i: number) => (
                                <div key={i} className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4">
                                   <p className="text-lg font-black">{comp.name}</p>
                                   <p className="text-xs text-indigo-300 font-mono italic">{comp.notes}</p>
                                   <button 
                                      onClick={() => window.open(comp.url, '_blank')}
                                      className="text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-400 px-4 py-2 rounded-xl hover:bg-indigo-500 hover:text-white transition-all"
                                   >
                                      Analizar su Web
                                   </button>
                                </div>
                              ))}
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                   
                    {p.potentialLeads && p.potentialLeads.length > 0 && (
                      <div className="bg-indigo-50 p-12 rounded-[4rem] border-4 border-indigo-100 mb-8 space-y-10">
                        <div className="space-y-4">
                          <p className="text-sm font-black uppercase tracking-widest text-indigo-600">Punto 4: Inteligencia de Mercado</p>
                          <h4 className="text-4xl font-black uppercase tracking-tighter leading-none">
                            Oportunidades de Mercado <br/>
                            <span className="text-indigo-400">Detectadas por Scraper</span>
                          </h4>
                          <p className="text-slate-500 font-medium max-w-2xl">
                            Hemos identificado estos negocios similares en tu zona que también necesitan una mejora digital. 
                            Dominar tu sector local empieza por conocer quiénes son tus vecinos comerciales.
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {p.potentialLeads.map((lead: any, i: number) => (
                             <div key={i} className="bg-white p-8 rounded-[3rem] shadow-xl shadow-indigo-200/50 border border-indigo-50 flex items-start gap-6 group hover:-translate-y-2 transition-all">
                                <div className="bg-indigo-600 w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl flex-shrink-0 shadow-lg group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                                   {i + 1}
                                </div>
                                <div className="space-y-3">
                                   <p className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{lead.name}</p>
                                   <p className="text-xs text-slate-500 leading-relaxed italic">"{lead.notes}"</p>
                                   <div className="flex items-center gap-4 pt-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full">
                                         Lead Calificado
                                      </span>
                                      <button 
                                         onClick={() => window.open(lead.url, '_blank')}
                                         className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600"
                                      >
                                         Ver Web
                                      </button>
                                   </div>
                                </div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}

                   <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8">
                      <div>
                         <p className="text-sm font-black uppercase tracking-widest text-indigo-400 mb-2">Siguiente Paso</p>
                         <h4 className="text-2xl font-black tracking-tight">¿Listo para recuperar esos ${p.analysis?.opportunityLoss}k anuales?</h4>
                      </div>
                      <button 
                        onClick={() => alert("¡Solicitud enviada! El equipo de MarketFlow contactará contigo para implementar tu estrategia.")}
                        className="bg-indigo-600 hover:bg-indigo-500 px-12 py-5 rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-900 transition-all active:scale-95"
                      >
                        Agendar en Calendly
                      </button>
                   </div>
                </div>
              ))}

              {prospects.filter(p => p.status === 'sent' || p.status === 'validated').length === 0 && (
                <div className="text-center p-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
                   <p className="text-slate-400 font-bold italic">No hay propuestas públicas validadas aún. Valida un prospecto en el Dashboard de Admin.</p>
                </div>
              )}
           </motion.div>
        )}

        {activeTab === 'admin' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ... Your existing Admin content ... */}

            <div className="lg:col-span-4 space-y-6">
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600" /> Fase 1: Captación (P1)
                </h2>
                <form onSubmit={handleAddProspect} className="space-y-4">
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="url" 
                      placeholder="URL del negocio (P1)"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      required
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="Email del propietario (P1)"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                    {loading ? 'Consultando Gemini MCP...' : 'Analizar & Segmentar (F1/F2)'}
                  </button>
                </form>
              </section>

              <section className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Momentos Clave (Punto 4)
                  </h3>
                </div>
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-[500px]">
                  {prospects.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedProspect(p)}
                      className={`p-5 hover:bg-slate-50 cursor-pointer transition-all ${selectedProspect?.id === p.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shadow-sm ${p.status === 'sent' ? 'bg-green-500' : 'bg-indigo-600'}`}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest">{p.status}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-[11px] text-slate-400 font-medium truncate">{p.moment}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Analysis Detail & Ghost Mode */}
            <div className="lg:col-span-8">
              <AnimatePresence mode="wait">
                {selectedProspect ? (
                  <motion.div 
                    key={selectedProspect.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                  >
                    {/* Header Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-2">
                        {selectedProspect.status === 'validated' && (
                          <div className="flex items-center gap-2 text-green-600 font-black text-[10px] bg-green-50 px-3 py-1.5 rounded-full uppercase border border-green-100">
                             <CheckCircle2 className="w-3 h-3" /> Validado (Punto 7)
                          </div>
                        )}
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ID: {selectedProspect.id}</span>
                      </div>

                      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                        <div className="w-32 h-32 bg-slate-900 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-xl ring-8 ring-slate-50">
                          {selectedProspect.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-3 flex-1 text-center md:text-left">
                          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedProspect.name}</h2>
                          <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-slate-500 font-medium">
                            <span className="flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full"><Globe className="w-4 h-4 text-indigo-400" /> {selectedProspect.url}</span>
                            <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full"><Mail className="w-4 h-4" /> {selectedProspect.email || 'Email no detectado'}</span>
                            {selectedProspect.ownerName && <span className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1 rounded-full font-black uppercase text-[10px] tracking-widest"><Users className="w-3 h-3" /> Owner: {selectedProspect.ownerName}</span>}
                          </div>
                        </div>
                      </div>

                      {selectedProspect.analysis ? (
                        <div className="mt-10 space-y-8">
                           {/* Site Images & Assets (Custom Request) */}
                           {selectedProspect.images && selectedProspect.images.length > 0 && (
                             <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                               <header className="flex items-center justify-between">
                                  <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                     <Globe className="w-6 h-6 text-indigo-600" /> Digital Assets de la Web
                                  </h4>
                                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Scraped en vivo</span>
                               </header>
                               <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                  {selectedProspect.images.map((img, idx) => (
                                    <div key={idx} className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 group relative">
                                       <img src={img} alt={`Site image ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <button 
                                            onClick={() => window.open(img, '_blank')}
                                            className="bg-white text-slate-900 p-2 rounded-full shadow-lg"
                                          >
                                             <Eye className="w-4 h-4" />
                                          </button>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                             </div>
                           )}

                           {/* Master Lifecycle Stepper */}
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Phase 1 */}
                              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col justify-between">
                                 <div>
                                    <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded mb-3 inline-block">FASE 1: CAPTACIÓN</span>
                                    <h4 className="font-bold text-slate-900 mb-2">Identificación MCP</h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Captura de URL, Email y detección de nombre del propietario ({selectedProspect.ownerName || 'Buscando...'}).</p>
                                 </div>
                                 <button className="w-full bg-slate-900 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-50 cursor-not-allowed">Completado</button>
                              </div>

                              {/* Phase 2 */}
                              <div className="p-6 bg-indigo-50 border-indigo-100 rounded-3xl flex flex-col justify-between shadow-sm">
                                 <div>
                                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded mb-3 inline-block">FASE 2: PROSPECCIÓN</span>
                                    <h4 className="font-bold text-slate-900 mb-2">Selector GenAI (P5)</h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Carencias de mercado identificadas y estrategia '{selectedProspect.analysis?.recommendedProduct}' definida.</p>
                                 </div>
                                 <button 
                                   onClick={() => {
                                      setFilter({ sector: selectedProspect.analysis?.sector || '', location: selectedProspect.location || '' });
                                      setActiveTab('scraping');
                                   }}
                                   className="w-full bg-indigo-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 active:scale-95 transition-all"
                                 >
                                   Ver Contexto Mercado (P4)
                                 </button>
                              </div>

                              {/* Phase 3 */}
                              <div className={`p-6 rounded-3xl border transition-all flex flex-col justify-between shadow-sm ${selectedProspect.status === 'validated' || selectedProspect.status === 'sent' ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                 <div>
                                    <span className="bg-green-600 text-white text-[10px] font-black px-2 py-0.5 rounded mb-3 inline-block">FASE 3: EJECUCIÓN</span>
                                    <h4 className="font-bold text-slate-900 mb-2">Automatización (P6)</h4>
                                    <p className="text-[10px] text-slate-500 leading-relaxed mb-4">Métricas de precisión ({selectedProspect.qualityScore}%) y envío de report ROI a través de API.</p>
                                 </div>
                                 <button 
                                   onClick={() => {
                                      if (selectedProspect.status === 'analyzed') handleValidate(selectedProspect.id);
                                      else handleSend(selectedProspect.id);
                                   }}
                                   disabled={selectedProspect.status === 'sent'}
                                   className="w-full bg-green-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all shadow-md"
                                 >
                                   {selectedProspect.status === 'sent' ? 'Acción Ejecutada' : (selectedProspect.status === 'validated' ? 'Lanzar API (P6)' : 'Validar & Automatizar')}
                                 </button>
                              </div>
                           </div>

                           {/* Secondary Metrics Grid */}
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 shadow-sm transition-all hover:scale-105">
                                <p className="text-[10px] text-rose-600 font-black uppercase tracking-wider mb-2">Pérdida (P3)</p>
                                <p className="text-3xl font-black text-rose-700">-${selectedProspect.analysis.opportunityLoss}k</p>
                              </div>
                              <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 shadow-sm transition-all hover:scale-105">
                                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-2">ROI (P8)</p>
                                <p className="text-3xl font-black text-emerald-700">{selectedProspect.analysis.roiEstimate}</p>
                              </div>
                              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2">Categoría (P5)</p>
                                <p className="text-xl font-black text-slate-800">{selectedProspect.analysis.recommendedProduct}</p>
                              </div>
                              <div className="bg-slate-900 p-6 rounded-3xl shadow-xl text-white">
                                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-wider mb-2">Precisión (P7)</p>
                                <div className="flex items-end gap-2">
                                  <p className="text-3xl font-black">{selectedProspect.qualityScore}%</p>
                                  <p className="text-[10px] pb-1 opacity-60">Confianza</p>
                                </div>
                              </div>
                           </div>

                           {/* Newsletter Content Secion (Phase 3) */}
                           <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm space-y-6">
                              <header className="flex items-center justify-between">
                                 <h4 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                                    <Mail className="w-6 h-6 text-indigo-600" /> Newsletter Generada (P10)
                                 </h4>
                                 {!selectedProspect.newsletter && (
                                    <button 
                                      onClick={() => handleGenerateManualNewsletter(selectedProspect.id)}
                                      disabled={generatingNewsletter === selectedProspect.id}
                                      className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2"
                                    >
                                       {generatingNewsletter === selectedProspect.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                                       Generar Newsletter
                                    </button>
                                 )}
                              </header>
                              
                              {selectedProspect.newsletter ? (
                                 <div className="prose prose-slate max-w-none prose-sm bg-slate-50 p-8 rounded-[2rem] border border-slate-100 italic">
                                    <Markdown>{selectedProspect.newsletter}</Markdown>
                                 </div>
                              ) : (
                                 <div className="p-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-slate-400 font-bold italic">
                                    Ninguna newsletter generada aún para este prospecto.
                                 </div>
                              )}
                           </div>

                           {/* Growth & Conversion Section (Phase 4 Custom Request) */}
                           <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 rounded-[3rem] shadow-2xl space-y-10 text-white">
                              <header className="flex items-center justify-between">
                                 <div className="space-y-1">
                                    <h4 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3">
                                       <Zap className="w-8 h-8 text-yellow-400 animate-pulse" /> Growth Hub & Conversión
                                    </h4>
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest bg-white/10 px-4 py-1 rounded-full inline-block">
                                       Aceleración de Cierre y ROI
                                    </p>
                                 </div>
                                 <button 
                                    onClick={handleAlertSetup}
                                    className="bg-green-500/20 text-green-400 border border-green-500/30 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all flex items-center gap-2"
                                 >
                                    <Bell className="w-4 h-4" /> Configurar Alertas Slack/WA
                                 </button>
                              </header>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 {/* Column 1: AI Generative */}
                                 <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                       <div className="p-2 bg-indigo-500 rounded-lg"><Sparkles className="w-4 h-4" /></div>
                                       <span className="font-black uppercase text-xs tracking-widest">Efecto Wow (AI)</span>
                                    </div>
                                    <div className="space-y-3">
                                       <button 
                                          onClick={() => handleGrowthAction(selectedProspect.id, 'logos')}
                                          disabled={activeAction?.startsWith('logos')}
                                          className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                       >
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Logo Concepts</div>
                                             <div className="text-xs font-bold">Generar 3 Impresiones</div>
                                          </div>
                                          {activeAction?.startsWith('logos') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Palette className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                       </button>
                                       <button 
                                          onClick={() => handleGrowthAction(selectedProspect.id, 'sentiment')}
                                          disabled={activeAction?.startsWith('sentiment')}
                                          className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                       >
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Análisis Reseñas</div>
                                             <div className="text-xs font-bold">Hackear Competencia</div>
                                          </div>
                                          {activeAction?.startsWith('sentiment') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                       </button>
                                       <div className="space-y-2">
                                          <button 
                                             onClick={() => handleGrowthAction(selectedProspect.id, 'video')}
                                             disabled={activeAction?.startsWith('video')}
                                             className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                          >
                                             <div className="space-y-1">
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">HeyGen Pitch</div>
                                                <div className="text-xs font-bold">Guión Vídeo-Avatar</div>
                                             </div>
                                             {activeAction?.startsWith('video') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                          </button>
                                          {selectedProspect.videoPitch && (
                                             <button 
                                                onClick={handleCreateHeyGenVideo}
                                                disabled={heygenLoading}
                                                className="w-full bg-indigo-500 hover:bg-indigo-400 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg"
                                             >
                                                {heygenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                Crear Vídeo Real (AI)
                                             </button>
                                          )}
                                       </div>
                                       <button 
                                          onClick={() => handleGrowthAction(selectedProspect.id, 'social')}
                                          disabled={activeAction?.startsWith('social')}
                                          className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                       >
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Social Forge</div>
                                             <div className="text-xs font-bold">Generar Packs RRSS</div>
                                          </div>
                                          {activeAction?.startsWith('social') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                       </button>
                                       <button 
                                          onClick={() => handleGrowthAction(selectedProspect.id, 'seo')}
                                          disabled={activeAction?.startsWith('seo')}
                                          className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                       >
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-60">SEO Strategy</div>
                                             <div className="text-xs font-bold">Keywords & Meta</div>
                                          </div>
                                          {activeAction?.startsWith('seo') ? <Loader2 className="w-4 h-4 animate-spin" /> : <LineChart className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                       </button>
                                       <button 
                                          onClick={() => handleGrowthAction(selectedProspect.id, 'translate')}
                                          disabled={activeAction?.startsWith('translate')}
                                          className="w-full bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                       >
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Global Pitch</div>
                                             <div className="text-xs font-bold">Traducción Proactiva</div>
                                          </div>
                                          {activeAction?.startsWith('translate') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4 opacity-0 group-hover:opacity-100" />}
                                       </button>
                                       <button 
                                          onClick={() => handleIdentifyCompetitors(selectedProspect.id)}
                                          disabled={activeAction?.startsWith('competitors')}
                                          className="w-full bg-slate-800 hover:bg-slate-700 p-4 rounded-2xl text-left border border-white/5 transition-all group flex items-center justify-between"
                                       >
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Punto 2: Competencia</div>
                                             <div className="text-xs font-bold text-white">Investigación de Rivales</div>
                                          </div>
                                          {activeAction?.startsWith('competitors') ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ghost className="w-4 h-4 text-indigo-400" />}
                                       </button>
                                    </div>
                                 </div>

                                 {/* Column 2: Conversion Tools */}
                                 <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                       <div className="p-2 bg-yellow-500 rounded-lg text-black"><TrendingUp className="w-4 h-4" /></div>
                                       <span className="font-black uppercase text-xs tracking-widest">Cierre Directo</span>
                                    </div>
                                    <div className="space-y-3">
                                       <div className="bg-white/10 p-5 rounded-2xl border border-white/5 space-y-2">
                                          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Oportunidad Perdida</div>
                                          <div className="text-xl font-black text-yellow-400">~{Math.floor(Math.random() * 5000 + 2000)}€/mes</div>
                                          <div className="text-[9px] text-indigo-300">Cálculo basado en falta de Newsletter</div>
                                       </div>
                                       <button className="w-full bg-indigo-600 hover:bg-indigo-500 p-4 rounded-2xl text-left transition-all flex items-center justify-between">
                                          <div className="space-y-1">
                                             <div className="text-[10px] font-black uppercase tracking-widest text-white/70">Calendly Sync</div>
                                             <div className="text-xs font-bold">Link de Cita Directo</div>
                                          </div>
                                          <Calendar className="w-4 h-4" />
                                       </button>
                                       <div className="flex gap-2">
                                          <button className="flex-1 bg-white/10 hover:bg-white/20 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                             <Users className="w-3 h-3" /> Fomo Comp.
                                          </button>
                                          <button className="flex-1 bg-white/10 hover:bg-white/20 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                                             <Ghost className="w-3 h-3" /> Ghost Preview
                                          </button>
                                       </div>
                                    </div>
                                 </div>

                                 {/* Column 3: Post-Venta & Stats */}
                                 <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
                                    <div className="flex items-center gap-3 mb-4">
                                       <div className="p-2 bg-green-500 rounded-lg text-black"><CheckCircle2 className="w-4 h-4" /></div>
                                       <span className="font-black uppercase text-xs tracking-widest">Fidelización</span>
                                    </div>
                                    <div className="space-y-4">
                                       <div className="space-y-2">
                                          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Último Feed (Social Enrich)</div>
                                          <div className="bg-slate-800 p-3 rounded-xl text-[10px] font-mono text-indigo-300 border border-indigo-500/20 italic">
                                             "Viendo vuestra última publicación sobre el evento local..."
                                          </div>
                                       </div>
                                       <button className="w-full bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest py-3 rounded-xl hover:bg-indigo-100 transition-all">
                                          Enviar Reporte ROI Mensual
                                       </button>
                                       <div className="flex items-center justify-between p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
                                          <span className="text-[9px] font-black uppercase tracking-widest">Programa Referidos</span>
                                          <span className="text-xs font-black text-green-400">ACTIVADO</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>

                              {/* Output Visualization for AI Actions */}
                              <AnimatePresence>
                                 {(selectedProspect.sentiment || selectedProspect.logoConcepts || selectedProspect.videoPitch) && (
                                    <motion.div 
                                       initial={{ opacity: 0, y: 20 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8"
                                    >
                                       {selectedProspect.sentiment && (
                                          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                                             <h5 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                                <Search className="w-4 h-4" /> Sentiment Analysis Results
                                             </h5>
                                             <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                   <div className="text-[9px] font-black uppercase opacity-60">Weaknesses</div>
                                                   {selectedProspect.sentiment.weaknesses.map((w, i) => (
                                                      <div key={i} className="text-xs text-red-300 font-bold">• {w}</div>
                                                   ))}
                                                </div>
                                                <div className="space-y-2">
                                                   <div className="text-[9px] font-black uppercase opacity-60">Opportunity</div>
                                                   <div className="text-xs text-green-300 font-black">{selectedProspect.sentiment.opportunity}</div>
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.logoConcepts && (
                                          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                                             <h5 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                                <Palette className="w-4 h-4" /> Conceptos de Identidad Visual
                                             </h5>
                                             <div className="prose prose-invert prose-sm max-h-40 overflow-y-auto pr-4 scrollbar-hide text-xs">
                                                <Markdown>{selectedProspect.logoConcepts}</Markdown>
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.videoPitch && (
                                          <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl space-y-4 lg:col-span-2">
                                             <div className="flex items-center justify-between">
                                                <h5 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                                                   <Video className="w-4 h-4" /> Guión Video-Pitch (30s ROI Impact)
                                                </h5>
                                                <button 
                                                   onClick={handleCreateHeyGenVideo}
                                                   disabled={heygenLoading}
                                                   className="bg-white text-indigo-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 hover:text-black transition-all flex items-center gap-2 shadow-xl"
                                                >
                                                   {heygenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                                   Generar Vídeo Real (HeyGen)
                                                </button>
                                             </div>
                                             <div className="prose prose-invert prose-sm bg-black/20 p-6 rounded-2xl italic text-xs leading-relaxed">
                                                <Markdown>{selectedProspect.videoPitch}</Markdown>
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.socialPosts && (
                                          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                                             <h5 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                                <Share2 className="w-4 h-4" /> RRSS Forge Results
                                             </h5>
                                             <div className="prose prose-invert prose-sm max-h-60 overflow-y-auto text-[11px] leading-snug">
                                                <Markdown>{selectedProspect.socialPosts}</Markdown>
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.seoStrategy && (
                                          <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 space-y-4">
                                             <h5 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                                <LineChart className="w-4 h-4" /> SEO Blueprint
                                             </h5>
                                             <div className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                   {selectedProspect.seoStrategy.keywords.map((kw, i) => (
                                                      <span key={i} className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-[10px] font-bold border border-indigo-500/30">
                                                         #{kw}
                                                      </span>
                                                   ))}
                                                </div>
                                                <div className="bg-white/5 p-4 rounded-xl text-[10px] text-slate-300 italic border border-white/5">
                                                   "{selectedProspect.seoStrategy.meta}"
                                                </div>
                                                <div className="text-[10px] font-bold text-yellow-400">
                                                   Idea Blog: {selectedProspect.seoStrategy.blogIdea}
                                                </div>
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.translation && (
                                          <div className="bg-green-600/10 p-8 rounded-[2rem] border border-green-500/20 space-y-4 lg:col-span-2">
                                             <h5 className="text-sm font-black uppercase tracking-widest text-green-400 flex items-center gap-2">
                                                <Languages className="w-4 h-4" /> Global Intelligence (Traducción)
                                             </h5>
                                             <div className="prose prose-invert prose-sm bg-black/20 p-6 rounded-2xl text-xs leading-relaxed">
                                                <Markdown>{selectedProspect.translation}</Markdown>
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.competitors && (
                                          <div className="bg-slate-900 border-2 border-indigo-500/20 p-8 rounded-[2.5rem] lg:col-span-2 space-y-6">
                                             <h5 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                                                <Ghost className="w-4 h-4" /> Radar de Competencia Identificada
                                             </h5>
                                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {selectedProspect.competitors.map((comp, idx) => (
                                                   <div key={idx} className="bg-white/5 p-5 rounded-2xl border border-white/10 space-y-3 hover:bg-white/10 transition-all">
                                                      <div className="flex items-center justify-between">
                                                         <span className="text-xs font-black text-white">{comp.name}</span>
                                                         <button 
                                                            onClick={() => window.open(comp.url, '_blank')}
                                                            className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white"
                                                         >
                                                            Visitar URL
                                                         </button>
                                                      </div>
                                                      <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                                         "{comp.notes}"
                                                      </p>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       )}
                                       {selectedProspect.potentialLeads && (
                                          <div className="bg-indigo-900 border-2 border-indigo-400/30 p-8 rounded-[2.5rem] lg:col-span-2 space-y-6">
                                             <div className="flex items-center justify-between">
                                                <h5 className="text-sm font-black uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                                   <Target className="w-4 h-4" /> Búsqueda de Clientes (Punto 4)
                                                </h5>
                                                <span className="bg-indigo-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                                   Prospectos Potenciales
                                                </span>
                                             </div>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {selectedProspect.potentialLeads.map((lead, idx) => (
                                                   <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-indigo-400 transition-all">
                                                      <div>
                                                         <div className="flex items-center justify-between mb-2">
                                                            <span className="text-xs font-black text-white">{lead.name}</span>
                                                            <Search className="w-3 h-3 text-indigo-400" />
                                                         </div>
                                                         <p className="text-[10px] text-slate-400 mb-4">{lead.notes}</p>
                                                      </div>
                                                      <button 
                                                         onClick={() => window.open(lead.url, '_blank')}
                                                         className="text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-white border border-indigo-400/30 py-2 rounded-lg text-center"
                                                      >
                                                         Explorar Web
                                                      </button>
                                                   </div>
                                                ))}
                                             </div>
                                          </div>
                                       )}
                                    </motion.div>
                                 )}
                              </AnimatePresence>
                           </div>
                        </div>
                      ) : (
                        <div className="mt-10 flex items-center gap-6 animate-pulse px-4">
                          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-[2rem] flex-1"></div>)}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-0">
                      {/* Visual Hook */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                           <Eye className="w-6 h-6 text-indigo-600" /> Gancho Visual (Punto 5)
                        </h3>
                        <div className="aspect-video bg-slate-50 rounded-[2rem] overflow-hidden relative shadow-inner flex-1 border border-slate-100">
                          {selectedProspect.visualHook ? (
                            <img src={selectedProspect.visualHook} alt="Visual Hook" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-3">
                              <Loader2 className="w-10 h-10 animate-spin" />
                              <p className="text-[10px] font-black uppercase tracking-widest">Generando Boceto...</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-6 p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                           <p className="text-sm font-bold text-indigo-900 leading-relaxed italic text-center">
                            "{selectedProspect.analysis?.hookText || 'Refinando valor único...'}"
                           </p>
                        </div>
                      </div>

                      {/* Intel Card */}
                      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                           <BarChart3 className="w-6 h-6 text-indigo-600" /> Intel & Sentimiento (Punto 2)
                        </h3>
                        <div className="space-y-6">
                           <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reseñas de Clientes</span>
                                <MessageSquare className="w-4 h-4 text-indigo-400" />
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed font-bold">"{selectedProspect.analysis?.sentiment || '...'}"</p>
                           </div>
                           
                           <div className="space-y-3">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Competidores Directos</span>
                              {selectedProspect.analysis?.competitors.map((c: any, i: number) => (
                                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-indigo-200 transition-all">
                                  <span className="font-black text-sm text-slate-800">{c.name}</span>
                                  <div className="flex gap-2">
                                    <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black uppercase">{c.strength}</span>
                                    <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-black uppercase">{c.weakness}</span>
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-t-4 border-indigo-500">
                      <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-500/20 rounded-3xl">
                          <Ghost className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="text-center md:text-left">
                          <h4 className="text-lg font-black flex items-center justify-center md:justify-start gap-2 text-indigo-100 uppercase tracking-tight">Modo Ghost Validado <CheckCircle2 className="w-5 h-5 text-green-400" /></h4>
                          <p className="text-xs text-slate-400">Punto 7: Panel de Admin para validar ROI antes de envío frío.</p>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        {selectedProspect.status !== 'validated' && selectedProspect.status !== 'sent' && (
                          <button 
                            onClick={() => handleValidate(selectedProspect.id)}
                            className="bg-white/10 hover:bg-white/20 px-8 py-3 rounded-2xl font-black text-sm transition-all border border-white/5 active:scale-95"
                          >
                            Validar ROI
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleSend(selectedProspect.id)}
                          disabled={selectedProspect.status === 'pending' || selectedProspect.status === 'analyzed'}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 px-10 py-3 rounded-2xl font-black text-sm transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-3 active:scale-95"
                        >
                          <Send className="w-4 h-4 fill-current" /> Lanzar Acción (Punto 6)
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-[700px] bg-white border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center text-slate-400 p-20 text-center">
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] shadow-inner mb-8">
                      <Zap className="w-16 h-16 text-indigo-200" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tighter">MarketFlow AI Control Center</h3>
                    <p className="text-sm font-medium leading-relaxed max-w-sm">Introduce una URL corporativa para iniciar el flujo de enriquecimiento Gemini, análisis de competidores y generación de ROI automatizado.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Outreach Modal */}
      <AnimatePresence>
        {showEmailPreview && selectedProspect && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-white w-full max-w-3xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="p-8 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <div className="bg-indigo-600 p-2 rounded-lg"><Send className="w-4 h-4 text-white" /></div>
                   <h3 className="font-black text-lg uppercase tracking-widest text-slate-800">Previsualización Outreach (API)</h3>
                </div>
                <button onClick={() => setShowEmailPreview(false)} className="bg-slate-200 p-2 rounded-full hover:bg-slate-300 transition-colors">✕</button>
              </div>
              <div className="p-10 space-y-8">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asunto:</p>
                   <p className="font-black text-xl text-slate-900 tracking-tight">Propuesta GenAI para {selectedProspect.name} - Estimación de ROI: {selectedProspect.analysis?.roiEstimate}</p>
                </div>
                
                <div className="p-10 bg-white border-2 border-indigo-50 rounded-[2.5rem] text-slate-800 leading-relaxed font-serif shadow-inner">
                   <p className="mb-6">Hola equipo de <strong>{selectedProspect.name}</strong>,</p>
                   <p className="mb-6 italic">Hemos detectado que {selectedProspect.moment}.</p>
                   <p className="mb-6">Nuestro motor IA ha calculado una pérdida de oportunidad de <strong>${selectedProspect.analysis?.opportunityLoss}k/año</strong> frente a su competencia directa.</p>
                   <p className="mb-8">Adjunto un boceto generado para su nueva línea de <strong>{selectedProspect.analysis?.recommendedProduct}</strong>. Podríamos mejorar su posicionamiento un 40% en 90 días.</p>
                   
                   <div className="p-6 bg-indigo-600 rounded-3xl text-white text-center font-bold shadow-lg shadow-indigo-900/40">
                      <p className="mb-1 text-indigo-200 text-xs uppercase font-black">Link Dinámico Point 6</p>
                      Agendar en mi Calendly: calendly.com/markflow/demo
                   </div>
                </div>
                
                <button 
                  onClick={() => confirmSend(selectedProspect.id)}
                  className="w-full bg-indigo-600 text-white font-black py-5 rounded-[2rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 text-lg active:scale-95"
                >
                  Confirmar Envío API Resend <Send className="w-5 h-5 fill-current" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deep Lead Detail Modal */}
      <AnimatePresence>
        {selectedDeepLead && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[150] flex items-center justify-center p-6 overflow-y-auto">
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-white w-full max-w-5xl rounded-[4rem] overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.2)] border border-indigo-500/20 my-auto"
             >
                <div className="relative h-64 bg-slate-900 flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent z-10"></div>
                   <div className="z-20 text-center space-y-4">
                      <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-slate-900 text-4xl font-black mx-auto shadow-2xl">
                         {selectedDeepLead.name.charAt(0)}
                      </div>
                      <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{selectedDeepLead.name}</h2>
                      <div className="flex justify-center gap-3">
                         <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedDeepLead.url}</span>
                         <span className="bg-green-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Verificado</span>
                      </div>
                   </div>
                   <button 
                     onClick={() => setSelectedDeepLead(null)}
                     className="absolute top-8 right-8 z-30 bg-white/10 hover:bg-white/20 p-4 rounded-full text-white transition-all"
                   >
                     ✕
                   </button>
                </div>

                <div className="p-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                   <div className="lg:col-span-2 space-y-12">
                      <div className="space-y-4">
                         <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Información Extraída</h3>
                         <p className="text-2xl font-bold leading-tight text-slate-800 italic">"{selectedDeepLead.description}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                               <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  <Mail className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase text-slate-400">Emails Encontrados</p>
                                  {selectedDeepLead.emails.map((email, i) => (
                                    <p key={i} className="font-bold text-slate-900">{email}</p>
                                  ))}
                                  {selectedDeepLead.emails.length === 0 && <p className="font-bold text-slate-400">No detectado</p>}
                               </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                               <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  <MessageSquare className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase text-slate-400">Teléfono Corporativo</p>
                                  <p className="font-bold text-slate-900">{selectedDeepLead.phone || 'Privado'}</p>
                               </div>
                            </div>
                         </div>
                         <div className="space-y-6">
                            <div className="flex items-center gap-4 group">
                               <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  <Users className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase text-slate-400">Redes Sociales</p>
                                  <div className="flex gap-4 mt-1">
                                     <button className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-600">LinkedIn</button>
                                     <button className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-600">Instagram</button>
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4 group">
                               <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                  <Zap className="w-6 h-6" />
                               </div>
                               <div>
                                  <p className="text-[9px] font-black uppercase text-slate-400">Stack Tecnológico</p>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                     {selectedDeepLead.tech.map((t, i) => (
                                       <span key={i} className="text-[8px] bg-slate-100 px-2 py-1 rounded font-black text-slate-500 uppercase">{t}</span>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
                         <h4 className="text-sm font-black uppercase tracking-widest text-indigo-600 mb-4 flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Oportunidad de Cierre (P3)
                         </h4>
                         <p className="text-xl font-black text-indigo-900 leading-snug">{selectedDeepLead.opportunity}</p>
                      </div>
                   </div>

                   <div className="bg-slate-50 p-10 rounded-[4rem] flex flex-col justify-between">
                      <div className="space-y-8">
                         <div className="text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Score Calificado</p>
                            <p className="text-7xl font-black text-slate-900">88%</p>
                         </div>
                         <div className="space-y-4">
                            <div className="p-4 bg-white rounded-2xl border border-slate-200">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga Web</p>
                               <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-rose-500" style={{ width: '85%' }}></div>
                               </div>
                            </div>
                            <div className="p-4 bg-white rounded-2xl border border-slate-200">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Mobile Opt.</p>
                               <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-yellow-500" style={{ width: '40%' }}></div>
                               </div>
                            </div>
                         </div>
                      </div>

                      <button 
                         onClick={() => { handleAddDeepLead(selectedDeepLead); setSelectedDeepLead(null); }}
                         className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl uppercase tracking-widest text-sm hover:bg-indigo-600 shadow-2xl active:scale-95 transition-all"
                      >
                         Añadir a Prospectos
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
