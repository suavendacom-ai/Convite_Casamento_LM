import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Clock, ChevronRight, Trash2, Edit, Copy, Check, Car, ChevronLeft } from 'lucide-react';
import { Button, Input, Card } from './components/UI';
import { WeddingSettings, GuestGroup } from './types';
import { WeddingService } from './services/weddingService';
import { auth, loginWithGoogle, isConfigured } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1511285560929-86b16dfe1ad7?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1465495910484-23b15d02eb39?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1517457373958-b7bdd458ad20?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1522673607200-1648832cee33?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=800',
  'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=800',
];

function PhotoCarousel({ photos, interval = 2000 }: { photos?: string[], interval?: number }) {
  const [index, setIndex] = React.useState(0);
  const displayPhotos = photos && photos.length > 0 ? photos : DEFAULT_PHOTOS;

  const next = React.useCallback(() => setIndex((prev) => (prev + 1) % displayPhotos.length), [displayPhotos.length]);
  const prev = () => setIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);

  React.useEffect(() => {
    const timer = setInterval(() => {
      next();
    }, interval);
    return () => clearInterval(timer);
  }, [next, interval]);

  return (
    <div className="relative w-full overflow-hidden py-10">
      <div className="flex items-center justify-center gap-4 px-4">
        <button 
          onClick={prev}
          className="p-2 rounded-full bg-white/80 shadow-lg text-primary hover:bg-white transition-colors z-20 md:flex hidden"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="flex items-center justify-center gap-2 md:gap-8 min-h-[300px] md:min-h-[450px]">
          {/* Lado Esquerdo */}
          <motion.div 
            key={`left-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 0.8 }}
            className="w-24 md:w-64 h-32 md:h-80 rounded-2xl overflow-hidden shadow-sm hidden sm:block grayscale"
          >
            <img src={displayPhotos[(index - 1 + displayPhotos.length) % displayPhotos.length]} className="w-full h-full object-cover" alt="" />
          </motion.div>

          {/* Central */}
          <motion.div 
            key={`center-${index}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-64 md:w-[500px] h-80 md:h-[450px] rounded-[2rem] overflow-hidden shadow-2xl z-10 ring-8 ring-white/50"
          >
            <img src={displayPhotos[index]} className="w-full h-full object-cover" alt="" />
          </motion.div>

          {/* Lado Direito */}
          <motion.div 
            key={`right-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.5, scale: 0.8 }}
            className="w-24 md:w-64 h-32 md:h-80 rounded-2xl overflow-hidden shadow-sm hidden sm:block grayscale"
          >
            <img src={displayPhotos[(index + 1) % displayPhotos.length]} className="w-full h-full object-cover" alt="" />
          </motion.div>
        </div>

        <button 
          onClick={next}
          className="p-2 rounded-full bg-white/80 shadow-lg text-primary hover:bg-white transition-colors z-20 md:flex hidden"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="flex justify-center gap-2 mt-8">
        {displayPhotos.map((_, i) => (
          <button 
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${index === i ? 'bg-primary w-6' : 'bg-stone-300'}`}
          />
        ))}
      </div>
      
      {/* Mobile controls */}
      <div className="flex justify-center gap-10 mt-6 md:hidden">
        <button onClick={prev} className="p-3 bg-white rounded-full shadow-md text-primary"><ChevronLeft /></button>
        <button onClick={next} className="p-3 bg-white rounded-full shadow-md text-primary"><ChevronRight /></button>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = React.useState<'landing' | 'rsvp' | 'admin'>('landing');
  const [token, setToken] = React.useState('');
  const [currentGroup, setCurrentGroup] = React.useState<GuestGroup | null>(null);
  const [settings, setSettings] = React.useState<WeddingSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);
  const [masterAuth, setMasterAuth] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    document.title = "Luana & Murilo - Convite de Casamento";
  }, []);

  React.useEffect(() => {
    if (settings?.coupleNames) {
      document.title = settings.coupleNames;
    }
  }, [settings?.coupleNames]);

  React.useEffect(() => {
    // URL token handling
    const params = new URLSearchParams(window.location.search);
    const t = params.get('t');
    if (t) {
      handleTokenSearch(t);
    }
    
    // Admin check
    const checkAdmin = () => {
      if (window.location.hash === '#admin') {
        setView('admin');
      } else if (!window.location.search.includes('t=')) {
        setView('landing');
      }
    };

    checkAdmin();
    loadSettings();
    window.addEventListener('hashchange', checkAdmin);
    return () => window.removeEventListener('hashchange', checkAdmin);
  }, []);

  const loadSettings = async () => {
    // Start with defaults so UI doesn't crash
    const defaultSettings: WeddingSettings = {
      coupleNames: 'Luana e Murilo',
      date: '14 de Novembro de 2026',
      time: '18:30',
      location: 'Indaia Joinville',
      address: 'Joinville, SC',
      mapUrl: 'https://maps.google.com',
      heroImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000',
      welcomeMessage: 'Estamos muito felizes em compartilhar este dia especial com você!!',
      carouselInterval: 2000
    };
    setSettings(defaultSettings);

    try {
      const s = await WeddingService.getSettings();
      if (s) {
        // Force 18:30 if it's still 16:00
        if (s.time === '16:00') s.time = '18:30';
        setSettings(s);
      }
    } catch (e) {
      console.error("Failed to load settings, using defaults", e);
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSearch = async (t: string) => {
    setLoading(true);
    try {
      const group = await WeddingService.getGroup(t.toUpperCase());
      if (group) {
        setCurrentGroup(group);
        setView('rsvp');
      } else {
        alert('Código não encontrado. Verifique seu convite.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9f7f2]">
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen text-stone-800">
      {view === 'landing' && <LandingView settings={settings!} onSearch={handleTokenSearch} />}
      {view === 'rsvp' && currentGroup && <RSVPView settings={settings!} group={currentGroup} onBack={() => setView('landing')} />}
      {view === 'admin' && (
        <AdminDashboard 
          settings={settings!} 
          onUpdateSettings={setSettings} 
          user={user} 
          isConfigured={isConfigured}
          masterAuth={masterAuth}
          setMasterAuth={setMasterAuth}
        />
      )}
    </div>
  );
}

function LandingView({ settings, onSearch }: { settings: WeddingSettings, onSearch: (t: string) => void }) {
  const [inputToken, setInputToken] = React.useState('');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <img 
          src={settings.heroImageUrl} 
          alt="Wedding" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="relative text-center text-white px-4"
        >
          <span className="text-sm uppercase tracking-[0.3em] font-medium opacity-90 mb-4 block">Save the Date</span>
          <h1 className="text-6xl md:text-8xl mb-6">{settings.coupleNames}</h1>
          <p className="text-xl md:text-2xl font-light italic">{settings.date}</p>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10 w-full pb-20">
        <Card className="flex flex-col md:flex-row gap-8 items-center text-center md:text-left">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl text-primary">O Grande Dia</h2>
            <p className="text-stone-500 leading-relaxed">{settings.welcomeMessage}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">{settings.date}</p>
                  <p className="text-sm text-stone-400">Marque no calendário</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">{settings.time}</p>
                  <p className="text-sm text-stone-400">Horário da cerimônia</p>
                </div>
              </div>
              <a 
                href="https://share.google/aObVSOPpbP9yJEiD2" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-3 col-span-full group cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">{settings.location}</p>
                  <p className="text-sm text-stone-400 underline">{settings.address}</p>
                </div>
              </a>
              <a 
                href="https://maps.app.goo.gl/EWVN1MkG4AapvfSR7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-3 col-span-full group cursor-pointer pt-2 border-t border-stone-50"
              >
                <Car className="w-5 h-5 text-primary shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="font-semibold group-hover:text-primary transition-colors">Estacionamento</p>
                  <p className="text-sm text-stone-400 underline">Clique para ver o local</p>
                </div>
              </a>
            </div>
          </div>

          <div className="w-px h-full bg-stone-100 hidden md:block" />

          <div className="w-full md:w-80 space-y-6">
            <h3 className="text-xl text-center">Já confirmou sua presença?</h3>
            <p className="text-sm text-center text-stone-400">Insira o código do seu convite para confirmar presença</p>
            <div className="space-y-4">
              <Input 
                placeholder="Ex: AB12CD" 
                value={inputToken} 
                onChange={(v) => setInputToken(v.toUpperCase())}
                className="text-center tracking-widest text-xl font-mono uppercase"
              />
              <Button 
                variant="primary" 
                className="w-full" 
                onClick={() => onSearch(inputToken)}
                disabled={!inputToken}
              >
                Confirmar Presença
              </Button>
            </div>
          </div>
        </Card>

        {/* Localização Extra for Photos or Memories */}
        <div className="mt-16 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-4xl text-primary">Nossa História</h2>
            <p className="text-stone-400 font-serif italic text-lg whitespace-pre-line">
              Cada momento que vivemos nos trouxe até aqui.
            </p>
          </div>
          
          <PhotoCarousel photos={settings.photos} interval={settings.carouselInterval} />
        </div>
      </div>
      
      <footer className="mt-auto py-10 text-center text-stone-400 text-xs tracking-widest uppercase">
        {settings.coupleNames} &bull; 2026
      </footer>
    </div>
  );
}

function RSVPView({ settings, group, onBack }: { settings: WeddingSettings, group: GuestGroup, onBack: () => void }) {
  const [guests, setGuests] = React.useState(group.guests);
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const handleToggle = (index: number, confirmed: boolean) => {
    const newGuests = [...guests];
    newGuests[index] = { ...newGuests[index], confirmed };
    setGuests(newGuests);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await WeddingService.confirmGroup(group.id, guests);
      setDone(true);
      setTimeout(() => onBack(), 3000);
    } catch (e) {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <Card className="max-w-md w-full text-center space-y-6 py-12">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto"
        >
          <ChevronRight className="w-10 h-10 rotate-90" />
        </motion.div>
        <h2 className="text-3xl text-primary">Obrigado!</h2>
        <p className="text-stone-500 font-serif italic text-lg">Confirmação recebida com sucesso. <br/> Nos vemos em breve!</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen py-12 px-6 bg-stone-50">
      <div className="max-w-2xl mx-auto space-y-8">
        <button onClick={onBack} className="text-primary flex items-center gap-2 hover:underline">
          <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
        </button>

        <header className="text-center space-y-4">
          <h1 className="text-5xl text-primary">Olá, Família {group.familyName}</h1>
          <p className="text-stone-500">Por favor, confirme quem estará presente no nosso casamento.</p>
        </header>

        <Card className="space-y-6">
          <div className="space-y-4">
            {guests.map((guest, idx) => (
              <div key={idx} className="flex items-center justify-between py-4 border-bottom border-stone-50 last:border-0">
                <span className="text-xl font-serif">{guest.name}</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggle(idx, true)}
                    className={`px-4 py-2 rounded-xl transition-all ${guest.confirmed === true ? 'bg-green-100 text-green-700 ring-1 ring-green-200' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
                  >
                    Vou
                  </button>
                  <button 
                    onClick={() => handleToggle(idx, false)}
                    className={`px-4 py-2 rounded-xl transition-all ${guest.confirmed === false ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-stone-50 text-stone-400 hover:bg-stone-100'}`}
                  >
                    Não vou
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="primary" 
            className="w-full py-4 text-lg" 
            disabled={saving || guests.some(g => g.confirmed === null)}
            onClick={handleSave}
          >
            {saving ? 'Enviando...' : 'Confirmar Presença'}
          </Button>
        </Card>
      </div>
    </div>
  );
}

import { QRCodeSVG } from 'qrcode.react';

function AdminDashboard({ settings, onUpdateSettings, user, isConfigured, masterAuth, setMasterAuth }: { settings: WeddingSettings, onUpdateSettings: (s: WeddingSettings) => void, user: any, isConfigured: boolean, masterAuth: boolean, setMasterAuth: (b: boolean) => void }) {
  const [groups, setGroups] = React.useState<GuestGroup[]>([]);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [newGuestNames, setNewGuestNames] = React.useState('');
  const [editingGroup, setEditingGroup] = React.useState<GuestGroup | null>(null);
  const [copyingId, setCopyingId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'groups' | 'settings'>('groups');
  const [loading, setLoading] = React.useState(true);
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [authError, setAuthError] = React.useState(false);
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    if (user || masterAuth) {
      loadGroups();
    }
  }, [user, masterAuth]);

  const loadGroups = async () => {
    try {
      const gs = await WeddingService.getAllGroups();
      setGroups(gs);
      setAuthError(false);
    } catch (e) {
      console.error(e);
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      const guests = newGuestNames.split(',').map(n => ({ name: n.trim(), confirmed: null }));
      const token = await WeddingService.createGroup({ familyName: newGroupName, guests });
      if (token) {
        alert(`Grupo criado! Código: ${token}\n\nNota: Se você estiver offline, o código foi salvo apenas neste navegador.`);
        setNewGroupName('');
        setNewGuestNames('');
        loadGroups();
      }
    } catch (e: any) {
      alert(`Atenção: O grupo foi salvo NO NAVEGADOR, mas NÃO sincronizou com o Firebase (Erro: ${e.message}). \n\nIsso geralmente acontece se as regras do banco de dados não permitirem o seu usuário.`);
      console.error(e);
      loadGroups();
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup) return;
    try {
      const guests = newGuestNames.split(',').map(n => ({ 
        name: n.trim(), 
        confirmed: editingGroup.guests.find(g => g.name === n.trim())?.confirmed ?? null 
      }));
      await WeddingService.updateGroup(editingGroup.id, { familyName: newGroupName, guests });
      setEditingGroup(null);
      setNewGroupName('');
      setNewGuestNames('');
      loadGroups();
      alert('Grupo atualizado!');
    } catch (e: any) {
      alert(`Falha ao atualizar grupo: ${e.message}`);
    }
  };

  const handleDeleteGroup = async (token: string) => {
    if (!confirm('Tem certeza que deseja excluir este convite?')) return;
    try {
      await WeddingService.deleteGroup(token);
      loadGroups();
    } catch (e: any) {
      alert(`Falha ao excluir: ${e.message}`);
    }
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/?t=${token}`;
    navigator.clipboard.writeText(link);
    setCopyingId(token);
    setTimeout(() => setCopyingId(null), 2000);
  };

  const startEditGroup = (g: GuestGroup) => {
    setEditingGroup(g);
    setNewGroupName(g.familyName);
    setNewGuestNames(g.guests.map(guest => guest.name).join(', '));
  };

  const handleSaveSettings = async () => {
    await WeddingService.updateSettings(localSettings);
    onUpdateSettings(localSettings);
    alert('Configurações salvas!');
  };

  const confirmedCount = groups.reduce((acc, g) => acc + g.guests.filter(guest => guest.confirmed === true).length, 0);
  const declinedCount = groups.reduce((acc, g) => acc + g.guests.filter(guest => guest.confirmed === false).length, 0);
  const pendingCount = groups.reduce((acc, g) => acc + g.guests.filter(guest => guest.confirmed === null).length, 0);

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6 text-center">
        <Card className="max-w-md w-full space-y-6">
          <h1 className="text-3xl text-red-600 font-serif">Firebase não Configurado</h1>
          <p className="text-stone-500">
            Detectamos que o Firebase ainda não está ativo nesta versão do site (Vercel).
          </p>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left text-sm text-amber-800 space-y-3">
            <p className="font-bold">Como resolver o erro de "Newer Deployment":</p>
            <ol className="list-decimal ml-4 space-y-2">
              <li>No painel da Vercel, clique na aba <b>Deployments</b> no topo.</li>
              <li>Procure o item que diz <b>"Current"</b> (é o primeiro da lista).</li>
              <li>Clique nos três pontinhos <b>(...)</b> desse primeiro item e escolha <b>Redeploy</b>.</li>
              <li>Confirme no botão azul <b>Redeploy</b>.</li>
            </ol>
            <p className="text-[10px] opacity-70">Nota: O código que você vê agora já contém uma correção de segurança para ignorar erros de configuração se possível.</p>
          </div>
          <Button onClick={() => window.location.reload()} className="w-full">Já fiz o redeploy, atualizar</Button>
        </Card>
      </div>
    );
  }

  if (!user && !masterAuth) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl text-primary">Acesso Restrito</h1>
          <p className="text-stone-500">Acesse o painel com sua conta Google ou senha de administrador.</p>
          
          <div className="space-y-4">
            <Button 
              onClick={async () => {
                try {
                  const u = await loginWithGoogle();
                  if (!u) {
                    alert("Erro ao conectar com Google. Tente usar a senha abaixo.");
                  }
                } catch (e: any) {
                  alert("Erro ao abrir login: " + e.message + "\n\nVerifique se o seu navegador não bloqueou o pop-up.");
                }
              }} 
              className="w-full"
            >
              Entrar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-stone-200"></span></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-stone-400">Ou use a senha</span></div>
            </div>

            <div className="space-y-2">
              <Input 
                type="password" 
                placeholder="Senha de Administrador" 
                value={password} 
                onChange={setPassword} 
                className="text-center"
              />
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  if (password === '25155295') {
                    setMasterAuth(true);
                  } else {
                    alert('Senha incorreta!');
                  }
                }}
              >
                Entrar com Senha
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (authError && !masterAuth && user?.uid !== "Zgud9I2UsESOXcty3vx6UOm5ahG2") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl text-red-600 font-serif">Acesso Negado</h1>
          <p className="text-stone-500">Você fez login com Google ({user?.email}), mas não está na lista de admins.</p>
          
          <div className="p-4 bg-amber-50 rounded-xl text-left border border-amber-200">
            <p className="text-sm text-amber-800 font-bold mb-2">Dica de Atalho:</p>
            <p className="text-xs text-amber-700">Para entrar agora sem configurar o banco, use a senha <b>25155295</b> na tela de login anterior.</p>
            <Button 
              variant="outline" 
              className="mt-3 w-full"
              onClick={() => {
                const pass = prompt("Digite a senha mestre:");
                if (pass === '25155295') setMasterAuth(true);
              }}
            >
              Liberar via Senha Mestre
            </Button>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl text-left border border-stone-200">
            <p className="text-xs text-stone-400 uppercase font-medium mb-2">Para liberar o Google permanentemente:</p>
            <ol className="text-sm text-stone-600 space-y-2 list-decimal ml-4">
              <li>No Firestore, crie a coleção <code className="bg-stone-200 px-1 rounded text-xs">admins</code></li>
              <li>Crie um documento com o ID abaixo:</li>
            </ol>
            <div className="mt-4 bg-white p-3 rounded border border-red-200 flex items-center justify-between group bg-red-50">
              <code className="text-xs font-mono text-red-600 font-bold break-all">{user?.uid}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(user?.uid);
                  alert("ID Copiado!");
                }}
                className="text-[10px] text-red-400 hover:text-red-600 cursor-pointer"
              >
                Copiar
              </button>
            </div>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Voltar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-4xl text-primary">Dashboard de Controle</h1>
            {!isConfigured ? (
              <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded mt-1 border border-amber-100 flex items-center gap-1 w-fit">⚠️ MODO LOCAL - Dados salvos apenas neste navegador</p>
            ) : (
              <div className="flex flex-col gap-1">
                {user ? (
                  <>
                    <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-1 border border-green-100 flex items-center gap-1 w-fit">✅ CONECTADO AO FIREBASE</p>
                    <p className="text-[9px] text-stone-400 font-mono">Autenticado como: {user.email}</p>
                  </>
                ) : (
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1 w-fit">⚠️ MODO OFFLINE (Acesso via Senha)</p>
                    <button 
                      onClick={async () => {
                        try {
                          await loginWithGoogle();
                        } catch (e: any) {
                          alert("Falha ao conectar: " + e.message);
                        }
                      }}
                      className="text-[10px] bg-primary text-white px-2 py-0.5 rounded font-bold hover:bg-primary/90 transition-colors"
                    >
                      Conectar ao Firebase
                    </button>
                  </div>
                )}
                {masterAuth && !user && <p className="text-[8px] text-red-500 font-bold uppercase mt-1">Sincronização desativada. Use o botão acima para salvar na nuvem!</p>}
              </div>
            )}
          </div>
          <div className="flex gap-2 bg-white p-1 rounded-2xl shadow-sm">
            <button 
              onClick={() => setActiveTab('groups')}
              className={`px-6 py-2 rounded-xl transition-all ${activeTab === 'groups' ? 'bg-primary text-white' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Convidados
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-2 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-primary text-white' : 'text-stone-500 hover:bg-stone-50'}`}
            >
              Configurações
            </button>
          </div>
        </header>

        {activeTab === 'groups' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-3 gap-4">
                <Card className="text-center py-6">
                  <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Confirmados</p>
                  <p className="text-4xl text-green-600 font-serif">{confirmedCount}</p>
                </Card>
                <Card className="text-center py-6">
                  <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Recusados</p>
                  <p className="text-4xl text-red-600 font-serif">{declinedCount}</p>
                </Card>
                <Card className="text-center py-6">
                  <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Pendentes</p>
                  <p className="text-4xl text-stone-600 font-serif">{pendingCount}</p>
                </Card>
              </div>

              <Card>
                <h3 className="text-2xl mb-6">Lista de Grupos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-stone-100 text-xs uppercase tracking-widest text-stone-400">
                        <th className="pb-4 font-medium">Família / Token</th>
                        <th className="pb-4 font-medium">Convidados</th>
                        <th className="pb-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {groups.map((g) => (
                        <tr key={g.id}>
                          <td className="py-4">
                            <p className="font-semibold">{g.familyName}</p>
                            <p className="text-xs font-mono text-stone-400">{g.id}</p>
                          </td>
                          <td className="py-4">
                            <p className="text-sm">{g.guests.map(guest => guest.name).join(', ')}</p>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex gap-1">
                                {g.guests.map((guest, i) => (
                                  <div 
                                    key={i} 
                                    title={guest.name}
                                    className={`w-3 h-3 rounded-full ${guest.confirmed === true ? 'bg-green-500' : guest.confirmed === false ? 'bg-red-500' : 'bg-stone-200'}`}
                                  />
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleCopyLink(g.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${copyingId === g.id ? 'bg-green-100 text-green-600' : 'hover:bg-stone-100 text-stone-400'}`}
                                  title="Copiar Link"
                                >
                                  {copyingId === g.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                                <button 
                                  onClick={() => startEditGroup(g)}
                                  className="p-1.5 hover:bg- stone-100 text-stone-400 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteGroup(g.id)}
                                  className="p-1.5 hover:bg-red-50 text-red-300 hover:text-red-600 rounded-lg transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <div className="space-y-8">
              <Card>
                <h3 className="text-xl mb-6">{editingGroup ? 'Editar Grupo' : 'Novo Grupo'}</h3>
                <div className="space-y-4">
                  <Input label="Nome da Família" value={newGroupName} onChange={setNewGroupName} placeholder="Ex: Silva" />
                  <Input 
                    label="Convidados (separados por vírgula)" 
                    value={newGuestNames} 
                    onChange={setNewGuestNames} 
                    placeholder="João, Maria, José" 
                  />
                  <div className="flex gap-2">
                    {editingGroup && (
                      <Button variant="outline" className="flex-1" onClick={() => {
                        setEditingGroup(null);
                        setNewGroupName('');
                        setNewGuestNames('');
                      }}>
                        Cancelar
                      </Button>
                    )}
                    <Button variant="primary" className="flex-1" onClick={editingGroup ? handleUpdateGroup : handleCreateGroup} disabled={!newGroupName || !newGuestNames}>
                      {editingGroup ? 'Salvar Alterações' : 'Gerar Convite'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="bg-stone-900 border-none">
                <h3 className="text-xl text-white mb-4">Dica</h3>
                <p className="text-stone-400 text-sm leading-relaxed">
                  Envie o link do site com o token para cada família:
                  <br/><br/>
                  <code className="text-xs bg-white/10 p-2 block rounded break-all">
                    {window.location.origin}/?t=TOKEN
                  </code>
                </p>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl">Ajustar Evento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nomes do Casal" value={localSettings.coupleNames} onChange={(v) => setLocalSettings({...localSettings, coupleNames: v})} />
              <Input label="Data" value={localSettings.date} onChange={(v) => setLocalSettings({...localSettings, date: v})} />
              <Input label="Hora" value={localSettings.time} onChange={(v) => setLocalSettings({...localSettings, time: v})} />
              <Input label="Local" value={localSettings.location} onChange={(v) => setLocalSettings({...localSettings, location: v})} />
              <div className="md:col-span-2">
                <Input label="Endereço Completo" value={localSettings.address} onChange={(v) => setLocalSettings({...localSettings, address: v})} />
              </div>
              <div className="md:col-span-2">
                <Input label="Mensagem de Boas-vindas" value={localSettings.welcomeMessage} onChange={(v) => setLocalSettings({...localSettings, welcomeMessage: v})} />
              </div>
              
              <div className="md:col-span-2">
                <Input 
                  label="Velocidade das Fotos (milissegundos)" 
                  type="number" 
                  value={localSettings.carouselInterval?.toString() || '2000'} 
                  onChange={(v) => setLocalSettings({...localSettings, carouselInterval: parseInt(v) || 2000})} 
                  placeholder="2000 = 2 segundos"
                />
              </div>
              
              <div className="md:col-span-2 pt-4 border-t border-stone-100">
                <p className="text-sm font-bold mb-4">Fotos do Carrossel</p>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  {(localSettings.photos || []).map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-stone-200 group">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => {
                          const newPhotos = [...(localSettings.photos || [])];
                          newPhotos.splice(i, 1);
                          setLocalSettings({...localSettings, photos: newPhotos});
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-lg border-2 border-dashed border-stone-200 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-stone-50 transition-all">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 500000) {
                            alert("Foto muito pesada! Tente uma imagem com menos de 500kb.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const base64 = reader.result as string;
                            const currentPhotos = localSettings.photos || [];
                            setLocalSettings({...localSettings, photos: [...currentPhotos, base64]});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="text-stone-400 flex flex-col items-center">
                      <Edit className="w-5 h-5 mb-1" />
                      <span className="text-[10px]">Add Foto</span>
                    </div>
                  </label>
                </div>

                <p className="text-sm font-bold mb-2">Ou cole URLs (separadas por vírgula)</p>
                <textarea 
                  className="w-full h-24 p-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={localSettings.photos?.join(', ') || ''}
                  onChange={e => {
                    const urls = e.target.value.split(',').map(s => s.trim()).filter(s => s !== '');
                    setLocalSettings({...localSettings, photos: urls});
                  }}
                  placeholder="https://imagem1.jpg, https://imagem2.jpg..."
                />
                <p className="text-[10px] text-stone-400 mt-1">Dica: Fotos carregadas diretamente do PC podem ocupar muito espaço. Se possível, use links do Google Drive/Instagram.</p>
              </div>
            </div>
            <Button variant="primary" className="w-full py-4" onClick={handleSaveSettings}>
              Salvar Alterações
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
