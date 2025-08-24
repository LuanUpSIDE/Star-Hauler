

import { GameState, PlayerState, Planet, EconomyType, CargoType, Ship, Point, Contract, TravelPath } from '../types.ts';
import {
  NUM_PLANETS,
  ORBIT_RADII,
  PLANET_NAME_PREFIXES,
  PLANET_NAME_SUFFIXES,
  ECONOMY_TYPES,
  CARGO_BY_ECONOMY,
  SHIPS,
  INITIAL_PLAYER_CREDITS,
  GRAVITY_WELL_RADIUS,
  CARGO_BASE_VALUES,
  CARGO_DEMAND_BY_ECONOMY,
  REWARD_DEMAND_MULTIPLIER,
  REWARD_DISTANCE_FACTOR,
  REWARD_RANDOMNESS_FACTOR,
  REWARD_VALUE_FACTOR,
  MIN_PLANET_SEPARATION
} from '../constants.ts';

const getRandomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateUniverse = (): Planet[] => {
  const planets: Planet[] = [];
  const usedNames = new Set<string>();

  // Assign planets to orbits to ensure even distribution across orbital lines.
  const orbitAssignments: number[] = [];
  for (let i = 0; i < NUM_PLANETS; i++) {
    orbitAssignments.push(ORBIT_RADII[i % ORBIT_RADII.length]);
  }

  for (let i = 0; i < NUM_PLANETS; i++) {
    let name;
    do {
      name = `${getRandomItem(PLANET_NAME_PREFIXES)}${getRandomItem(PLANET_NAME_SUFFIXES)}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const orbitRadius = orbitAssignments[i];
    
    let position: Point;
    let positionIsValid = false;
    let attempts = 0;
    const MAX_PLACEMENT_ATTEMPTS = 50;

    // Try to find a position that is not too close to other planets
    do {
      const angle = Math.random() * 2 * Math.PI;
      position = {
        x: Math.cos(angle) * orbitRadius,
        y: Math.sin(angle) * orbitRadius,
      };

      positionIsValid = true;
      for (const placedPlanet of planets) {
        if (calculateDistance(position, placedPlanet.position) < MIN_PLANET_SEPARATION) {
          positionIsValid = false;
          break;
        }
      }
      attempts++;
    } while (!positionIsValid && attempts < MAX_PLACEMENT_ATTEMPTS);
    
    if (!positionIsValid) {
        console.warn(`Could not find a valid position for planet ${name} after ${MAX_PLACEMENT_ATTEMPTS} attempts.`);
    }

    const economy = getRandomItem(ECONOMY_TYPES);
    const descIndex = Math.floor(Math.random() * 3) + 1;
    const descriptionKey = `${economy.toLowerCase()}_desc_${descIndex}`;

    planets.push({ id: i, name, economy, position, orbitRadius, descriptionKey });
  }
  return planets;
};

export const generateContracts = (currentPlanet: Planet, allPlanets: Planet[], currentShipCapacity: number): Contract[] => {
  const contracts: Contract[] = [];
  const availableCargo = CARGO_BY_ECONOMY[currentPlanet.economy];
  if (!availableCargo) return [];

  const numContracts = Math.floor(Math.random() * 5) + 3; // Always generate 3-7 contracts
  const MAX_CARGO_QUANTITY = 120;

  for (let i = 0; i < numContracts; i++) {
    const destinationPlanet = getRandomItem(allPlanets.filter(p => p.id !== currentPlanet.id));
    const cargoType = getRandomItem(availableCargo);
    
    let quantity: number;
    // ~70% of contracts are scaled to the player's current ship capacity
    if (Math.random() < 0.7) {
        quantity = Math.floor(Math.random() * currentShipCapacity) + 1;
    } else {
    // ~30% are larger contracts to encourage upgrades
        const minQuantity = currentShipCapacity + 1;
        const maxQuantity = MAX_CARGO_QUANTITY;
        if (minQuantity >= maxQuantity) {
             quantity = maxQuantity;
        } else {
            quantity = Math.floor(Math.random() * (maxQuantity - minQuantity)) + minQuantity;
        }
    }
    quantity = Math.max(1, quantity); // Ensure quantity is at least 1


    const distance = calculateDistance(currentPlanet.position, destinationPlanet.position);
    const cargoValue = CARGO_BASE_VALUES[cargoType];

    // Determine if the destination planet has a high demand for this cargo
    const destinationDemands = CARGO_DEMAND_BY_ECONOMY[destinationPlanet.economy] || [];
    const isDemanded = destinationDemands.includes(cargoType);
    const demandMultiplier = isDemanded ? REWARD_DEMAND_MULTIPLIER : 1.0;
    
    // Calculate reward based on distance, value, and demand
    const baseReward = (distance * REWARD_DISTANCE_FACTOR) + (quantity * cargoValue * REWARD_VALUE_FACTOR);
    const reward = Math.round(baseReward * demandMultiplier * (1 + (Math.random() * REWARD_RANDOMNESS_FACTOR)));
    const penalty = Math.round(reward * 0.25);

    contracts.push({
      id: `${Date.now()}-${i}`,
      originPlanetId: currentPlanet.id,
      destinationPlanetId: destinationPlanet.id,
      cargo: cargoType,
      quantity,
      reward,
      penalty,
    });
  }

  return contracts;
};

export const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const calculateTravelPath = (startPos: Point, endPos: Point): TravelPath => {
    const sunPos = { x: 0, y: 0 };
    const dx = endPos.x - startPos.x;
    const dy = endPos.y - startPos.y;
    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (startPos.x - sunPos.x) + dy * (startPos.y - sunPos.y));
    const c = (startPos.x - sunPos.x) ** 2 + (startPos.y - sunPos.y) ** 2 - GRAVITY_WELL_RADIUS ** 2;
    const delta = b * b - 4 * a * c;

    let curved = false;
    if (delta >= 0) {
        const t1 = (-b + Math.sqrt(delta)) / (2 * a);
        const t2 = (-b - Math.sqrt(delta)) / (2 * a);
        if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
            curved = true;
        }
    }
    
    let pathString: string;
    let distance = calculateDistance(startPos, endPos);

    if (curved) {
        const midX = (startPos.x + endPos.x) / 2;
        const midY = (startPos.y + endPos.y) / 2;
        const distToSun = calculateDistance({x: midX, y: midY}, sunPos);
        const normX = midX / distToSun;
        const normY = midY / distToSun;

        const controlPoint = {
            x: midX - normX * GRAVITY_WELL_RADIUS * 1.5,
            y: midY - normY * GRAVITY_WELL_RADIUS * 1.5
        };
        
        pathString = `M ${startPos.x} ${startPos.y} Q ${controlPoint.x} ${controlPoint.y} ${endPos.x} ${endPos.y}`;
        // Approximate curved distance
        distance = calculateDistance(startPos, controlPoint) + calculateDistance(controlPoint, endPos);
    } else {
        pathString = `M ${startPos.x} ${startPos.y} L ${endPos.x} ${endPos.y}`;
    }

    return { path: pathString, distance, curved };
};


export const initializeGame = (): GameState => {
  const universe = { planets: generateUniverse() };
  const startingPlanet = universe.planets[0];
  const startingShip = SHIPS[0];
  
  const player: PlayerState = {
    credits: INITIAL_PLAYER_CREDITS,
    currentShipId: startingShip.id,
    ownedShips: [{ shipId: startingShip.id, fuel: startingShip.fuelCapacity }],
    currentPlanetId: startingPlanet.id,
    cargo: [],
  };

  const initialContracts = generateContracts(startingPlanet, universe.planets, startingShip.cargoCapacity);

  return {
    player,
    universe,
    contracts: {
      [startingPlanet.id]: initialContracts,
    },
    ships: SHIPS,
  };
};