'use client';

import { useEffect, useRef } from 'react';
import { api } from '@/adapters/http';
import { useAlert } from '@/context/AlertContext';

interface PaymentBrickProps {
    amount: number;
    description: string;
    type: 'TEAM_CREATION' | 'TOURNAMENT_CREATION' | 'PLAYER_REGISTRATION' | 'PLAYER_TRANSFER' | 'COIN_PURCHASE';
    entityId?: string;
    onSuccess: (transaction: any) => void;
    onCancel: () => void;
}

declare global {
    interface Window {
        MercadoPago: any;
    }
}

export function PaymentBrick({ amount, description, type, entityId, onSuccess, onCancel }: PaymentBrickProps) {
    const { error } = useAlert();
    const brickContainerRef = useRef<HTMLDivElement>(null);
    const mpRef = useRef<any>(null);

    useEffect(() => {
        if (!window.MercadoPago) {
            error('Mercado Pago SDK no cargado');
            return;
        }

        const pubKey = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MP_PUBLIC_KEY) || (import.meta as any).env?.VITE_MP_PUBLIC_KEY || 'APP_USR-67d74f2b-8a2a-4467-9c9d-726980d32969';
        const mp = new window.MercadoPago(pubKey);
        const bricksBuilder = mp.bricks();

        const renderCardPaymentBrick = async (builder: any) => {
            const settings = {
                initialization: {
                    amount: amount,
                    payer: {
                        email: "test@test.com", // Should be user's email if available
                    },
                },
                customization: {
                    visual: {
                        style: {
                            theme: 'default',
                        },
                    },
                },
                callbacks: {
                    onReady: () => {
                        console.log('Brick is ready');
                    },
                    onSubmit: async (formData: any) => {
                        try {
                            const response = await api.post('/payments/process', {
                                ...formData,
                                type,
                                entityId,
                            });
                            onSuccess(response.data.data);
                        } catch (err: any) {
                            error(err.message || 'Error al procesar el pago');
                        }
                    },
                    onError: (err: any) => {
                        console.error('Brick error:', err);
                        error('Error con el formulario de pago');
                    },
                },
            };

            await builder.create('cardPayment', 'cardPaymentBrick_container', settings);
        };

        if (brickContainerRef.current) {
            renderCardPaymentBrick(bricksBuilder);
        }

        return () => {
            // Cleanup: remove the brick instance if possible
            const container = document.getElementById('cardPaymentBrick_container');
            if (container) container.innerHTML = '';
        };
    }, [amount, description, type, entityId, error, onSuccess]);

    return (
        <div className="space-y-4">
            <div className="bg-black text-white p-4 font-black uppercase italic border-b-4 border-accent-primary">
                Total a pagar: ${amount}
            </div>
            <div id="cardPaymentBrick_container" ref={brickContainerRef}></div>
            <button
                onClick={onCancel}
                className="w-full bg-white text-black border-2 border-black p-3 font-black uppercase italic hover:bg-black hover:text-white transition-all"
            >
                Cancelar
            </button>
        </div>
    );
}
