import React, { useRef, useEffect } from 'react';
import { Planet, Contract, Ship, PlayerState, TravelPath, EconomyType } from '../types.ts';
import { IconClose, IconLaunch, IconChevronRight } from './Icons.tsx';
import { SHIPYARD_ECONOMIES, FUEL_COST_PER_UNIT_DISTANCE, FUEL_PRICE_PER_UNIT } from '../constants.ts';
import { useLanguage } from '../contexts/LanguageContext.tsx';
import { TranslationKey } from '../i18n/index.ts';

interface PanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side: 'left' | 'right';
}

const BasePanel: React.FC<PanelProps> = ({ isOpen, onClose, children, side }) => {
  const { t } = useLanguage();
  const transformClass = side === 'right'
    ? (isOpen ? 'translate-x-0' : 'translate-x-full')
    : (isOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <div
      className={`fixed top-0 ${side}-0 h-full w-full max-w-md bg-black/50 backdrop-blur-md border-${side === 'left' ? 'r' : 'l'} border-cyan-400/30 transition-transform duration-500 ease-in-out z-30 transform ${transformClass}`}
      aria-hidden={!isOpen}
    >
      <button onClick={onClose} className="absolute top-4 right-4 text-cyan-400 hover:text-white transition-colors" aria-label={t('close')}>
        <IconClose />
      </button>
      <div className="h-full overflow-y-auto scrollbar-thin p-6 pt-16">
        {children}
      </div>
    </div>
  );
};

const PanelSection: React.FC<{ title: TranslationKey, children: React.ReactNode }> = ({ title, children }) => {
    const { t } = useLanguage();
    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold text-cyan-400 neon-text-cyan-flicker mb-3 pb-2 border-b-2 border-cyan-400/20">{t(title)}</h2>
            {children}
        </div>
    );
};

interface PlanetPanelProps {
  planet: Planet | null;
  contracts: Contract[];
  player: PlayerState;
  ship: Ship;
  shipsForSale: Ship[];
  allPlanets: Planet[];
  travelPath: TravelPath | null;
  route: number[];
  isOpen: boolean;
  focusedIndex: number | null;
  onClose: () => void;
  onAcceptContract: (contract: Contract) => void;
  onBuyFuel: (amount: number, cost: number) => void;
  onBuyShip: (ship: Ship) => void;
  onSwitchShip: (shipId: number) => void;
  onAddToRoute: () => void;
  onTravelDirectly: () => void;
  onContractHover: (planetId: number | null) => void;
}

export const PlanetPanel: React.FC<PlanetPanelProps> = ({ planet, contracts, player, ship, shipsForSale, allPlanets, travelPath, route, isOpen, focusedIndex, onClose, onAcceptContract, onBuyFuel, onBuyShip, onSwitchShip, onAddToRoute, onTravelDirectly, onContractHover }) => {
  const { t } = useLanguage();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    if (isOpen && focusedIndex !== null && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [isOpen, focusedIndex]);
  
  if (!planet) return null;

  const isCurrentPlanet = planet.id === player.currentPlanetId;
  const hasShipyard = SHIPYARD_ECONOMIES.includes(planet.economy);
  
  const currentShipInstance = player.ownedShips.find(s => s.shipId === player.currentShipId);
  const currentFuel = currentShipInstance ? currentShipInstance.fuel : 0;
  
  const fuelToBuy = ship.fuelCapacity - currentFuel;
  const fuelCost = Math.round(fuelToBuy * FUEL_PRICE_PER_UNIT);

  const ownedShipsAtLocation = player.ownedShips.filter(s => s.shipId !== player.currentShipId);
  const shipsToBuy = shipsForSale.filter(s => !player.ownedShips.some(os => os.shipId === s.id));

  let focusCounter = 0;

  return (
    <BasePanel isOpen={isOpen} onClose={onClose} side="right">
        <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-cyan-300 tracking-wider">{planet.name}</h1>
            <p className="text-cyan-500">{planet.economy}</p>
            <p className="text-sm mt-2 italic">{t(planet.descriptionKey as TranslationKey)}</p>
        </div>

        {isCurrentPlanet ? (
            <>
                <PanelSection title="planet_panel.refueling_station">
                    <div className="bg-gray-900/50 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-orange-400">{t('planet_panel.tank')}:</span>
                            <span>{Math.round(currentFuel)} / {ship.fuelCapacity}</span>
                        </div>
                        <button
                            ref={el => { itemRefs.current[focusCounter++] = el; }}
                            onClick={() => onBuyFuel(fuelToBuy, fuelCost)}
                            disabled={fuelToBuy < 1 || player.credits < fuelCost}
                            className={`w-full py-2 rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${focusedIndex === 0 ? 'controller-focus' : ''} ${player.credits >= fuelCost ? 'bg-orange-600/80 hover:bg-orange-500' : 'bg-red-600/80'}`}
                        >
                            {t('planet_panel.fill_tank', { cost: fuelCost.toLocaleString() })}
                        </button>
                    </div>
                </PanelSection>
                
                <PanelSection title="planet_panel.hauling_contracts">
                    {contracts.length > 0 ? (
                        <ul className="space-y-3">
                            {contracts.map((contract) => {
                                const destination = allPlanets.find(p => p.id === contract.destinationPlanetId);
                                const currentFocusIndex = focusCounter++;
                                return (
                                <li key={contract.id} 
                                    className={`bg-gray-900/50 p-3 rounded-md border-l-4 border-cyan-500/50 transition-all ${focusedIndex === currentFocusIndex ? 'controller-focus-item' : ''}`}
                                    onMouseEnter={() => onContractHover(contract.destinationPlanetId)}
                                    onMouseLeave={() => onContractHover(null)}>
                                    <div className="flex justify-between items-center font-bold">
                                        <span>{contract.quantity}x {contract.cargo}</span>
                                        <div className="flex items-center gap-2">
                                            <span>To: {destination?.name || 'Unknown'}</span>
                                            <IconChevronRight />
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 text-sm">
                                        <span className="text-green-400">Reward: {contract.reward.toLocaleString()} C</span>
                                        <button
                                            ref={el => { itemRefs.current[currentFocusIndex] = el; }}
                                            onClick={() => onAcceptContract(contract)}
                                            className="px-3 py-1 bg-cyan-600/80 hover:bg-cyan-500 rounded-md transition-colors"
                                        >
                                           {t('planet_panel.accept')}
                                        </button>
                                    </div>
                                </li>
                            )})}
                        </ul>
                    ) : <p className="text-gray-400">{t('planet_panel.no_contracts')}</p>}
                </PanelSection>

                {hasShipyard && (
                    <PanelSection title="planet_panel.shipyard">
                        {shipsToBuy.length > 0 ? (
                            <ul className="space-y-3">
                                {shipsToBuy.map(s => {
                                    const canAfford = player.credits >= s.price;
                                    const cargoEmpty = player.cargo.length === 0;
                                    const currentFocusIndex = focusCounter++;
                                    return (
                                        <li key={s.id} className={`bg-gray-900/50 p-3 rounded-md transition-all ${focusedIndex === currentFocusIndex ? 'controller-focus-item' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold">{s.name}</p>
                                                    <p className="text-xs text-gray-400">Cargo: {s.cargoCapacity} | Fuel: {s.fuelCapacity} | Eff: {s.fuelEfficiency}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`${canAfford ? 'text-green-400' : 'text-red-400'}`}>{s.price.toLocaleString()} C</p>
                                                    <button
                                                        ref={el => { itemRefs.current[currentFocusIndex] = el; }}
                                                        onClick={() => onBuyShip(s)}
                                                        disabled={!canAfford || !cargoEmpty}
                                                        className="mt-1 px-3 py-1 bg-cyan-600/80 hover:bg-cyan-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {t('planet_panel.buy')}
                                                    </button>
                                                </div>
                                            </div>
                                            {!cargoEmpty && <p className="text-xs text-red-400 mt-1">{t('planet_panel.empty_cargo_to_buy')}</p>}
                                        </li>
                                    )
                                })}
                            </ul>
                        ) : <p className="text-gray-400">No new ships available.</p>}
                    </PanelSection>
                )}
                
                <PanelSection title="planet_panel.hangar">
                     {ownedShipsAtLocation.length > 0 ? (
                        <ul className="space-y-3">
                             {ownedShipsAtLocation.map(ownedShip => {
                                const shipInfo = shipsForSale.find(s => s.id === ownedShip.shipId);
                                if(!shipInfo) return null;
                                const cargoEmpty = player.cargo.length === 0;
                                const currentFocusIndex = focusCounter++;
                                return (
                                    <li key={shipInfo.id} className={`bg-gray-900/50 p-3 rounded-md transition-all ${focusedIndex === currentFocusIndex ? 'controller-focus-item' : ''}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-bold">{shipInfo.name}</p>
                                                <p className="text-xs text-gray-400">Fuel: {Math.round(ownedShip.fuel)} / {shipInfo.fuelCapacity}</p>
                                            </div>
                                            <button
                                                ref={el => { itemRefs.current[currentFocusIndex] = el; }}
                                                onClick={() => onSwitchShip(shipInfo.id)}
                                                disabled={!cargoEmpty}
                                                className="px-3 py-1 bg-cyan-600/80 hover:bg-cyan-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                               {t('planet_panel.activate')}
                                            </button>
                                        </div>
                                         {!cargoEmpty && <p className="text-xs text-red-400 mt-1">{t('planet_panel.empty_cargo_to_switch')}</p>}
                                    </li>
                                )
                             })}
                        </ul>
                     ) : <p className="text-gray-400">{t('planet_panel.no_other_ships')}</p>}
                </PanelSection>
            </>
        ) : (
            <PanelSection title="planet_panel.travel_computer">
                {travelPath && (
                     <div className="bg-gray-900/50 p-4 rounded-md space-y-2">
                        <div className="flex justify-between"><span>{t('planet_panel.distance')}:</span> <span>{travelPath.distance.toFixed(0)} {t('planet_panel.units')}</span></div>
                        <div className="flex justify-between"><span>{t('planet_panel.fuel_required')}:</span> <span>~{(travelPath.distance * ship.fuelEfficiency * FUEL_COST_PER_UNIT_DISTANCE).toFixed(1)}</span></div>
                        {travelPath.curved && <p className="text-xs text-orange-400 text-center pt-2">{t('planet_panel.gravity_well_note')}</p>}
                    </div>
                )}
                <div className="flex gap-4 mt-4">
                    <button
                        ref={el => { itemRefs.current[0] = el; }}
                        onClick={onTravelDirectly}
                        className={`flex-1 py-3 text-lg rounded-md transition-all duration-300 bg-cyan-600/80 hover:bg-cyan-500 ${focusedIndex === 0 ? 'controller-focus' : ''}`}
                    >
                        {t('planet_panel.travel_directly')}
                    </button>
                    <button
                        ref={el => { itemRefs.current[1] = el; }}
                        onClick={onAddToRoute}
                        disabled={route.includes(planet.id)}
                        className={`flex-1 py-3 text-lg rounded-md transition-all duration-300 bg-cyan-800/80 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed ${focusedIndex === 1 ? 'controller-focus' : ''}`}
                    >
                        {t('planet_panel.add_to_route')}
                    </button>
                </div>
            </PanelSection>
        )}
    </BasePanel>
  );
};


interface ManifestPanelProps {
    contracts: Contract[];
    planets: Planet[];
    isOpen: boolean;
    focusedIndex: number | null;
    onClose: () => void;
    onCancelContract: (contract: Contract) => void;
}

export const ManifestPanel: React.FC<ManifestPanelProps> = ({ contracts, planets, isOpen, focusedIndex, onClose, onCancelContract }) => {
    const { t } = useLanguage();
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    useEffect(() => {
        if (isOpen && focusedIndex !== null && itemRefs.current[focusedIndex]) {
            itemRefs.current[focusedIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [isOpen, focusedIndex]);

    return (
        <BasePanel isOpen={isOpen} onClose={onClose} side="left">
            <h1 className="text-3xl font-bold text-cyan-300 tracking-wider mb-6 text-center">{t('manifest_panel.title')}</h1>
            {contracts.length > 0 ? (
                <ul className="space-y-4">
                    {contracts.map((contract, index) => {
                        const destination = planets.find(p => p.id === contract.destinationPlanetId);
                        return (
                            <li key={contract.id} className={`bg-gray-900/50 p-4 rounded-md border-l-4 border-cyan-500/50 ${focusedIndex === index ? 'controller-focus-item' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-lg">{contract.quantity}x {contract.cargo}</p>
                                        <p className="text-sm text-cyan-400">{t('manifest_panel.to')}: {destination?.name ?? 'Unknown'}</p>
                                    </div>
                                    <p className="text-green-400 font-semibold">{t('manifest_panel.reward')}: {contract.reward.toLocaleString()} C</p>
                                </div>
                                <button
                                    ref={el => { itemRefs.current[index] = el; }}
                                    onClick={() => onCancelContract(contract)}
                                    className="w-full mt-3 py-2 text-sm bg-red-800/80 hover:bg-red-700 rounded-md transition-colors"
                                >
                                    {t('manifest_panel.cancel_contract', { penalty: contract.penalty.toLocaleString() })}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="text-center text-gray-400 mt-8">{t('manifest_panel.empty_hold')}</p>
            )}
        </BasePanel>
    );
};


interface RoutePanelProps {
    route: Planet[];
    isTraveling: boolean;
    focusedIndex: number | null;
    onLaunch: () => void;
    onClear: () => void;
    onRemoveFromRoute: (planetId: number) => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({ route, isTraveling, focusedIndex, onLaunch, onClear, onRemoveFromRoute }) => {
    const { t } = useLanguage();
    if (isTraveling || route.length === 0) return null;

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl bg-black/40 backdrop-blur-sm border-t-2 border-cyan-400/30 rounded-t-lg p-4 z-20 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin flex-grow">
                <span className="font-bold text-cyan-400 mr-2 flex-shrink-0">{t('route_panel.title')}:</span>
                {route.map((planet, index) => (
                    <div key={planet.id} className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative group bg-gray-800 px-3 py-1 rounded-md text-nowrap">
                            <span>{planet.name}</span>
                            <button 
                                onClick={() => onRemoveFromRoute(planet.id)}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 rounded-full text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title={t('route_panel.remove_from_route_title', {planetName: planet.name})}
                                aria-label={t('route_panel.remove_from_route_aria', {planetName: planet.name})}
                            >
                                &times;
                            </button>
                        </div>
                        {index < route.length - 1 && <IconChevronRight />}
                    </div>
                ))}
            </div>
            <div className="flex gap-2 flex-shrink-0">
                <button
                    onClick={onLaunch}
                    className={`flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-500 rounded-md transition-colors ${focusedIndex === 0 ? 'controller-focus' : ''}`}
                >
                    <IconLaunch />
                    {t('route_panel.continue')}
                </button>
                <button
                    onClick={onClear}
                    className={`px-4 py-2 bg-red-800/80 hover:bg-red-700 rounded-md transition-colors ${focusedIndex === 1 ? 'controller-focus' : ''}`}
                >
                    {t('route_panel.clear')}
                </button>
            </div>
        </div>
    );
};