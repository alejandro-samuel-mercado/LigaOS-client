'use client';

import { api } from '@/adapters/http';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useScope } from './ScopeContext';

interface LocationState {
    country: string | null;
    state: string | null;
}

interface LocationContextType {
    location: LocationState;
    setLocation: (newLocation: LocationState) => void;
    isLoaded: boolean;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    const scope = useScope();
    const [location, _setLocation] = useState<LocationState>({
        country: '',
        state: '',
    });
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (!scope.isLoaded) return;

        if (scope.scopeLevel !== 'GLOBAL') {
            _setLocation({
                country: scope.defaultCountry,
                state: scope.defaultState,
            });
            localStorage.setItem('user_location', JSON.stringify({
                country: scope.defaultCountry,
                state: scope.defaultState,
            }));
            setIsLoaded(true);
            return;
        }

        const saved = localStorage.getItem('user_location');
        if (saved) {
            try {
                _setLocation(JSON.parse(saved));
            } catch (e) {
                console.error('Error parsing location from localStorage', e);
            }
        }
        setIsLoaded(true);
    }, [scope.isLoaded, scope.scopeLevel, scope.defaultCountry, scope.defaultState]);

    useEffect(() => {
        if (isAuthenticated && user && isLoaded && scope.scopeLevel === 'GLOBAL') {
            if (user.state && user.country) {
                const userLocation = { state: user.state, country: user.country };
                if (user.state !== location.state || user.country !== location.country) {
                    _setLocation(userLocation);
                    localStorage.setItem('user_location', JSON.stringify(userLocation));
                }
            }
        }
    }, [isAuthenticated, user, isLoaded, location.state, location.country, scope.scopeLevel]);

    const setLocation = useCallback(async (newLocation: LocationState) => {
        _setLocation(newLocation);
        localStorage.setItem('user_location', JSON.stringify(newLocation));
        
        if (isAuthenticated) {
            try {
                await api.patch('/auth/me', {
                    state: newLocation.state,
                    country: newLocation.country
                });
            } catch (e) {
                console.error('Error saving location to profile', e);
            }
        }
        
        window.location.reload();
    }, [isAuthenticated]);

    return (
        <LocationContext.Provider value={{ location, setLocation, isLoaded }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
