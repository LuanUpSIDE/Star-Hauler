
import { Ship, EconomyType, CargoType } from './types.ts';

export const NUM_PLANETS = 12;
export const ORBIT_RADII = [150, 250, 350, 450];
export const GRAVITY_WELL_RADIUS = 80;
export const MAP_SIZE = 1000;
export const MIN_PLANET_SEPARATION = 60;
export const FUEL_COST_PER_UNIT_DISTANCE = 0.1;
export const FUEL_PRICE_PER_UNIT = 1.5;
export const TRAVEL_SPEED_UNITS_PER_SECOND = 100;

// Contract Reward Calculation Modifiers
export const REWARD_DISTANCE_FACTOR = 0.5;
export const REWARD_VALUE_FACTOR = 25;
export const REWARD_DEMAND_MULTIPLIER = 1.6;
export const REWARD_RANDOMNESS_FACTOR = 0.2; // e.g. 0.2 gives a 20% variance

export const PLANET_NAME_PREFIXES = ['Xylo', 'Zeta', 'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Omega', 'Neo', 'Terra', 'Aqua', 'Ignis'];
export const PLANET_NAME_SUFFIXES = [' Prime', ' Minor', ' Major', ' Secundus', ' IV', ' IX', ' Station', ' Point', ' Landing', ' Rock', ' Reach', '`s World'];

export const ECONOMY_TYPES: EconomyType[] = [EconomyType.MINING, EconomyType.INDUSTRIAL, EconomyType.TECH, EconomyType.AGRICULTURAL, EconomyType.REFINERY];

export const CARGO_BASE_VALUES: Record<CargoType, number> = {
    [CargoType.RAW_ORES]: 1,
    [CargoType.FOODSTUFFS]: 1.2,
    [CargoType.INDUSTRIAL_PARTS]: 2.5,
    [CargoType.REFINED_FUEL]: 2.8,
    [CargoType.MEDICAL_SUPPLIES]: 3.5,
    [CargoType.ADVANCED_POLYMERS]: 4.5,
    [CargoType.MICROCHIPS]: 5,
    [CargoType.ROBOTICS]: 6,
    [CargoType.CYBERNETICS]: 7.5,
    [CargoType.LUXURY_GOODS]: 8,
    [CargoType.EXOTIC_GASES]: 9,
};

// Defines what goods each economy type PRODUCES (for contract generation)
export const CARGO_BY_ECONOMY: Record<EconomyType, CargoType[]> = {
    [EconomyType.MINING]: [CargoType.RAW_ORES, CargoType.EXOTIC_GASES],
    [EconomyType.INDUSTRIAL]: [CargoType.INDUSTRIAL_PARTS, CargoType.ADVANCED_POLYMERS],
    [EconomyType.TECH]: [CargoType.MICROCHIPS, CargoType.ROBOTICS, CargoType.CYBERNETICS, CargoType.LUXURY_GOODS],
    [EconomyType.AGRICULTURAL]: [CargoType.FOODSTUFFS, CargoType.MEDICAL_SUPPLIES],
    [EconomyType.REFINERY]: [CargoType.REFINED_FUEL],
};

// Defines what goods each economy type DEMANDS (for reward calculation)
export const CARGO_DEMAND_BY_ECONOMY: Record<EconomyType, CargoType[]> = {
    [EconomyType.MINING]: [CargoType.FOODSTUFFS, CargoType.MEDICAL_SUPPLIES, CargoType.INDUSTRIAL_PARTS],
    [EconomyType.INDUSTRIAL]: [CargoType.RAW_ORES, CargoType.REFINED_FUEL, CargoType.EXOTIC_GASES],
    [EconomyType.TECH]: [CargoType.ADVANCED_POLYMERS, CargoType.INDUSTRIAL_PARTS, CargoType.EXOTIC_GASES],
    [EconomyType.AGRICULTURAL]: [CargoType.INDUSTRIAL_PARTS, CargoType.LUXURY_GOODS, CargoType.ROBOTICS],
    [EconomyType.REFINERY]: [CargoType.RAW_ORES],
};


export const SHIPS: Ship[] = [
    { id: 0, name: 'Starlight Courier', cargoCapacity: 10, fuelCapacity: 100, fuelEfficiency: 1.0, price: 0 },
    { id: 1, name: 'Galactic Hauler', cargoCapacity: 25, fuelCapacity: 150, fuelEfficiency: 0.9, price: 5000 },
    { id: 2, name: 'Star Trader', cargoCapacity: 50, fuelCapacity: 200, fuelEfficiency: 0.8, price: 25000 },
    { id: 3, name: 'Nebula Freighter', cargoCapacity: 100, fuelCapacity: 300, fuelEfficiency: 0.7, price: 100000 },
];

export const INITIAL_PLAYER_CREDITS = 1000;
export const SHIPYARD_ECONOMIES = [EconomyType.INDUSTRIAL, EconomyType.TECH];