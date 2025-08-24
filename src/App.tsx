import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Planet, TravelPath, Contract, Ship, ViewState, PlayerShip, Point } from './types.ts';
import { initializeGame, generateContracts, calculateTravelPath, calculateDistance } from './services/gameService.ts';
import { saveGameState, loadGameState, hasSaveData as checkHasSaveData, deleteGameState } from './services/saveGameService.ts';
import { TRAVEL_SPEED_UNITS_PER_SECOND, FUEL_COST_PER_UNIT_DISTANCE, MAP_SIZE, SHIPYARD_ECONOMIES } from './constants.ts';
import StarMap from './components/StarMap.tsx';
import { LoadingOverlay, TravelOverlay, MainMenu, OptionsPanel, PauseMenu } from './components/Overlays.tsx';
import { StatusBar, ToastContainer } from './components/UIElements.tsx';
import { PlanetPanel, ManifestPanel, RoutePanel } from './components/Panels.tsx';
import { useLanguage } from './contexts/LanguageContext.tsx';

type ActivePanel = 'planet' | 'manifest' | null;
type ScreenState = 'MainMenu' | 'Options' | 'Loading' | 'Playing' | 'Paused';

type TravelState = {
  inTransit: boolean;
  fromPlanet: Planet;
  toPlanet: Planet;
  startTime: number;
  duration: number;
  progress: number;
};

// Controller constants
const GAMEPAD_DEADZONE = 0.2;
const CURSOR_SPEED = 20;
const HOVER_RADIUS = 25;

const findNextPlanet = (
  direction: 'up' | 'down' | 'left' | 'right',
  currentPlanet: Planet,
  allPlanets: Planet[]
): Planet | null => {
  let bestCandidate: Planet | null = null;
  let bestScore = Infinity;

  const targetVector = {
    'right': { x: 1, y: 0 },
    'left': { x: -1, y: 0 },
    'up': { x: 0, y: -1 }, // In SVG/screen coordinates, negative Y is up
    'down': { x: 0, y: 1 },
  }[direction];

  for (const candidate of allPlanets) {
    if (candidate.id === currentPlanet.id) continue;

    const vectorToCandidate = {
      x: candidate.position.x - currentPlanet.position.x,
      y: candidate.position.y - currentPlanet.position.y,
    };

    const distance = Math.sqrt(vectorToCandidate.x ** 2 + vectorToCandidate.y ** 2);
    if (distance === 0) continue;

    const normalizedVector = {
      x: vectorToCandidate.x / distance,
      y: vectorToCandidate.y / distance,
    };

    const dotProduct = (targetVector.x * normalizedVector.x) + (targetVector.y * normalizedVector.y);

    if (dotProduct > 0) {
      const score = distance / dotProduct;
      
      if (score < bestScore) {
        bestScore = score;
        bestCandidate = candidate;
      }
    }
  }
  
  return bestCandidate;
};


const App: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [screen, setScreen] = useState<ScreenState>('MainMenu');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedPlanetId, setSelectedPlanetId] = useState<number | null>(null);
  const [route, setRoute] = useState<number[]>([]);
  const [travelState, setTravelState] = useState<TravelState | null>(null);
  const [travelPath, setTravelPath] = useState<TravelPath | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ zoom: 1, offset: { x: 0, y: 0 } });
  const [contractHoveredPlanetId, setContractHoveredPlanetId] = useState<number | null>(null);
  const [hasSaveData, setHasSaveData] = useState(false);
  const [optionsReturnScreen, setOptionsReturnScreen] = useState<'MainMenu' | 'Paused'>('MainMenu');

  // Controller state
  const [gamepadIndex, setGamepadIndex] = useState<number | null>(null);
  const [cursorPosition, setCursorPosition] = useState<Point | null>(null);
  const [hoveredPlanetId, setHoveredPlanetId] = useState<number | null>(null);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(0);
  const buttonStates = useRef<Record<number, { pressed: boolean, triggered: boolean }>>({});
  const focusableItems = useRef<(() => void)[]>([]);
  const pauseTimeRef = useRef<number | null>(null);
  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);

  // Check for save data on initial load
  useEffect(() => {
    setHasSaveData(checkHasSaveData());
  }, []);
  
  // Auto-save game state when it changes during play
  useEffect(() => {
    if (screen === 'Playing' && gameState) {
      saveGameState(gameState);
    }
  }, [gameState, screen]);

  // Handle pausing/unpausing travel timer
  useEffect(() => {
    if (travelState?.inTransit) {
        if (screen === 'Paused') {
            pauseTimeRef.current = Date.now();
        } else if (screen === 'Playing' && pauseTimeRef.current) {
            const pauseDuration = Date.now() - pauseTimeRef.current;
            setTravelState(ts => ts ? { ...ts, startTime: ts.startTime + pauseDuration } : null);
            pauseTimeRef.current = null;
        }
    }
  }, [screen, travelState?.inTransit]);

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
  }, []);

  const handleDismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  const handleNewGame = useCallback(() => {
    if (hasSaveData) {
      if (!window.confirm(t('main_menu.new_game_confirm'))) {
        return;
      }
      deleteGameState();
    }
    setScreen('Loading');
    const initialState = initializeGame();
    setTimeout(() => {
      setGameState(initialState);
      setScreen('Playing');
      setHasSaveData(true); 
    }, 1500);
  }, [hasSaveData, t]);

  const handleContinueGame = useCallback(() => {
    const savedState = loadGameState();
    if (savedState) {
        setScreen('Loading');
        setTimeout(() => {
            setGameState(savedState);
            setScreen('Playing');
        }, 500);
    }
  }, []);

  const handleShowOptions = useCallback((from: 'MainMenu' | 'Paused') => {
    setOptionsReturnScreen(from);
    setScreen('Options');
  }, []);
  
  const handleBackFromOptions = useCallback(() => setScreen(optionsReturnScreen), [optionsReturnScreen]);

  // Pause Menu Handlers
  const handleTogglePause = useCallback(() => {
    if (screen === 'Playing') setScreen('Paused');
    else if (screen === 'Paused') setScreen('Playing');
  }, [screen]);

  const handleSaveGame = useCallback(() => {
      if (gameState) {
          saveGameState(gameState);
          addToast(t('toast.game_saved'));
      }
  }, [gameState, addToast, t]);

  const handleExitToMainMenu = useCallback(() => {
      if (gameState) saveGameState(gameState); // Auto-save on exit
      setScreen('MainMenu');
      setHasSaveData(checkHasSaveData()); // Re-check for save data
  }, [gameState]);


  // Travel path calculation effect
  useEffect(() => {
    if (gameState && selectedPlanetId !== null) {
      const start = gameState.universe.planets.find(p => p.id === gameState.player.currentPlanetId);
      const end = gameState.universe.planets.find(p => p.id === selectedPlanetId);
      if (start && end) {
        setTravelPath(calculateTravelPath(start.position, end.position));
      }
    } else {
      setTravelPath(null);
    }
  }, [gameState, selectedPlanetId]);

  // Game loop for travel
  useEffect(() => {
    if (!travelState || !travelState.inTransit) return;

    const isRouteTravel = route.length > 0 && route[0] === travelState.toPlanet.id;

    const interval = setInterval(() => {
      if (screenRef.current === 'Paused') return;

      const elapsed = (Date.now() - travelState.startTime) / 1000;
      const progress = Math.min(100, (elapsed / travelState.duration) * 100);

      if (progress >= 100) {
        setGameState(prev => {
            if (!prev) return null;
            
            const toPlanet = travelState.toPlanet;
            addToast(t('toast.arrived_at', { planetName: toPlanet.name }));

            let newCredits = prev.player.credits;
            const completedContracts: Contract[] = [];
            const remainingCargo: Contract[] = [];

            prev.player.cargo.forEach(contract => {
                if(contract.destinationPlanetId === toPlanet.id) {
                    completedContracts.push(contract);
                    newCredits += contract.reward;
                } else {
                    remainingCargo.push(contract);
                }
            });

            if (completedContracts.length > 0) {
                const totalReward = completedContracts.reduce((sum, c) => sum + c.reward, 0);
                addToast(t('toast.contracts_completed', { credits: totalReward }));
            }
            
            const newContracts = { ...prev.contracts };
            if (!newContracts[toPlanet.id]) {
                const currentShip = prev.ships.find(s => s.id === prev.player.currentShipId)!;
                newContracts[toPlanet.id] = generateContracts(toPlanet, prev.universe.planets, currentShip.cargoCapacity);
            }

            return {
                ...prev,
                player: {
                    ...prev.player,
                    credits: newCredits,
                    currentPlanetId: toPlanet.id,
                    cargo: remainingCargo,
                },
                contracts: newContracts,
            };
        });

        const arrivalPlanetId = travelState.toPlanet.id;
        setTravelState(null);
        
        if (isRouteTravel) {
          setRoute(prevRoute => prevRoute.slice(1));
          setSelectedPlanetId(arrivalPlanetId);
          setActivePanel('planet');
        }

      } else {
        setTravelState(ts => (ts ? { ...ts, progress } : null));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [travelState, route, addToast, t]);
  
    // Gamepad connection handler
    useEffect(() => {
        const handleGamepadConnected = (e: GamepadEvent) => {
            addToast(t('toast.controller_connected'));
            setGamepadIndex(e.gamepad.index);
            if(gameState) {
                const currentPlanet = gameState.universe.planets.find(p => p.id === gameState.player.currentPlanetId);
                if (currentPlanet) {
                     setCursorPosition({
                         x: currentPlanet.position.x - viewState.offset.x,
                         y: currentPlanet.position.y - viewState.offset.y
                     });
                }
            } else {
                setCursorPosition({ x: 0, y: 0 });
            }
        };
        const handleGamepadDisconnected = (e: GamepadEvent) => {
            addToast(t('toast.controller_disconnected'));
            if (gamepadIndex === e.gamepad.index) {
                setGamepadIndex(null);
                setCursorPosition(null);
                setHoveredPlanetId(null);
            }
        };
        window.addEventListener('gamepadconnected', handleGamepadConnected);
        window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);
        return () => {
            window.removeEventListener('gamepadconnected', handleGamepadConnected);
            window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
        };
    }, [addToast, gameState, gamepadIndex, viewState.offset, t]);

  const handleClosePanels = useCallback(() => {
    setActivePanel(null);
    setSelectedPlanetId(null);
    setContractHoveredPlanetId(null);
  }, []);
  
  const handleSelectPlanet = useCallback((id: number) => {
    if (activePanel === 'planet' && selectedPlanetId === id) {
      handleClosePanels();
    } else {
      setSelectedPlanetId(id);
      setActivePanel('planet');
    }
  }, [activePanel, selectedPlanetId, handleClosePanels]);

  const handleToggleManifest = useCallback(() => {
    setActivePanel(p => (p === 'manifest' ? null : 'manifest'));
  }, []);

  const handleAcceptContract = useCallback((contract: Contract) => {
    setGameState(prev => {
        if (!prev) return null;
        const currentShip = prev.ships.find(s => s.id === prev.player.currentShipId)!;
        const cargoUsed = prev.player.cargo.reduce((acc, c) => acc + c.quantity, 0);

        if (cargoUsed + contract.quantity > currentShip.cargoCapacity) {
            addToast(t('toast.not_enough_cargo'));
            return prev;
        }

        addToast(t('toast.contract_accepted'));
        return {
            ...prev,
            player: { ...prev.player, cargo: [...prev.player.cargo, contract] },
            contracts: {
                ...prev.contracts,
                [prev.player.currentPlanetId]: prev.contracts[prev.player.currentPlanetId].filter(c => c.id !== contract.id)
            }
        };
    });
  }, [addToast, t]);

  const handleCancelContract = useCallback((contractToCancel: Contract) => {
    setGameState(prev => {
        if(!prev) return null;
        addToast(t('toast.contract_cancelled', { penalty: contractToCancel.penalty }));
        return {
            ...prev,
            player: {
                ...prev.player,
                credits: prev.player.credits - contractToCancel.penalty,
                cargo: prev.player.cargo.filter(c => c.id !== contractToCancel.id)
            }
        }
    })
  }, [addToast, t]);

  const handleBuyFuel = useCallback((amount: number, cost: number) => {
    setGameState(prev => {
        if(!prev || prev.player.credits < cost) {
            addToast(t('toast.insufficient_credits_fuel'));
            return prev;
        }
        addToast(t('toast.refueled', { amount: amount.toFixed(0) }));

        const currentShipInfo = prev.ships.find(s => s.id === prev.player.currentShipId)!;
        const updatedOwnedShips = prev.player.ownedShips.map(s => {
            if (s.shipId === prev.player.currentShipId) {
                return { ...s, fuel: Math.min(currentShipInfo.fuelCapacity, s.fuel + amount) };
            }
            return s;
        });

        return {
            ...prev,
            player: {
                ...prev.player,
                credits: prev.player.credits - cost,
                ownedShips: updatedOwnedShips
            }
        }
    });
  }, [addToast, t]);

  const handleBuyShip = useCallback((shipToBuy: Ship) => {
     setGameState(prev => {
        if(!prev || prev.player.credits < shipToBuy.price || prev.player.cargo.length > 0) {
            addToast(t('toast.cannot_buy_ship'));
            return prev;
        }
        addToast(t('toast.ship_purchased', { shipName: shipToBuy.name }));
        const newShipInstance: PlayerShip = { shipId: shipToBuy.id, fuel: shipToBuy.fuelCapacity };
        return {
            ...prev,
            player: {
                ...prev.player,
                credits: prev.player.credits - shipToBuy.price,
                ownedShips: [...prev.player.ownedShips, newShipInstance],
                currentShipId: shipToBuy.id,
            }
        }
    });
  }, [addToast, t]);
  
  const handleSwitchShip = useCallback((shipId: number) => {
    setGameState(prev => {
        if (!prev) return null;
        if (prev.player.cargo.length > 0) {
            addToast(t('toast.empty_cargo_to_switch_ships'));
            return prev;
        }
        if (prev.player.currentShipId === shipId) return prev;

        const newShipInfo = prev.ships.find(s => s.id === shipId)!;
        addToast(t('toast.ship_activated', { shipName: newShipInfo.name }));

        return {
            ...prev,
            player: {
                ...prev.player,
                currentShipId: shipId
            }
        };
    });
  }, [addToast, t]);

  const startTravel = useCallback((fromPlanet: Planet, toPlanet: Planet) => {
      if (!gameState) return;
      
      const path = calculateTravelPath(fromPlanet.position, toPlanet.position);
      const ship = gameState.ships.find(s => s.id === gameState.player.currentShipId)!;
      const fuelNeeded = path.distance * ship.fuelEfficiency * FUEL_COST_PER_UNIT_DISTANCE;
      
      const currentPlayerShipInstance = gameState.player.ownedShips.find(s => s.shipId === gameState.player.currentShipId)!;

      if (currentPlayerShipInstance.fuel < fuelNeeded) {
          addToast(t('toast.insufficient_fuel'));
          return;
      }
      
      setGameState(prev => {
          if (!prev) return null;
          const updatedOwnedShips = prev.player.ownedShips.map(s => {
              if (s.shipId === prev.player.currentShipId) {
                  return { ...s, fuel: s.fuel - fuelNeeded };
              }
              return s;
          });
          return { ...prev, player: {...prev.player, ownedShips: updatedOwnedShips } };
      });

      setActivePanel(null);
      setSelectedPlanetId(null);
      setTravelPath(null);

      const duration = path.distance / TRAVEL_SPEED_UNITS_PER_SECOND;
      setTravelState({
          inTransit: true,
          fromPlanet,
          toPlanet,
          startTime: Date.now(),
          duration,
          progress: 0
      });
  }, [gameState, addToast, t]);

  const handleLaunch = useCallback(() => {
      if (!gameState || route.length === 0) return;
      const fromPlanet = gameState.universe.planets.find(p => p.id === gameState.player.currentPlanetId)!;
      const toPlanet = gameState.universe.planets.find(p => p.id === route[0])!;
      startTravel(fromPlanet, toPlanet);
  }, [gameState, route, startTravel]);
  
  const handleTravelDirectly = useCallback(() => {
      if (!gameState || selectedPlanetId === null) return;
      const fromPlanet = gameState.universe.planets.find(p => p.id === gameState.player.currentPlanetId)!;
      const toPlanet = gameState.universe.planets.find(p => p.id === selectedPlanetId)!;
      startTravel(fromPlanet, toPlanet);
  }, [gameState, selectedPlanetId, startTravel]);
  
  const handleAddToRoute = useCallback(() => {
      if(selectedPlanetId === null || route.includes(selectedPlanetId)) return;
      setRoute(prev => [...prev, selectedPlanetId!]);
      addToast(t('toast.destination_added_to_route'));
  }, [selectedPlanetId, route, addToast, t]);

  const handleRemoveFromRoute = useCallback((planetIdToRemove: number) => {
    setRoute(prev => prev.filter(id => id !== planetIdToRemove));
    addToast(t('toast.destination_removed_from_route'));
  }, [addToast, t]);

    // Keyboard controls handler
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.repeat) return;

            const key = event.key.toLowerCase();
            const dpadUp = key === 'w' || key === 'arrowup';
            const dpadDown = key === 's' || key === 'arrowdown';
            const dpadLeft = key === 'a' || key === 'arrowleft';
            const dpadRight = key === 'd' || key === 'arrowright';
            const acceptKey = key === ' ' || key === 'enter';
            const backKey = key === 'escape';
            const pauseKey = key === 'p';

            if (pauseKey && (screen === 'Playing' || screen === 'Paused')) {
                handleTogglePause();
                return;
            }
            
            if (backKey) {
                event.preventDefault();
                if (screen === 'Options') handleBackFromOptions();
                else if (screen === 'Paused') handleTogglePause();
                else if (screen === 'Playing' && activePanel !== null) handleClosePanels();
            }

            if (acceptKey) {
                event.preventDefault();
                if ((screen === 'MainMenu' || screen === 'Options' || screen === 'Paused') && focusableItems.current[focusedItemIndex]) {
                    focusableItems.current[focusedItemIndex]();
                } else if (screen === 'Playing') {
                    if (activePanel !== null && focusableItems.current[focusedItemIndex]) {
                        focusableItems.current[focusedItemIndex]();
                    } else if (activePanel === null && hoveredPlanetId !== null) {
                        handleSelectPlanet(hoveredPlanetId);
                    } else if (activePanel === null && route.length > 0 && focusableItems.current[focusedItemIndex]) {
                        focusableItems.current[focusedItemIndex]();
                    }
                }
            }

            if (dpadUp || dpadDown || dpadLeft || dpadRight) {
                event.preventDefault();

                if (cursorPosition === null && screen === 'Playing' && gameState) {
                    const currentPlanet = gameState.universe.planets.find(p => p.id === gameState.player.currentPlanetId);
                    if (currentPlanet) {
                        setCursorPosition({
                            x: currentPlanet.position.x - viewState.offset.x,
                            y: currentPlanet.position.y - viewState.offset.y
                        });
                    }
                }

                if (screen === 'MainMenu' || screen === 'Options' || screen === 'Paused') {
                    const numItems = focusableItems.current.length;
                    if (numItems > 0) {
                        if (dpadDown) setFocusedItemIndex(prev => (prev + 1) % numItems);
                        if (dpadUp) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                        if (screen === 'Options') {
                           if (dpadRight) setFocusedItemIndex(prev => prev < 2 ? (prev + 1) % 2 : prev);
                           if (dpadLeft) setFocusedItemIndex(prev => prev < 2 ? (prev - 1 + 2) % 2 : prev);
                        }
                    }
                } else if (screen === 'Playing' && gameState) {
                    const numItems = focusableItems.current.length;
                    if (activePanel !== null) {
                         if (numItems > 0) {
                            const isRemotePlanetPanel = activePanel === 'planet' && selectedPlanetId !== null && selectedPlanetId !== gameState.player.currentPlanetId;
                            if (isRemotePlanetPanel || (activePanel === 'planet' && route.length > 0)) {
                                if (dpadRight) setFocusedItemIndex(prev => (prev + 1) % numItems);
                                if (dpadLeft) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                            } else {
                                if (dpadDown) setFocusedItemIndex(prev => (prev + 1) % numItems);
                                if (dpadUp) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                            }
                        }
                    } else if (route.length > 0) {
                        if (numItems > 0) {
                            if (dpadRight) setFocusedItemIndex(prev => (prev + 1) % numItems);
                            if (dpadLeft) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                        }
                    } else { // Star map navigation
                        const allPlanets = gameState.universe.planets;
                        let currentPlanet = hoveredPlanetId !== null ? allPlanets.find(p => p.id === hoveredPlanetId) : allPlanets.find(p => p.id === gameState.player.currentPlanetId);
                        if (currentPlanet) {
                            let direction: 'up' | 'down' | 'left' | 'right' | null = null;
                            if (dpadUp) direction = 'up'; else if (dpadDown) direction = 'down'; else if (dpadLeft) direction = 'left'; else if (dpadRight) direction = 'right';
                            if (direction) {
                                const nextPlanet = findNextPlanet(direction, currentPlanet, allPlanets);
                                if (nextPlanet) {
                                    setHoveredPlanetId(nextPlanet.id);
                                    setCursorPosition({ x: nextPlanet.position.x - viewState.offset.x, y: nextPlanet.position.y - viewState.offset.y });
                                }
                            }
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [screen, activePanel, focusedItemIndex, gameState, hoveredPlanetId, route, handleSelectPlanet, handleClosePanels, handleBackFromOptions, cursorPosition, viewState, handleTogglePause]);

    // Main Game Loop for Controller Input
    useEffect(() => {
        if (gamepadIndex === null) return;
        
        let animationFrameId: number;

        const gameLoop = () => {
            animationFrameId = requestAnimationFrame(gameLoop);
            const gp = navigator.getGamepads()[gamepadIndex];
            if (!gp) return;

            for (let i = 0; i < gp.buttons.length; i++) {
                const state = buttonStates.current[i] || { pressed: false, triggered: false };
                const isPressed = gp.buttons[i].pressed;
                state.triggered = isPressed && !state.pressed;
                state.pressed = isPressed;
                buttonStates.current[i] = state;
            }

            const isButtonTriggered = (index: number): boolean => {
                return buttonStates.current[index]?.triggered || false;
            };
            
            // --- AXES: Cursor Movement (Only in 'Playing' screen) ---
            if (screen === 'Playing' && gameState && activePanel === null) {
                const [axisX, axisY] = [gp.axes[0], gp.axes[1]];
                if (Math.abs(axisX) > GAMEPAD_DEADZONE || Math.abs(axisY) > GAMEPAD_DEADZONE) {
                    setCursorPosition(prevPos => {
                        if (!prevPos) return null;
                        let newX = prevPos.x;
                        let newY = prevPos.y;

                        if (Math.abs(axisX) > GAMEPAD_DEADZONE) newX += axisX * CURSOR_SPEED;
                        if (Math.abs(axisY) > GAMEPAD_DEADZONE) newY += axisY * CURSOR_SPEED;
                        
                        const vbWidth = MAP_SIZE / viewState.zoom;
                        const vbHeight = MAP_SIZE / viewState.zoom;
                        newX = Math.max(-vbWidth / 2, Math.min(vbWidth / 2, newX));
                        newY = Math.max(-vbHeight / 2, Math.min(vbHeight / 2, newY));

                        return { x: newX, y: newY };
                    });
                }
            }

            // --- Find Hovered Planet (Only in 'Playing' screen) ---
            if (screen === 'Playing' && cursorPosition && gameState && activePanel === null) {
                let closestPlanet: Planet | null = null;
                let minDistance = Infinity;

                for (const planet of gameState.universe.planets) {
                    const planetScreenX = planet.position.x - viewState.offset.x;
                    const planetScreenY = planet.position.y - viewState.offset.y;
                    const dist = calculateDistance(cursorPosition, { x: planetScreenX, y: planetScreenY });
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestPlanet = planet;
                    }
                }
                setHoveredPlanetId(minDistance < HOVER_RADIUS ? (closestPlanet?.id ?? null) : null);
            } else if (activePanel !== null) {
                setHoveredPlanetId(null);
            }

            // --- BUTTONS: Actions ---
            if (isButtonTriggered(9)) { // Start/Menu Button
                handleTogglePause();
            }

            if (isButtonTriggered(0)) { // A Button
                if ((screen === 'MainMenu' || screen === 'Options' || screen === 'Paused') && focusableItems.current[focusedItemIndex]) {
                    focusableItems.current[focusedItemIndex]();
                } else if (screen === 'Playing') {
                    if (activePanel !== null && focusableItems.current[focusedItemIndex]) {
                        focusableItems.current[focusedItemIndex]();
                    } else if (activePanel === null && hoveredPlanetId !== null) {
                        handleSelectPlanet(hoveredPlanetId);
                    } else if (activePanel === null && route.length > 0 && focusableItems.current[focusedItemIndex]) {
                        focusableItems.current[focusedItemIndex]();
                    }
                }
            }
            if (isButtonTriggered(1)) { // B Button
                if (screen === 'Options') handleBackFromOptions();
                else if (screen === 'Paused') handleTogglePause();
                else if (screen === 'Playing' && activePanel !== null) handleClosePanels();
            }
            if (isButtonTriggered(3) && screen === 'Playing') { // Y Button
                setActivePanel(p => p === 'manifest' ? null : 'manifest');
            }
            
            // --- D-PAD NAVIGATION ---
            const dpadUp = isButtonTriggered(12);
            const dpadDown = isButtonTriggered(13);
            const dpadLeft = isButtonTriggered(14);
            const dpadRight = isButtonTriggered(15);
            
            if (dpadUp || dpadDown || dpadLeft || dpadRight) {
                if (screen === 'MainMenu' || screen === 'Paused') {
                    const numItems = focusableItems.current.length;
                    if (numItems > 0) {
                        if (dpadDown) setFocusedItemIndex(prev => (prev + 1) % numItems);
                        if (dpadUp) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                    }
                } else if (screen === 'Options') {
                    const numLangs = 2;
                    const backButtonIndex = numLangs;
        
                    if (dpadDown) {
                        setFocusedItemIndex(prev => (prev < numLangs) ? backButtonIndex : 0);
                    }
                    if (dpadUp) {
                        setFocusedItemIndex(prev => (prev === backButtonIndex) ? 0 : backButtonIndex);
                    }
                    if (dpadRight) {
                        setFocusedItemIndex(prev => {
                            if (prev >= numLangs) return prev; // If on back button, do nothing
                            return (prev + 1) % numLangs;
                        });
                    }
                    if (dpadLeft) {
                         setFocusedItemIndex(prev => {
                            if (prev >= numLangs) return prev; // If on back button, do nothing
                            return (prev - 1 + numLangs) % numLangs;
                        });
                    }
                } else if (screen === 'Playing' && gameState) {
                    const numItems = focusableItems.current.length;
                    if (activePanel !== null) { // A panel is open
                        if (numItems > 0) {
                            const isRemotePlanetPanel = activePanel === 'planet' && selectedPlanetId !== null && selectedPlanetId !== gameState.player.currentPlanetId;

                            if (isRemotePlanetPanel) { // Horizontal nav for "Travel Directly" / "Add to Route"
                                if (dpadRight) setFocusedItemIndex(prev => (prev + 1) % numItems);
                                if (dpadLeft) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                            } else { // Vertical nav for docked PlanetPanel, ManifestPanel
                                if (dpadDown) setFocusedItemIndex(prev => (prev + 1) % numItems);
                                if (dpadUp) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                            }
                        }
                    } else if (route.length > 0) { // Route panel is visible
                        if (numItems > 0) { // Horizontal nav for "Continue" / "Clear"
                            if (dpadRight) setFocusedItemIndex(prev => (prev + 1) % numItems);
                            if (dpadLeft) setFocusedItemIndex(prev => (prev - 1 + numItems) % numItems);
                        }
                    } else { // No panels open, navigating star map
                        if (dpadUp || dpadDown || dpadLeft || dpadRight) {
                            const allPlanets = gameState.universe.planets;
                            let currentPlanet = hoveredPlanetId !== null 
                                ? allPlanets.find(p => p.id === hoveredPlanetId) 
                                : allPlanets.find(p => p.id === gameState.player.currentPlanetId);
                            
                            if (currentPlanet) {
                                let direction: 'up' | 'down' | 'left' | 'right' | null = null;
                                if (dpadUp) direction = 'up';
                                else if (dpadDown) direction = 'down';
                                else if (dpadLeft) direction = 'left';
                                else if (dpadRight) direction = 'right';

                                if(direction) {
                                    const nextPlanet = findNextPlanet(direction, currentPlanet, allPlanets);
                                    if (nextPlanet) {
                                        setHoveredPlanetId(nextPlanet.id);
                                        setCursorPosition({
                                            x: nextPlanet.position.x - viewState.offset.x,
                                            y: nextPlanet.position.y - viewState.offset.y
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [gamepadIndex, screen, activePanel, cursorPosition, gameState, viewState, hoveredPlanetId, focusedItemIndex, selectedPlanetId, route, handleSelectPlanet, handleClosePanels, handleNewGame, handleContinueGame, handleBackFromOptions, handleShowOptions, handleTogglePause]);

    useEffect(() => { setFocusedItemIndex(0); }, [activePanel, screen]);

  // Build focusable items list for the current screen/panel
  const selectedPlanet = gameState?.universe.planets.find(p => p.id === selectedPlanetId) ?? null;
  const newFocusableItems: (() => void)[] = [];
  if (screen === 'MainMenu') {
      if(hasSaveData) {
        newFocusableItems.push(handleContinueGame);
      }
      newFocusableItems.push(handleNewGame);
      newFocusableItems.push(() => handleShowOptions('MainMenu'));
  } else if (screen === 'Options') {
      newFocusableItems.push(() => setLanguage('en'));
      newFocusableItems.push(() => setLanguage('pt-br'));
      newFocusableItems.push(handleBackFromOptions);
  } else if (screen === 'Paused') {
      newFocusableItems.push(handleTogglePause); // Resume
      newFocusableItems.push(handleSaveGame);
      newFocusableItems.push(() => handleShowOptions('Paused'));
      newFocusableItems.push(handleExitToMainMenu);
  }
  else if (screen === 'Playing' && gameState) {
      const { player, universe, contracts, ships } = gameState;
      const currentShip = ships.find(s => s.id === player.currentShipId)!;

      // ...
if (activePanel === 'planet' && selectedPlanet) {
    if (selectedPlanet.id !== player.currentPlanetId) {
        newFocusableItems.push(handleTravelDirectly);
        newFocusableItems.push(handleAddToRoute);
    } else {
        // Ação de abastecer (sempre a primeira)
        const currentShipInstance = player.ownedShips.find(s => s.shipId === player.currentShipId);
        const currentFuel = currentShipInstance ? currentShipInstance.fuel : 0;
        const fuelToBuy = currentShip.fuelCapacity - currentFuel;
        const fuelCost = Math.round(fuelToBuy * 1.5);
        newFocusableItems.push(() => handleBuyFuel(fuelToBuy, fuelCost));
        
        // Ações dos Contratos
        const availableContracts = contracts[selectedPlanet.id] || [];
        availableContracts.forEach(c => newFocusableItems.push(() => handleAcceptContract(c)));
        
        // Ações do Shipyard (Condicional)
        if (SHIPYARD_ECONOMIES.includes(selectedPlanet.economy)) {
          const shipsForSaleFiltered = ships.filter(s => !player.ownedShips.some(os => os.shipId === s.id));
          shipsForSaleFiltered.forEach(s => newFocusableItems.push(() => handleBuyShip(s)));
        }
        
        // Ações do Hangar (Sempre verificadas, assim como na UI)
        const ownedShipsFiltered = player.ownedShips.filter(s => s.shipId !== player.currentShipId);
        ownedShipsFiltered.forEach(ownedShip => {
            const shipInfo = ships.find(s => s.id === ownedShip.shipId);
            if (shipInfo) {
                newFocusableItems.push(() => handleSwitchShip(shipInfo.id));
            }
        });
    }
} else if (activePanel === 'manifest') {
          player.cargo.forEach(c => newFocusableItems.push(() => handleCancelContract(c)));
      } else if (route.length > 0) {
          newFocusableItems.push(handleLaunch);
          newFocusableItems.push(() => setRoute([]));
      }
  }
  focusableItems.current = newFocusableItems;


  if (screen === 'MainMenu') {
    return <MainMenu 
      hasSaveData={hasSaveData} 
      onContinueGame={handleContinueGame}
      onNewGame={handleNewGame} 
      onShowOptions={() => handleShowOptions('MainMenu')} 
      focusedIndex={focusedItemIndex} />;
  }

  if (screen === 'Options') {
    return <OptionsPanel onBack={handleBackFromOptions} focusedIndex={focusedItemIndex} />;
  }

  if (screen === 'Loading' || !gameState) {
    return <LoadingOverlay />;
  }

  const { player, universe, contracts, ships } = gameState;
  const currentShip = ships.find(s => s.id === player.currentShipId)!;
  const currentPlanet = universe.planets.find(p => p.id === player.currentPlanetId)!;

  return (
    <div className="w-screen h-screen bg-[#0A192F] text-[#E6F1FF] relative overflow-hidden">
      <StatusBar 
        player={player} 
        ship={currentShip} 
        currentPlanetName={currentPlanet.name}
        onManifestClick={handleToggleManifest}
        onPauseClick={handleTogglePause}
      />
      <StarMap
        planets={universe.planets}
        playerLocation={currentPlanet.position}
        activeContracts={player.cargo}
        route={route}
        selectedPlanetId={selectedPlanetId}
        hoveredPlanetId={hoveredPlanetId}
        contractHoveredPlanetId={contractHoveredPlanetId}
        cursorPosition={cursorPosition}
        onPlanetClick={handleSelectPlanet}
        travelPath={route.length > 0 ? null : travelPath}
        viewState={viewState}
        onViewChange={setViewState}
      />
      
      {travelState?.inTransit && (
        <TravelOverlay from={travelState.fromPlanet.name} to={travelState.toPlanet.name} progress={travelState.progress} />
      )}

      {screen === 'Paused' && (
        <PauseMenu 
            onResume={handleTogglePause}
            onSave={handleSaveGame}
            onShowOptions={() => handleShowOptions('Paused')}
            onExit={handleExitToMainMenu}
            focusedIndex={focusedItemIndex}
        />
      )}

      <PlanetPanel
        planet={selectedPlanet}
        contracts={selectedPlanet ? (contracts[selectedPlanet.id] || []) : []}
        player={player}
        ship={currentShip}
        shipsForSale={ships}
        allPlanets={universe.planets}
        travelPath={travelPath}
        route={route}
        isOpen={activePanel === 'planet'}
        focusedIndex={activePanel === 'planet' ? focusedItemIndex : null}
        onClose={handleClosePanels}
        onAcceptContract={handleAcceptContract}
        onBuyFuel={handleBuyFuel}
        onBuyShip={handleBuyShip}
        onSwitchShip={handleSwitchShip}
        onAddToRoute={handleAddToRoute}
        onTravelDirectly={handleTravelDirectly}
        onContractHover={setContractHoveredPlanetId}
      />

      <ManifestPanel
        contracts={player.cargo}
        planets={universe.planets}
        isOpen={activePanel === 'manifest'}
        focusedIndex={activePanel === 'manifest' ? focusedItemIndex : null}
        onClose={handleClosePanels}
        onCancelContract={handleCancelContract}
      />

      {route.length > 0 && (
        <RoutePanel
            route={route.map(id => universe.planets.find(p => p.id === id)!)}
            isTraveling={!!travelState?.inTransit}
            focusedIndex={activePanel === null ? focusedItemIndex : null}
            onLaunch={handleLaunch}
            onClear={() => setRoute([])}
            onRemoveFromRoute={handleRemoveFromRoute}
        />
      )}
      
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
};

export default App;