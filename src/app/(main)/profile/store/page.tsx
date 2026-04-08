'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';
import { PaymentBrick } from '@/components/ui/PaymentBrick';
import { Modal } from '@/components/ui/Modal';
import { ChevronLeft } from 'lucide-react';

interface CoinPack {
    id: string;
    name: string;
    coins: number;
    price: number;
    isActive: boolean;
}

export default function StorePage() {
    const { user, checkAuth } = useAuth();
    const router = useRouter();
    const { success, error } = useAlert();
    const [packs, setPacks] = useState<CoinPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        api.get('/coin-packs/all')
            .then(res => setPacks(res.data.data.filter((p: CoinPack) => p.isActive)))
            .catch(() => error('Error al cargar la tienda de monedas'))
            .finally(() => setLoading(false));
    }, [error]);

    const handlePurchaseSuccess = async () => {
        success('¡Compra exitosa! Se han acreditado tus monedas.');
        setIsPaymentModalOpen(false);
        setSelectedPack(null);
        await checkAuth(); // Refresh user state to fetch the new coin balance
    };

    if (loading) {
        return <div className="p-12 text-center text-xl font-black uppercase italic animate-pulse">Cargando Tienda...</div>;
    }

    return (
        <div className="main-container px-6 py-12 pb-40 space-y-12 bg-bg-primary mesh-bg min-h-screen">
            <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 font-black uppercase text-xl italic hover:text-accent-primary transition-colors"
            >
                <ChevronLeft size={24} strokeWidth={3} />
                Volver
            </button>

            <div className="flex items-end justify-between border-b-8 border-black pb-4">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black text-text-primary tracking-tighter uppercase leading-none italic">Tienda</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Compra monedas para crear equipos y torneos.</p>
                </div>
                <div className="bg-black text-yellow-500 font-black text-2xl p-4 border-2 border-yellow-500 transform rotate-3">
                    {user?.coins ?? 0} M
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {packs.map(pack => (
                    <div 
                        key={pack.id} 
                        className="bg-bg-card border-4 border-black p-8 hover:-translate-y-2 transition-transform hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative flex flex-col items-center justify-center space-y-6 text-center"
                    >
                        <div className="text-6xl grayscale transition-all">💰</div>
                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">{pack.name}</h2>
                            <p className="text-sm font-bold text-accent-primary uppercase tracking-widest">Incluye {pack.coins} Monedas</p>
                        </div>
                        <button
                            onClick={() => {
                                setSelectedPack(pack);
                                setIsPaymentModalOpen(true);
                            }}
                            className="w-full bg-black text-white p-4 font-black uppercase border-b-4 border-green-500 hover:bg-green-500 hover:text-black transition-colors"
                        >
                            Comprar por ${pack.price}
                        </button>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                title={`Comprar ${selectedPack?.name}`}
            >
                {selectedPack && (
                    <div className="space-y-4">
                        <PaymentBrick
                            amount={selectedPack.price}
                            description={`Compra de ${selectedPack.coins} monedas`}
                            type="COIN_PURCHASE"
                            entityId={selectedPack.id}
                            onSuccess={handlePurchaseSuccess}
                            onCancel={() => setIsPaymentModalOpen(false)}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}
