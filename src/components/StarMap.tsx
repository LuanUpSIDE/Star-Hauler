import React, { useRef, useState } from 'react';
import { Planet, Point, Contract, TravelPath, ViewState } from '../types.ts';
import { MAP_SIZE, GRAVITY_WELL_RADIUS, ORBIT_RADII } from '../constants.ts';
import { IconZoomIn, IconZoomOut, IconResetView } from './Icons.tsx';
import { useLanguage } from '../contexts/LanguageContext.tsx';

interface StarMapProps {
  planets: Planet[];
  playerLocation: Point;
  activeContracts: Contract[];
  route: number[];
  selectedPlanetId: number | null;
  hoveredPlanetId: number | null;
  contractHoveredPlanetId: number | null;
  cursorPosition: Point | null;
  onPlanetClick: (id: number) => void;
  travelPath: TravelPath | null;
  viewState: ViewState;
  onViewChange: (viewState: ViewState) => void;
}

const StarMap: React.FC<StarMapProps> = ({ planets, playerLocation, activeContracts, route, selectedPlanetId, hoveredPlanetId, contractHoveredPlanetId, cursorPosition, onPlanetClick, travelPath, viewState, onViewChange }) => {
  const { t } = useLanguage();
  const mapRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent panning when clicking on UI controls
    if ((e.target as HTMLElement).closest('.starmap-controls')) {
      return;
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    onViewChange({
      zoom: viewState.zoom,
      offset: {
        x: viewState.offset.x - (dx / viewState.zoom),
        y: viewState.offset.y - (dy / viewState.zoom)
      }
    });
    setPanStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!mapRef.current) return;

    const mapRect = mapRef.current.getBoundingClientRect();
    const mouseX = e.clientX - mapRect.left;
    const mouseY = e.clientY - mapRect.top;

    const oldZoom = viewState.zoom;
    const vbWidth = MAP_SIZE / oldZoom;
    const vbHeight = MAP_SIZE / oldZoom;
    const vbX = viewState.offset.x - vbWidth / 2;
    const vbY = viewState.offset.y - vbHeight / 2;
    
    const svgX = vbX + (mouseX / mapRect.width) * vbWidth;
    const svgY = vbY + (mouseY / mapRect.height) * vbHeight;

    const zoomFactor = 1.15;
    const newZoom = e.deltaY < 0 ? oldZoom * zoomFactor : oldZoom / zoomFactor;
    const clampedZoom = Math.max(0.4, Math.min(newZoom, 8));

    const newVbWidth = MAP_SIZE / clampedZoom;
    const newVbHeight = MAP_SIZE / clampedZoom;
    const newVbX = svgX - (mouseX / mapRect.width) * newVbWidth;
    const newVbY = svgY - (mouseY / mapRect.height) * newVbHeight;

    onViewChange({
      zoom: clampedZoom,
      offset: {
        x: newVbX + newVbWidth / 2,
        y: newVbY + newVbHeight / 2,
      }
    });
  };
  
  const handleResetView = () => {
    onViewChange({ zoom: 1, offset: { x: 0, y: 0 } });
  };
  
  const handleZoom = (direction: 'in' | 'out') => {
      const zoomFactor = 1.4;
      const newZoom = direction === 'in' ? viewState.zoom * zoomFactor : viewState.zoom / zoomFactor;
      const clampedZoom = Math.max(0.4, Math.min(newZoom, 8));
      // Zoom to center
      onViewChange({ ...viewState, zoom: clampedZoom });
  };
  
  const destinationPlanetIds = new Set(activeContracts.map(c => c.destinationPlanetId));

  const routePoints = route.length > 0
    ? [ playerLocation, ...route.map(id => planets.find(p => p.id === id)?.position).filter((p): p is Point => p !== undefined) ]
    : [];

  const viewBox = `${viewState.offset.x - (MAP_SIZE / viewState.zoom / 2)} ${viewState.offset.y - (MAP_SIZE / viewState.zoom / 2)} ${MAP_SIZE / viewState.zoom} ${MAP_SIZE / viewState.zoom}`;

  return (
    <div 
      ref={mapRef}
      className="w-full h-full bg-transparent cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
    >
      <svg viewBox={viewBox} className="w-full h-full">
        <defs>
            <filter id="sun-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="15" result="coloredBlur"/>
                <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                </feMerge>
            </filter>
        </defs>

        {/* Sun */}
        <circle cx="0" cy="0" r="40" fill="#FFD700" filter="url(#sun-glow)" className="animate-[pulse_4s_ease-in-out_infinite]" />
        <circle cx="0" cy="0" r={GRAVITY_WELL_RADIUS} fill="rgba(255,122,0,0.1)" stroke="rgba(255,122,0,0.3)" strokeWidth="1" strokeDasharray="4 4" />

        {/* Orbits */}
        {ORBIT_RADII.map(radius => (
          <circle key={radius} cx="0" cy="0" r={radius} fill="none" stroke="#00F6FF" strokeOpacity="0.1" strokeWidth="1" />
        ))}

        {/* Route Path */}
        {routePoints.length > 1 && (
            <polyline
                points={routePoints.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#00F6FF"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                strokeOpacity="0.7"
            />
        )}

        {/* Travel Path */}
        {travelPath && (
          <path
            d={travelPath.path}
            fill="none"
            stroke={travelPath.curved ? '#FF7A00' : '#00F6FF'}
            strokeWidth="2"
            strokeDasharray="5,5"
            strokeOpacity="0.8"
            className="animate-[dash_1s_linear_infinite]"
          />
        )}
        <style>
            {`@keyframes dash { to { stroke-dashoffset: -20; } }`}
        </style>

        {/* Planets */}
        {planets.map(planet => {
          const isSelected = planet.id === selectedPlanetId;
          const isHovered = planet.id === hoveredPlanetId;
          const isContractHovered = planet.id === contractHoveredPlanetId;
          const isDestination = destinationPlanetIds.has(planet.id);
          const isInRoute = route.includes(planet.id);
          const isFirstInRoute = route.length > 0 && route[0] === planet.id;

          return (
            <g
              key={planet.id}
              transform={`translate(${planet.position.x}, ${planet.position.y})`}
              onClick={() => onPlanetClick(planet.id)}
              onMouseDown={(e) => e.stopPropagation()} // Prevent map pan when clicking on a planet
              className="cursor-pointer group"
            >
              {isContractHovered && (
                 <circle r="16" fill="none" stroke="#FFD700" strokeWidth="2.5" className="animate-pulse" />
              )}
              {isHovered && !isSelected && (
                  <circle r="14" fill="none" stroke="#FF7A00" strokeWidth="2" className="animate-pulse" />
              )}
              {isDestination && !isSelected && (
                <circle r="18" fill="none" stroke="#39FF14" strokeWidth="2" strokeDasharray="3 3">
                  <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite" />
                </circle>
              )}
               {isInRoute && (
                <circle r="18" fill="none" stroke="#00F6FF" strokeWidth={isFirstInRoute ? "3" : "1"} />
              )}
              <circle r="10" fill={isSelected ? '#00F6FF' : '#1E40AF'} stroke={isHovered ? "#FF7A00" : "#00F6FF"} strokeWidth={isSelected || isHovered ? '2' : '1'} className="transition-all duration-300 group-hover:r-12 group-hover:fill-[#00F6FF]" />
              <text x="15" y="5" fill="#E6F1FF" fontSize="12" className="pointer-events-none transition-all duration-300 opacity-0 group-hover:opacity-100">{planet.name}</text>
            </g>
          );
        })}

        {/* Player Ship */}
        <g transform={`translate(${playerLocation.x}, ${playerLocation.y})`} className="pointer-events-none">
            <path d="M0 -10 L6 6 L0 3 L-6 6 Z" fill="#FF7A00" stroke="#FFFFFF" strokeWidth="1"/>
            <circle cx="0" cy="0" r="15" fill="none" stroke="#FF7A00" strokeWidth="1" strokeOpacity="0.8" className="animate-ping" />
        </g>

        {/* Controller Cursor */}
        {cursorPosition && (
            <g transform={`translate(${cursorPosition.x}, ${cursorPosition.y})`} className="pointer-events-none">
                <path d="M-10 0 L10 0 M0 -10 L0 10" stroke="#FF7A00" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="4" fill="none" stroke="#FF7A00" strokeWidth="1.5" />
            </g>
        )}
      </svg>
      <div className="starmap-controls absolute bottom-4 right-4 flex flex-col gap-2 z-10">
        <button onClick={() => handleZoom('in')} className="w-10 h-10 bg-gray-800/50 border border-cyan-400/30 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all" aria-label={t('starmap.zoom_in')}>
          <IconZoomIn />
        </button>
        <button onClick={() => handleZoom('out')} className="w-10 h-10 bg-gray-800/50 border border-cyan-400/30 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all" aria-label={t('starmap.zoom_out')}>
          <IconZoomOut />
        </button>
        <button onClick={handleResetView} className="w-10 h-10 bg-gray-800/50 border border-cyan-400/30 rounded-full flex items-center justify-center text-cyan-400 hover:bg-cyan-500/20 hover:neon-glow-cyan transition-all" aria-label={t('starmap.reset_view')}>
          <IconResetView />
        </button>
      </div>
    </div>
  );
};

export default StarMap;