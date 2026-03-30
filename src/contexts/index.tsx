import React from 'react';
import { LanguageProvider } from './LanguageContext';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { NotificationProvider } from './NotificationContext';
import { WishlistProvider } from './WishlistContext';
import { LocationProvider } from './LocationContext';
import { RegionsProvider } from '../hooks/useRegions';
import { DeliveryMethodsProvider } from '../hooks/useDeliveryMethods';

export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <WishlistProvider>
              <LocationProvider>
                <RegionsProvider>
                  <DeliveryMethodsProvider>
                    {children}
                  </DeliveryMethodsProvider>
                </RegionsProvider>
              </LocationProvider>
            </WishlistProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

export * from './LanguageContext';
export * from './AuthContext';
export * from './CartContext';
export * from './NotificationContext';
export * from './WishlistContext';
export * from './LocationContext';
