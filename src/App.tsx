import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Button, Input, Card } from './components/UI';
import { WeddingSettings, GuestGroup } from './types';
import { WeddingService } from './services/weddingService';
import { auth, loginWithGoogle } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [view, setView] = React.useState<'landing' | 'rsvp' | 'admin'>('landing');
  const [token, setToken] = React.useState('');
  const [currentGroup, setCurrentGroup] = React.useState<GuestGroup | null>(null);
  const [settings, setSettings] = React.useState<WeddingSettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState<any>(null);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

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
      time: '16:00',
      location: 'Indaia Joinville',
      address: 'Joinville, SC',
      mapUrl: 'https://maps.google.com',
      heroImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=2000',
      welcomeMessage: 'Estamos muito felizes em compartilhar este dia especial com você!!'
    };
    setSettings(defaultSettings);

    try {
      const s = await WeddingService.getSettings();
      if (s) setSettings(s);
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
      {view === 'admin' && <AdminDashboard settings={settings!} onUpdateSettings={setSettings} user={user} />}
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
              <div className="flex items-start gap-3 col-span-full">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                <div>
                  <p className="font-semibold">{settings.location}</p>
                  <p className="text-sm text-stone-400 underline cursor-pointer">{settings.address}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="w-px h-full bg-stone-100 hidden md:block" />

          <div className="w-full md:w-80 space-y-6">
            <h3 className="text-xl text-center">RSVP</h3>
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

function AdminDashboard({ settings, onUpdateSettings, user }: { settings: WeddingSettings, onUpdateSettings: (s: WeddingSettings) => void, user: any }) {
  const [groups, setGroups] = React.useState<GuestGroup[]>([]);
  const [newGroupName, setNewGroupName] = React.useState('');
  const [newGuestNames, setNewGuestNames] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'groups' | 'settings'>('groups');
  const [loading, setLoading] = React.useState(true);
  const [localSettings, setLocalSettings] = React.useState(settings);
  const [authError, setAuthError] = React.useState(false);

  React.useEffect(() => {
    if (user) {
      loadGroups();
    }
  }, [user]);

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
        alert(`Grupo criado! Código: ${token}`);
        setNewGroupName('');
        setNewGuestNames('');
        loadGroups();
      } else {
        alert('Erro ao criar grupo. Verifique se o Firebase está configurado corretamente.');
      }
    } catch (e) {
      alert('Falha na comunicação com o banco de dados. O Firebase está ativo?');
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    await WeddingService.updateSettings(localSettings);
    onUpdateSettings(localSettings);
    alert('Configurações salvas!');
  };

  const confirmedCount = groups.reduce((acc, g) => acc + g.guests.filter(guest => guest.confirmed === true).length, 0);
  const declinedCount = groups.reduce((acc, g) => acc + g.guests.filter(guest => guest.confirmed === false).length, 0);
  const pendingCount = groups.reduce((acc, g) => acc + g.guests.filter(guest => guest.confirmed === null).length, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl text-primary">Acesso Restrito</h1>
          <p className="text-stone-500">Faça login com sua conta Google para acessar o painel de administração.</p>
          <Button onClick={() => loginWithGoogle()} className="w-full">Fazer Login</Button>
        </Card>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full text-center space-y-6">
          <h1 className="text-3xl text-red-600 font-serif">Acesso Negado</h1>
          <p className="text-stone-500">Você fez login, mas seu usuário ainda não tem permissão de administrador no banco de dados.</p>
          <div className="p-4 bg-stone-50 rounded-xl text-left border border-stone-200">
            <p className="text-xs text-stone-400 uppercase font-medium mb-2">Configure no Firebase Console:</p>
            <ol className="text-sm text-stone-600 space-y-2 list-decimal ml-4">
              <li>Vá em <b>Firestore Database</b></li>
              <li>Crie uma coleção chamada <code className="bg-stone-200 px-1 rounded text-xs">admins</code></li>
              <li>Crie um documento com o ID EXATO abaixo:</li>
            </ol>
            <div className="mt-4 bg-white p-3 rounded border border-stone-200 flex items-center justify-between group">
              <code className="text-xs font-mono text-primary font-bold break-all">{user.uid}</code>
              <button 
                onClick={() => navigator.clipboard.writeText(user.uid)}
                className="text-[10px] text-stone-400 hover:text-primary underline cursor-pointer"
              >
                Copiar
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-3 italic">Dica: Se você criou um documento chamado "Admin", delete-o e crie um novo usando o código acima como ID do documento.</p>
          </div>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">Já configurei, atualizar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-4xl text-primary">Dashboard de Controle</h1>
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
                              <div className="group relative">
                                <QRCodeSVG value={`${window.location.origin}/?t=${g.id}`} size={32} />
                                <div className="absolute hidden group-hover:block bottom-full mb-1 bg-stone-900 text-white text-[10px] p-2 rounded whitespace-nowrap z-50">
                                  {window.location.origin}/?t={g.id}
                                </div>
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
                <h3 className="text-xl mb-6">Novo Grupo</h3>
                <div className="space-y-4">
                  <Input label="Nome da Família" value={newGroupName} onChange={setNewGroupName} placeholder="Ex: Silva" />
                  <Input 
                    label="Convidados (separados por vírgula)" 
                    value={newGuestNames} 
                    onChange={setNewGuestNames} 
                    placeholder="João, Maria, José" 
                  />
                  <Button variant="primary" className="w-full" onClick={handleCreateGroup} disabled={!newGroupName || !newGuestNames}>
                    Gerar Convite
                  </Button>
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
