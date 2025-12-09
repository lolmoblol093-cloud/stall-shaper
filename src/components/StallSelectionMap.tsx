import React, { useState, useEffect, useRef } from 'react';
import './DirectoryMap.css';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import groundFloorSvg from '@/assets/ground-floor.svg';
import secondFloorSvg from '@/assets/second-floor.svg';
import thirdFloorSvg from '@/assets/third-floor.svg';
import {
  mockStalls,
  mockTenants,
  Stall,
} from '@/data/mockData';

interface StallSelectionMapProps {
  selectedStallCode: string | null;
  onStallSelect: (stallCode: string, stallData: Stall) => void;
  refreshTrigger?: number;
  allowOccupiedSelection?: boolean;
}

export function StallSelectionMap({ selectedStallCode, onStallSelect, refreshTrigger, allowOccupiedSelection = false }: StallSelectionMapProps) {
  const [stallsData, setStallsData] = useState<Stall[]>(mockStalls);
  const [currentFloor, setCurrentFloor] = useState<'ground' | 'second' | 'third'>('ground');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setStallsData([...mockStalls]);
  }, [refreshTrigger]);

  const handleBoothClick = (id: string) => {
    const stall = stallsData.find(s => s.stall_code === id);
    if (stall) {
      if (stall.occupancy_status === 'vacant' || allowOccupiedSelection) {
        onStallSelect(id, stall);
      }
    }
  };

  const getStallColor = (stallCode: string): string => {
    const stall = stallsData.find(s => s.stall_code === stallCode);
    if (!stall) return '#22c55e';
    
    const isSelected = selectedStallCode === stallCode;
    if (isSelected) return '#3b82f6';
    
    return stall.occupancy_status === 'occupied' ? '#ef4444' : '#22c55e';
  };

  const isPointInPolygon = (x: number, y: number, coords: number[]): boolean => {
    let inside = false;
    const points = [];
    for (let i = 0; i < coords.length; i += 2) {
      points.push({ x: coords[i], y: coords[i + 1] });
    }
    
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i].x, yi = points[i].y;
      const xj = points[j].x, yj = points[j].y;
      
      const intersect = ((yi > y) !== (yj > y))
        && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  };

  const groundFloorStallIds = [
    'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10',
    'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18', 'b19', 'b20',
    'b21', 'b22', 'b23', 'b24', 'b25', 'b26', 'b27', 'b28', 'b29', 'b30',
    'b31', 'b32', 'b33', 'b34', 'b35', 'b36', 'b37', 'b38', 'b39', 'b40',
    'b41', 'b42', 'b43', 'b44', 'b45', 'b46', 'b47', 'b48', 'b49', 'b50',
    'b51', 'b52', 'b53', 'b54', 'b55', 'b56', 'b57', 'b58', 'b59', 'b60',
    'b61', 'b62', 'b63', 'b64', 'b65', 'b66', 'b67', 'b68', 'b69', 'b70',
    'b71', 'b72', 'b73', 'b74', 'b75', 'b76', 'b77', 'b78', 'b79', 'b80',
    'b81', 'b82', 'b83', 'b84', 'b85', 'b86'
  ];

  const groundFloorAreas = [
    { coords: [38,166,56,191], type: 'rect' },
    { coords: [58,166,77,191], type: 'rect' },
    { coords: [38,191,58,218], type: 'rect' },
    { coords: [58,191,76,218], type: 'rect' },
    { coords: [38,218,58,245], type: 'rect' },
    { coords: [59,218,76,245], type: 'rect' },
    { coords: [9,115,34,139], type: 'rect' },
    { coords: [34,115,61,139], type: 'rect' },
    { coords: [61,115,81,139], type: 'rect' },
    { coords: [117,218,137,243], type: 'rect' },
    { coords: [137,218,155,245], type: 'rect' },
    { coords: [117,193,137,218], type: 'rect' },
    { coords: [137,193,156,218], type: 'rect' },
    { coords: [117,168,138,193], type: 'rect' },
    { coords: [138,168,157,193], type: 'rect' },
    { coords: [100,115,117,139], type: 'rect' },
    { coords: [117,115,139,139], type: 'rect' },
    { coords: [139,115,159,139], type: 'rect' },
    { coords: [159,115,181,139], type: 'rect' },
    { coords: [181,115,202,139], type: 'rect' },
  ];

  return (
    <div className="directory-map-container">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Select a Stall from the Map</h3>
        <p className="text-sm text-muted-foreground">
          {allowOccupiedSelection 
            ? "Click on any stall to view or edit its details" 
            : "Click on an available (green) stall to select it"}
        </p>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span className="text-sm">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span className="text-sm">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span className="text-sm">Selected</span>
        </div>
      </div>
      
      <Tabs value={currentFloor} onValueChange={(v) => setCurrentFloor(v as 'ground' | 'second' | 'third')} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="ground">Ground Floor</TabsTrigger>
          <TabsTrigger value="second">Second Floor</TabsTrigger>
          <TabsTrigger value="third">Third Floor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ground">
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="relative">
              <img 
                src={groundFloorSvg} 
                alt="Ground Floor Map" 
                className="w-full h-auto border border-border rounded-lg"
              />
              <svg 
                className="absolute inset-0 w-full h-auto cursor-pointer"
                viewBox="0 0 850 491"
                preserveAspectRatio="xMidYMid meet"
              >
                {groundFloorAreas.slice(0, groundFloorStallIds.length).map((area, index) => {
                  const stallId = groundFloorStallIds[index];
                  const color = getStallColor(stallId);
                  
                  if (area.type === 'rect' && area.coords.length >= 4) {
                    const [x1, y1, x2, y2] = area.coords;
                    return (
                      <rect
                        key={stallId}
                        x={x1}
                        y={y1}
                        width={x2 - x1}
                        height={y2 - y1}
                        fill={color}
                        fillOpacity={0.6}
                        stroke={selectedStallCode === stallId ? '#3b82f6' : color}
                        strokeWidth={selectedStallCode === stallId ? 3 : 1}
                        className="cursor-pointer hover:fill-opacity-80 transition-all pointer-events-auto"
                        onClick={() => handleBoothClick(stallId)}
                      />
                    );
                  }
                  return null;
                })}
              </svg>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="second">
          <div className="relative w-full max-w-4xl mx-auto">
            <img 
              ref={imageRef}
              src={secondFloorSvg} 
              alt="Second Floor Map" 
              className="w-full h-auto border border-border rounded-lg"
            />
            <p className="text-center text-muted-foreground mt-4">
              Second floor stalls: Super Market, c1-c19
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="third">
          <div className="relative w-full max-w-4xl mx-auto">
            <img 
              src={thirdFloorSvg} 
              alt="Third Floor Map" 
              className="w-full h-auto border border-border rounded-lg"
            />
            <p className="text-center text-muted-foreground mt-4">
              Third floor stalls: d1-d54
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
