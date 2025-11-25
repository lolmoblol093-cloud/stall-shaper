import React, { useState, useEffect, useRef } from 'react';
import './DirectoryMap.css';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import secondFloorSvg from '@/assets/second-floor.svg';

interface Booth {
  id: string;
  status: 'available' | 'occupied';
}

interface StallData {
  id: string;
  stall_code: string;
  floor: string;
  monthly_rent: number;
  occupancy_status: string;
  floor_size: string | null;
}

const initialBoothData: Booth[] = [
  { id: 'b1', status: 'available' },
  { id: 'b2', status: 'occupied' },
  { id: 'b3', status: 'available' },
  { id: 'b4', status: 'available' },
  { id: 'b5', status: 'available' },
  { id: 'b6', status: 'occupied' },
  { id: 'b7', status: 'available' },
  { id: 'b8', status: 'available' },
  { id: 'b9', status: 'occupied' },
  { id: 'b10', status: 'available' },
  { id: 'b12', status: 'available' },
  { id: 'b13', status: 'occupied' },
  { id: 'b14', status: 'available' },
  { id: 'b15', status: 'available' },
  { id: 'b16', status: 'available' },
  { id: 'b17', status: 'occupied' },
  { id: 'b18', status: 'available' },
  { id: 'b19', status: 'available' },
  { id: 'b20', status: 'available' },
  { id: 'b21', status: 'available' },
  { id: 'b22', status: 'occupied' },
  { id: 'b23', status: 'available' },
  { id: 'b24', status: 'available' },
  { id: 'b25', status: 'occupied' },
  { id: 'b26', status: 'available' },
  { id: 'b27', status: 'available' },
  { id: 'b28', status: 'occupied' },
  { id: 'b29', status: 'available' },
  { id: 'b30', status: 'available' },
  { id: 'b31', status: 'available' },
  { id: 'b32', status: 'occupied' },
  { id: 'b33', status: 'available' },
  { id: 'b34', status: 'available' },
  { id: 'b35', status: 'available' },
  { id: 'b36', status: 'occupied' },
  { id: 'b37', status: 'available' },
  { id: 'b38', status: 'available' },
  { id: 'b39', status: 'available' },
  { id: 'b40', status: 'available' },
  { id: 'b41', status: 'occupied' },
  { id: 'b42', status: 'available' },
  { id: 'b43', status: 'available' },
  { id: 'b44', status: 'occupied' },
  { id: 'b45', status: 'available' },
  { id: 'b46', status: 'available' },
  { id: 'b47', status: 'available' },
  { id: 'b48', status: 'available' },
  { id: 'b49', status: 'occupied' },
  { id: 'b50', status: 'available' },
  { id: 'b51', status: 'available' },
  { id: 'b52', status: 'available' },
  { id: 'b53', status: 'occupied' },
  { id: 'b54', status: 'available' },
  { id: 'b55', status: 'available' },
  { id: 'b56', status: 'occupied' },
  { id: 'b57', status: 'available' },
  { id: 'b58', status: 'available' },
  { id: 'b59', status: 'available' },
  { id: 'b60', status: 'occupied' },
  { id: 'b61', status: 'available' },
  { id: 'b62', status: 'available' },
  { id: 'b63', status: 'available' },
  { id: 'b64', status: 'occupied' },
  { id: 'b65', status: 'available' },
  { id: 'b66', status: 'available' },
  { id: 'b67', status: 'occupied' },
  { id: 'b68', status: 'available' },
  { id: 'b70', status: 'available' },
  { id: 'b71', status: 'occupied' },
  { id: 'b72', status: 'available' },
  { id: 'b73', status: 'available' },
  { id: 'b74', status: 'occupied' },
  { id: 'b75', status: 'available' },
];

interface BoothProps {
  id: string;
  status: 'available' | 'occupied';
  onClick: () => void;
  isSelected: boolean;
  isDisabled: boolean;
}

function Booth({ id, status, onClick, isSelected, isDisabled }: BoothProps) {
  const statusClass = status === 'available' ? 'is-available' : 'is-occupied';

  return (
    <div
      className={`booth ${statusClass} ${isSelected ? 'is-highlighted' : ''} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      id={id}
      onClick={!isDisabled ? onClick : undefined}
    >
      {id}
    </div>
  );
}

interface StallSelectionMapProps {
  selectedStallCode: string | null;
  onStallSelect: (stallCode: string, stallData: StallData) => void;
  refreshTrigger?: number;
  allowOccupiedSelection?: boolean;
}

export function StallSelectionMap({ selectedStallCode, onStallSelect, refreshTrigger, allowOccupiedSelection = false }: StallSelectionMapProps) {
  const [booths, setBooths] = useState(initialBoothData);
  const [stallsData, setStallsData] = useState<StallData[]>([]);
  const [currentFloor, setCurrentFloor] = useState<'ground' | 'second'>('ground');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetchStalls();
    
    // Set up real-time subscriptions
    const channel = supabase
      .channel('stall-selection-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stalls' }, () => {
        fetchStalls();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tenants' }, () => {
        fetchStalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshTrigger]);

  const fetchStalls = async () => {
    const { data: stallsData, error: stallsError } = await supabase
      .from('stalls')
      .select('*');
    
    if (stallsError) {
      console.error('Error fetching stalls:', stallsError);
      return;
    }

    const { data: tenantsData, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .eq('status', 'active');
    
    if (tenantsError) {
      console.error('Error fetching tenants:', tenantsError);
      return;
    }
    
    if (stallsData) {
      setStallsData(stallsData);
      
      setBooths(currentBooths =>
        currentBooths.map(booth => {
          const stall = stallsData.find(s => s.stall_code === booth.id);
          if (!stall) {
            return { ...booth, status: 'available' };
          }
          
          const tenant = tenantsData?.find(t => t.stall_number === booth.id);
          const isOccupied = stall.occupancy_status === 'occupied' || tenant !== undefined;
          
          return {
            ...booth,
            status: isOccupied ? 'occupied' : 'available'
          };
        })
      );
    }
  };

  const handleBoothClick = (id: string) => {
    const stall = stallsData.find(s => s.stall_code === id);
    if (stall) {
      // Allow selection if stall is vacant OR if we allow occupied selection
      if (stall.occupancy_status === 'vacant' || allowOccupiedSelection) {
        onStallSelect(id, stall);
      }
    }
  };

  const handleImageMapClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Scale coordinates to original image dimensions
    const scaleX = 843 / rect.width;
    const scaleY = 487 / rect.height;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    // Find matching stall from database for second floor
    const secondFloorStalls = stallsData.filter(s => s.floor === 'Second Floor');
    
    // Check each area coordinate to see if click is inside
    const areas = [
      { coords: [271,7,271,55,321,57,321,262,267,316,26,318,26,271,3,271,3,10], type: 'poly' },
      { coords: [324,261,268,318,343,318,360,297], type: 'poly' },
      { coords: [436,412,457,391,360,298,344,315], type: 'poly' },
      { coords: [551,265,442,265,429,250,408,269,424,283,483,284,522,323,551,323], type: 'poly' },
      { coords: [837,395,780,395,747,427,750,473,837,473], type: 'poly' },
      { coords: [579,290,804,351], type: 'rect' },
      { coords: [617,430,687,475], type: 'rect' },
      { coords: [353,54,378,183], type: 'rect' },
      { coords: [556,375,572,391], type: 'rect' },
      { coords: [572,376,590,393], type: 'rect' },
      { coords: [556,391,572,409], type: 'rect' },
      { coords: [572,394,590,409], type: 'rect' },
      { coords: [612,375,631,391], type: 'rect' },
      { coords: [612,393,629,409], type: 'rect' },
      { coords: [631,391,649,409], type: 'rect' },
      { coords: [631,375,649,390], type: 'rect' },
      { coords: [649,391,665,408], type: 'rect' },
      { coords: [649,376,665,391], type: 'rect' },
      { coords: [667,393,683,408], type: 'rect' },
      { coords: [667,375,683,391], type: 'rect' },
    ];
    
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      if (area.type === 'rect' && area.coords.length >= 4) {
        const [x1, y1, x2, y2] = area.coords;
        if (scaledX >= x1 && scaledX <= x2 && scaledY >= y1 && scaledY <= y2) {
          // Found matching area, get stall by index
          if (secondFloorStalls[i]) {
            handleBoothClick(secondFloorStalls[i].stall_code);
          }
          return;
        }
      } else if (area.type === 'poly') {
        // Point-in-polygon test
        if (isPointInPolygon(scaledX, scaledY, area.coords)) {
          if (secondFloorStalls[i]) {
            handleBoothClick(secondFloorStalls[i].stall_code);
          }
          return;
        }
      }
    }
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
      
      <Tabs value={currentFloor} onValueChange={(v) => setCurrentFloor(v as 'ground' | 'second')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="ground">Ground Floor</TabsTrigger>
          <TabsTrigger value="second">Second Floor</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ground">
          <div className="directory-map">
            {booths.map((booth) => (
              <Booth
                key={booth.id}
                id={booth.id}
                status={booth.status}
                onClick={() => handleBoothClick(booth.id)}
                isSelected={selectedStallCode === booth.id}
                isDisabled={allowOccupiedSelection ? false : booth.status === 'occupied'}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="second">
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="relative">
              <img 
                ref={imageRef}
                src={secondFloorSvg} 
                alt="Second Floor Map" 
                className="w-full h-auto border border-border rounded-lg"
              />
              <svg 
                className="absolute inset-0 w-full h-auto cursor-pointer pointer-events-none"
                viewBox="0 0 843 487"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Render colored overlays for each stall area */}
                {(() => {
                  const secondFloorStalls = stallsData.filter(s => s.floor === 'Second Floor');
                  
                  // Map area coordinates to their IDs from the floor plan
                  const stallIdMap = [
                    'Super Market',  // 0 - large poly on left
                    'c18',           // 1 - poly below Super Market
                    'c17',           // 2 - poly diagonal
                    'c16',           // 3 - poly middle
                    'c1',            // 4 - poly right side
                    'c15',           // 5 - large rect
                    'c2',            // 6 - rect bottom middle
                    'c19',           // 7 - rect left tall
                    'c12',           // 8 - small rect
                    'c11',           // 9 - small rect
                    'c13',           // 10 - small rect
                    'c14',           // 11 - small rect
                    'c10',           // 12 - small rect
                    'c6',            // 13 - small rect
                    'c5',            // 14 - small rect
                    'c9',            // 15 - small rect
                    'c4',            // 16 - small rect
                    'c8',            // 17 - small rect
                    'c3',            // 18 - small rect
                    'c7',            // 19 - small rect
                  ];
                  
                  const areas = [
                    { coords: [271,7,271,55,321,57,321,262,267,316,26,318,26,271,3,271,3,10], type: 'poly' },
                    { coords: [324,261,268,318,343,318,360,297], type: 'poly' },
                    { coords: [436,412,457,391,360,298,344,315], type: 'poly' },
                    { coords: [551,265,442,265,429,250,408,269,424,283,483,284,522,323,551,323], type: 'poly' },
                    { coords: [837,395,780,395,747,427,750,473,837,473], type: 'poly' },
                    { coords: [579,290,804,351], type: 'rect' },
                    { coords: [617,430,687,475], type: 'rect' },
                    { coords: [353,54,378,183], type: 'rect' },
                    { coords: [556,375,572,391], type: 'rect' },
                    { coords: [572,376,590,393], type: 'rect' },
                    { coords: [556,391,572,409], type: 'rect' },
                    { coords: [572,394,590,409], type: 'rect' },
                    { coords: [612,375,631,391], type: 'rect' },
                    { coords: [612,393,629,409], type: 'rect' },
                    { coords: [631,391,649,409], type: 'rect' },
                    { coords: [631,375,649,390], type: 'rect' },
                    { coords: [649,391,665,408], type: 'rect' },
                    { coords: [649,376,665,391], type: 'rect' },
                    { coords: [667,393,683,408], type: 'rect' },
                    { coords: [667,375,683,391], type: 'rect' },
                  ];
                  
                  const shapes = areas.map((area, index) => {
                    const stallId = stallIdMap[index];
                    const stall = secondFloorStalls[index];
                    const isOccupied = stall?.occupancy_status === 'occupied';
                    const fillColor = isOccupied 
                      ? 'rgba(239, 68, 68, 0.3)'  // red for occupied
                      : 'rgba(34, 197, 94, 0.3)'; // green for available
                    const strokeColor = isOccupied 
                      ? 'rgba(239, 68, 68, 0.6)' 
                      : 'rgba(34, 197, 94, 0.6)';
                    
                    let centerX = 0;
                    let centerY = 0;
                    
                    if (area.type === 'rect' && area.coords.length >= 4) {
                      const [x1, y1, x2, y2] = area.coords;
                      centerX = (x1 + x2) / 2;
                      centerY = (y1 + y2) / 2;
                      return (
                        <g key={index}>
                          <rect
                            x={x1}
                            y={y1}
                            width={x2 - x1}
                            height={y2 - y1}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth="2"
                            className="pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => stall && handleBoothClick(stall.stall_code)}
                          />
                          {stallId && (
                            <text
                              x={centerX}
                              y={centerY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none text-xs font-semibold fill-foreground"
                              style={{ fontSize: '10px' }}
                            >
                              {stallId}
                            </text>
                          )}
                        </g>
                      );
                    } else if (area.type === 'poly') {
                      // Calculate centroid for polygon
                      const points = [];
                      for (let i = 0; i < area.coords.length; i += 2) {
                        points.push({ x: area.coords[i], y: area.coords[i + 1] });
                      }
                      centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
                      centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
                      
                      const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                      return (
                        <g key={index}>
                          <polygon
                            points={pointsStr}
                            fill={fillColor}
                            stroke={strokeColor}
                            strokeWidth="2"
                            className="pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => stall && handleBoothClick(stall.stall_code)}
                          />
                          {stallId && (
                            <text
                              x={centerX}
                              y={centerY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none text-xs font-semibold fill-foreground"
                              style={{ fontSize: '12px' }}
                            >
                              {stallId}
                            </text>
                          )}
                        </g>
                      );
                    }
                    return null;
                  });
                  
                  return shapes;
                })()}
              </svg>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="legend mt-4">
        <div className="legend-item">
          <div className="box is-available"></div> 
          {allowOccupiedSelection ? "Available" : "Available (Click to Select)"}
        </div>
        <div className="legend-item">
          <div className="box is-occupied"></div> 
          {allowOccupiedSelection ? "Occupied (Click to View)" : "Occupied"}
        </div>
        {selectedStallCode && (
          <div className="legend-item">
            <Badge variant="default">Selected: {selectedStallCode}</Badge>
          </div>
        )}
      </div>
    </div>
  );
}
