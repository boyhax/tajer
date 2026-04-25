import React from 'react';
import { LanguageProvider } from './LanguageContext';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { NotificationProvider } from './NotificationContext';
import { WishlistProvider } from './WishlistContext';
import { LocationProvider } from './LocationContext';
export const AppProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <WishlistProvider>
              <LocationProvider>
                {children}
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
