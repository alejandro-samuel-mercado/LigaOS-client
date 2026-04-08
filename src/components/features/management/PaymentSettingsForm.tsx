import { useAlert } from '@/context/AlertContext';
import { api } from '@/adapters/http';
import { useEffect, useState } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';

interface CoinPack {
    id: string;
    name: string;
    coins: number;
    price: number;
    isActive: boolean;
}

export function PaymentSettingsForm() {
    const { success, error } = useAlert();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any>({
        isPaidMode: false,
        priceCreateTeam: 0,
        priceCreateTournament: 0,
        priceRegisterPlayer: 0,
        priceTransferPlayer: 0,
    });
    
    const [packs, setPacks] = useState<CoinPack[]>([]);
    const [newPack, setNewPack] = useState({ name: '', coins: 0, price: 0 });

    useEffect(() => {
        api.get('/settings')
            .then((res: any) => {
                if (res.data.data) {
                    setSettings(res.data.data);
                }
            })
            .catch((err: any) => error('Error al cargar configuración'))
            .finally(() => setLoading(false));

        api.get('/coin-packs/all')
            .then(res => setPacks(res.data.data))
            .catch(console.error);
    }, [error]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.patch('/settings', {
                ...settings,
                priceCreateTeam: Number(settings.priceCreateTeam) || 0,
                priceCreateTournament: Number(settings.priceCreateTournament) || 0,
                priceRegisterPlayer: Number(settings.priceRegisterPlayer) || 0,
                priceTransferPlayer: Number(settings.priceTransferPlayer) || 0,
            });
            success('Configuración guardada correctamente');
        } catch (err) {
            error('Error al guardar configuración');
        } finally {
            setSaving(false);
        }
    };

    const handleCreatePack = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.post('/coin-packs', newPack);
            setPacks([...packs, res.data.data]);
            setNewPack({ name: '', coins: 0, price: 0 });
            success('Pack creado correctamente');
        } catch (err) {
            error('Error al crear pack');
        }
    };

    const handleDeletePack = async (id: string) => {
        try {
            await api.delete(`/coin-packs/${id}`);
            setPacks(packs.filter(p => p.id !== id));
            success('Pack eliminado');
        } catch (err) {
            error('Error al eliminar pack');
        }
    };

    if (loading) return <div className="p-8 text-center font-black uppercase italic animate-pulse">Cargando...</div>;

    return (
        <form onSubmit={handleSave} className="space-y-6 p-2">
            <div className="flex items-center justify-between p-4 bg-black text-white border-b-4 border-accent-primary">
                <span className="font-black uppercase italic tracking-tighter">Modo de Pago Activo</span>
                <button
                    type="button"
                    onClick={() => setSettings({ ...settings, isPaidMode: !settings.isPaidMode })}
                    className={`h-8 w-16 relative rounded-none border-2 border-white transition-colors ${settings.isPaidMode ? 'bg-accent-primary' : 'bg-gray-700'}`}
                >
                    <div className={`absolute top-1 h-4 w-4 bg-white transition-all ${settings.isPaidMode ? 'left-10' : 'left-2'}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Costo Crear Equipo (Monedas)</label>
                    <input
                        type="number"
                        value={settings.priceCreateTeam}
                        onChange={e => setSettings({ ...settings, priceCreateTeam: e.target.value })}
                        className="w-full bg-bg-secondary border-2 border-black p-3 font-bold focus:outline-none focus:border-accent-primary"
                        disabled={!settings.isPaidMode}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Costo Crear Torneo (Monedas)</label>
                    <input
                        type="number"
                        value={settings.priceCreateTournament}
                        onChange={e => setSettings({ ...settings, priceCreateTournament: e.target.value })}
                        className="w-full bg-bg-secondary border-2 border-black p-3 font-bold focus:outline-none focus:border-accent-primary"
                        disabled={!settings.isPaidMode}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Costo Registrar Jugador (Monedas)</label>
                    <input
                        type="number"
                        value={settings.priceRegisterPlayer}
                        onChange={e => setSettings({ ...settings, priceRegisterPlayer: e.target.value })}
                        className="w-full bg-bg-secondary border-2 border-black p-3 font-bold focus:outline-none focus:border-accent-primary"
                        disabled={!settings.isPaidMode}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Costo Transferir Jugador (Monedas)</label>
                    <input
                        type="number"
                        value={settings.priceTransferPlayer}
                        onChange={e => setSettings({ ...settings, priceTransferPlayer: e.target.value })}
                        className="w-full bg-bg-secondary border-2 border-black p-3 font-bold focus:outline-none focus:border-accent-primary"
                        disabled={!settings.isPaidMode}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={saving}
                className="w-full bg-black text-accent-primary font-black uppercase italic p-4 flex items-center justify-center gap-2 hover:bg-accent-primary hover:text-white transition-all border-b-4 border-accent-primary active:translate-y-1 disabled:opacity-50"
            >
                <Save size={20} />
                {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
            <div className="mt-8">
                <h3 className="font-black uppercase italic tracking-tighter text-xl bg-black text-white p-2 border-b-4 border-accent-primary mb-4">Gestión de Packs de Monedas</h3>
                
                <div className="grid grid-cols-1 gap-4 mb-6">
                    {packs.map(pack => (
                        <div key={pack.id} className="flex justify-between items-center bg-bg-secondary border-2 border-black p-4">
                            <div>
                                <h4 className="font-bold text-lg">{pack.name}</h4>
                                <p className="text-sm font-black text-accent-primary">{pack.coins} Monedas <span className="text-black/50 ml-2">${pack.price}</span></p>
                            </div>
                            <button type="button" onClick={() => handleDeletePack(pack.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="bg-bg-secondary border-2 border-black p-4 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Nombre del Pack</label>
                        <input type="text" value={newPack.name} onChange={e => setNewPack({ ...newPack, name: e.target.value })} className="w-full border-2 border-black p-2 font-bold" placeholder="Ej: Pack Pro" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Cantidad de Monedas</label>
                        <input type="number" value={newPack.coins} onChange={e => setNewPack({ ...newPack, coins: Number(e.target.value) })} className="w-full border-2 border-black p-2 font-bold" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Precio en $ (Real)</label>
                        <input type="number" value={newPack.price} onChange={e => setNewPack({ ...newPack, price: Number(e.target.value) })} className="w-full border-2 border-black p-2 font-bold" />
                    </div>
                    <button type="button" onClick={handleCreatePack} className="bg-black text-white p-3 border-b-4 border-accent-primary hover:bg-accent-primary transition-colors flex gap-2 font-black uppercase">
                        <Plus />
                        Crear
                    </button>
                </div>
            </div>
        </form>
    );
}
