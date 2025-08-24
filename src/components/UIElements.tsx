import React from 'react';
import { PlayerState, Ship } from '../types.ts';
import { IconCredits, IconLocation, IconShipName, IconFuel, IconCargo } from './Icons.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface StatusBarProps {
  player: PlayerState;
  ship: Ship;
  currentPlanetName: string;
  onManifestClick: () => void;
  onPauseClick: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ player, ship, currentPlanetName, onManifestClick, onPauseClick }) => {
  const { t } = useLanguage();
  const cargoUsed = player.cargo.reduce((acc, c) => acc + c.quantity, 0);
  const currentShipInstance = player.ownedShips.find(s => s.shipId === player.currentShipId);
  const fuel = currentShipInstance ? currentShipInstance.fuel : 0;

  return (
    <div className="absolute top-0 left-0 right-0 h-16 bg-black/30 backdrop-blur-sm border-b border-cyan-400/30 flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex items-center gap-2 text-green-400 neon-text-green">
          <IconCredits />
          <span className="font-bold">{player.credits.toLocaleString()} C</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-cyan-400">
          <IconLocation />
          <span>{currentPlanetName}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2 text-cyan-400">
            <IconShipName />
            <span>{ship.name}</span>
        </div>
        <div className="flex items-center gap-2 text-orange-400">
          <IconFuel />
          <span>{Math.round(fuel)} / {ship.fuelCapacity}</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-400">
          <IconCargo />
          <span>{cargoUsed} / {ship.cargoCapacity}</span>
        </div>
        <button
          onClick={onManifestClick}
          className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-md hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all duration-300"
        >
          {t('manifest_button')}
        </button>
        <button
          onClick={onPauseClick}
          className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/50 rounded-md hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all duration-300"
        >
          {t('pause_button')}
        </button>
      </div>
    </div>
  );
};

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="bg-gray-800 border border-cyan-400/50 shadow-lg rounded-lg p-4 w-full animate-slide-in-left">
      <p className="text-cyan-300">{message}</p>
    </div>
  );
};

interface ToastContainerProps {
  toasts: { id: number; message: string }[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col gap-2 items-start w-full max-w-sm">
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  );
};