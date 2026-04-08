'use client';

import { api } from '@/adapters/http';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ScopeState {
    scopeLevel: 'GLOBAL' | 'NATIONAL' | 'STATE' | 'LOCAL';
    defaultCountry: string;
    defaultState: string;
    defaultCity: string;
    isLoaded: boolean;
}

interface ScopeContextType extends ScopeState {
    shouldShowCountry: () => boolean;
    shouldShowState: () => boolean;
    shouldShowCity: () => boolean;
    reload: () => Promise<void>;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export function ScopeProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<ScopeState>({
        scopeLevel: 'LOCAL',
        defaultCountry: '',
        defaultState: '',
        defaultCity: '',
        isLoaded: false,
    });

    const load = async () => {
        try {
            const res = await api.get('/settings');
            const s = res.data.data;
            setState({
                scopeLevel: s.scopeLevel || 'LOCAL',
                defaultCountry: s.defaultCountry || '',
                defaultState: s.defaultState || '',
                defaultCity: s.defaultCity || '',
                isLoaded: true,
            });
        } catch {
            setState(prev => ({ ...prev, isLoaded: true }));
        }
    };

    useEffect(() => { load(); }, []);

    const shouldShowCountry = () => state.scopeLevel === 'GLOBAL';
    const shouldShowState = () => state.scopeLevel === 'GLOBAL' || state.scopeLevel === 'NATIONAL';
    const shouldShowCity = () => state.scopeLevel === 'GLOBAL' || state.scopeLevel === 'NATIONAL' || state.scopeLevel === 'STATE';

    return (
        <ScopeContext.Provider value={{ ...state, shouldShowCountry, shouldShowState, shouldShowCity, reload: load }}>
            {children}
        </ScopeContext.Provider>
    );
}

export function useScope() {
    const context = useContext(ScopeContext);
    if (!context) {
        throw new Error('useScope must be used within a ScopeProvider');
    }
    return context;
}
