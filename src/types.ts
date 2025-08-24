

export enum EconomyType {
  MINING = 'Mining',
  INDUSTRIAL = 'Industrial',
  TECH = 'Technological',
  AGRICULTURAL = 'Agricultural',
  REFINERY = 'Refinery',
}

export enum CargoType {
  // Low value
  RAW_ORES = 'Raw Ores',
  FOODSTUFFS = 'Foodstuffs',
  // Mid value
  INDUSTRIAL_PARTS = 'Industrial Parts',
  REFINED_FUEL = 'Refined Fuel',
  MEDICAL_SUPPLIES = 'Medical Supplies',
  // High value
  ADVANCED_POLYMERS = 'Adv. Polymers',
  MICROCHIPS = 'Microchips',
  ROBOTICS = 'Robotics',
  // Premium value
  CYBERNETICS = 'Cybernetics',
  LUXURY_GOODS = 'Luxury Goods',
  EXOTIC_GASES = 'Exotic Gases',
}


export interface Point {
  x: number;
  y: number;
}

export interface Planet {
  id: number;
  name: string;
  economy: EconomyType;
  position: Point;
  orbitRadius: number;
  descriptionKey: string;
}

export interface Ship {
  id: number;
  name: string;
  cargoCapacity: number;
  fuelCapacity: number;
  fuelEfficiency: number; // lower is better
  price: number;
}

export interface Contract {
  id: string;
  originPlanetId: number;
  destinationPlanetId: number;
  cargo: CargoType;
  quantity: number;
  reward: number;
  penalty: number;
}

export interface PlayerShip {
  shipId: number;
  fuel: number;
}

export interface PlayerState {
  credits: number;
  currentShipId: number;
  ownedShips: PlayerShip[];
  currentPlanetId: number;
  cargo: Contract[];
}

export interface GameState {
  player: PlayerState;
  universe: {
    planets: Planet[];
  };
  contracts: Record<number, Contract[]>; // planetId -> contracts
  ships: Ship[];
}

export interface TravelPath {
  path: string;
  distance: number;
  curved: boolean;
}

export interface ViewState {
  zoom: number;
  offset: Point;
}