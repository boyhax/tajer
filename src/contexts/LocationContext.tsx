import React, { createContext, useState, useContext, useEffect } from 'react';

interface LocationContextType {
  location: { lat: number; lng: number } | null;
  setLocation: (loc: { lat: number; lng: number }) => void;
  address: string;
  setAddress: (addr: string) => void;
}

export const LocationContext = createContext<LocationContextType>({
  location: null,
  setLocation: () => {},
  address: '',
  setAddress: () => {}
});

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(() => {
    const saved = localStorage.getItem('kuzama_location');
    return saved ? JSON.parse(saved) : null;
  });
  const [address, setAddressState] = useState(() => localStorage.getItem('kuzama_address') || '');

  const setLocation = (loc: { lat: number; lng: number }) => {
    setLocationState(loc);
    localStorage.setItem('kuzama_location', JSON.stringify(loc));
  };

  const setAddress = (addr: string) => {
    setAddressState(addr);
    localStorage.setItem('kuzama_address', addr);
  };

  return (
    <LocationContext.Provider value={{ location, setLocation, address, setAddress }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
