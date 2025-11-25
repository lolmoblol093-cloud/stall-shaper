import React, { useState, useEffect, useRef } from 'react';
import './DirectoryMap.css';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  electricity_reader: string | null;
  floor_size: string | null;
}

interface TenantData {
  id: string;
  business_name: string;
  contact_person: string;
  email: string | null;
  phone: string | null;
  lease_start_date: string | null;
  lease_end_date: string | null;
  stall_number: string | null;
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
  isHighlighted: boolean;
}

function Booth({ id, status, onClick, isHighlighted }: BoothProps) {
  const statusClass = status === 'available' ? 'is-available' : 'is-occupied';

  return (
    <div
      className={`booth ${statusClass} ${isHighlighted ? 'is-highlighted' : ''}`}
      id={id}
      onClick={onClick}
    >
      {id}
    </div>
  );
}

interface DirectoryMapProps {
  highlightedStallCode?: string | null;
}

export function DirectoryMap({ highlightedStallCode }: DirectoryMapProps) {
  const [booths, setBooths] = useState(initialBoothData);
  const [stallsData, setStallsData] = useState<StallData[]>([]);
  const [selectedStall, setSelectedStall] = useState<StallData | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFloor, setCurrentFloor] = useState<'ground' | 'second'>('ground');
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    fetchStallsAndTenants();
  }, []);

  const fetchStallsAndTenants = async () => {
    // Fetch stalls
    const { data: stallsData, error: stallsError } = await supabase
      .from('stalls')
      .select('*');
    
    if (stallsError) {
      console.error('Error fetching stalls:', stallsError);
      return;
    }

    // Fetch active tenants
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
      
      // Update booth statuses based on actual stall data from database
      // Match by stall_code to ensure proper connection
      setBooths(currentBooths =>
        currentBooths.map(booth => {
          const stall = stallsData.find(s => s.stall_code === booth.id);
          if (!stall) {
            // If no matching stall in database, keep as available
            return { ...booth, status: 'available' };
          }
          
          // Check if there's an active tenant for this stall
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

  const handleBoothClick = async (id: string) => {
    const stall = stallsData.find(s => s.stall_code === id);
    if (stall) {
      setSelectedStall(stall);
      
      // Fetch tenant data if stall is occupied
      if (stall.occupancy_status === 'occupied') {
        const { data: tenantData, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('stall_number', id)
          .eq('status', 'active')
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching tenant:', error);
          setSelectedTenant(null);
        } else {
          setSelectedTenant(tenantData);
        }
      } else {
        setSelectedTenant(null);
      }
      
      setIsModalOpen(true);
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
      { id: 'Super Market', coords: [189,225,26,226,25,195,10,193,10,16,192,16,193,47,225,48,226,187], type: 'poly' },
      { id: 'c19', coords: [248,134,263,48], type: 'rect' },
      { id: 'c18', coords: [239,225,189,225,226,187,252,212], type: 'poly' },
      { id: 'c17', coords: [240,225,253,213,316,276,303,289], type: 'poly' },
      { id: 'c16', coords: [298,180,307,190,382,190,382,230,362,230,334,202,294,203,285,193], type: 'poly' },
      { id: 'c15', coords: [401,206,553,250], type: 'rect' },
      { id: 'c14', coords: [409,287,396,277], type: 'rect' },
      { id: 'c13', coords: [396,287,385,277], type: 'rect' },
      { id: 'c12', coords: [396,276,386,264], type: 'rect' },
      { id: 'c11', coords: [397,276,409,264], type: 'rect' },
      { id: 'c10', coords: [435,276,423,264], type: 'rect' },
      { id: 'c9', coords: [435,276,448,265], type: 'rect' },
      { id: 'c8', coords: [459,276,448,264], type: 'rect' },
      { id: 'c7', coords: [472,276,460,264], type: 'rect' },
      { id: 'c6', coords: [424,288,434,277], type: 'rect' },
      { id: 'c5', coords: [435,288,448,277], type: 'rect' },
      { id: 'c4', coords: [459,287,449,276], type: 'rect' },
      { id: 'c3', coords: [472,288,459,276], type: 'rect' },
      { id: 'c2', coords: [474,332,426,302], type: 'rect' },
      { id: 'c1', coords: [576,278,537,277,515,300,515,330,576,331], type: 'poly' },
    ];
    
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      if (area.type === 'rect' && area.coords.length >= 4) {
        const [x1, y1, x2, y2] = area.coords;
        if (scaledX >= x1 && scaledX <= x2 && scaledY >= y1 && scaledY <= y2) {
          // Found matching area, get stall by ID
          const stall = secondFloorStalls.find(s => s.stall_code === area.id);
          if (stall) {
            handleBoothClick(stall.stall_code);
          }
          return;
        }
      } else if (area.type === 'poly') {
        // Point-in-polygon test
        if (isPointInPolygon(scaledX, scaledY, area.coords)) {
          const stall = secondFloorStalls.find(s => s.stall_code === area.id);
          if (stall) {
            handleBoothClick(stall.stall_code);
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
      <h3 className="text-xl font-semibold mb-4">Stall Directory Map</h3>
      
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
                isHighlighted={highlightedStallCode === booth.id}
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
                  const areas = [
                    { id: 'Super Market', coords: [189,225,26,226,25,195,10,193,10,16,192,16,193,47,225,48,226,187], type: 'poly' },
                    { id: 'c19', coords: [248,134,263,48], type: 'rect' },
                    { id: 'c18', coords: [239,225,189,225,226,187,252,212], type: 'poly' },
                    { id: 'c17', coords: [240,225,253,213,316,276,303,289], type: 'poly' },
                    { id: 'c16', coords: [298,180,307,190,382,190,382,230,362,230,334,202,294,203,285,193], type: 'poly' },
                    { id: 'c15', coords: [401,206,553,250], type: 'rect' },
                    { id: 'c14', coords: [409,287,396,277], type: 'rect' },
                    { id: 'c13', coords: [396,287,385,277], type: 'rect' },
                    { id: 'c12', coords: [396,276,386,264], type: 'rect' },
                    { id: 'c11', coords: [397,276,409,264], type: 'rect' },
                    { id: 'c10', coords: [435,276,423,264], type: 'rect' },
                    { id: 'c9', coords: [435,276,448,265], type: 'rect' },
                    { id: 'c8', coords: [459,276,448,264], type: 'rect' },
                    { id: 'c7', coords: [472,276,460,264], type: 'rect' },
                    { id: 'c6', coords: [424,288,434,277], type: 'rect' },
                    { id: 'c5', coords: [435,288,448,277], type: 'rect' },
                    { id: 'c4', coords: [459,287,449,276], type: 'rect' },
                    { id: 'c3', coords: [472,288,459,276], type: 'rect' },
                    { id: 'c2', coords: [474,332,426,302], type: 'rect' },
                    { id: 'c1', coords: [576,278,537,277,515,300,515,330,576,331], type: 'poly' },
                  ];
                  
                  return areas.map((area, index) => {
                    const stall = secondFloorStalls.find(s => s.stall_code === area.id);
                    const isOccupied = stall?.occupancy_status === 'occupied';
                    const fillColor = isOccupied 
                      ? 'rgba(239, 68, 68, 0.3)'  // red for occupied
                      : 'rgba(34, 197, 94, 0.3)'; // green for available
                    const strokeColor = isOccupied 
                      ? 'rgba(239, 68, 68, 0.6)' 
                      : 'rgba(34, 197, 94, 0.6)';
                    
                    if (area.type === 'rect' && area.coords.length >= 4) {
                      const [x1, y1, x2, y2] = area.coords;
                      return (
                        <rect
                          key={area.id}
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
                      );
                    } else if (area.type === 'poly') {
                      const points = [];
                      for (let i = 0; i < area.coords.length; i += 2) {
                        points.push(`${area.coords[i]},${area.coords[i + 1]}`);
                      }
                      return (
                        <polygon
                          key={area.id}
                          points={points.join(' ')}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="2"
                          className="pointer-events-auto cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => stall && handleBoothClick(stall.stall_code)}
                        />
                      );
                    }
                    return null;
                  });
                })()}
              </svg>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="legend mt-4">
        <div className="legend-item">
          <div className="box is-available"></div> Available
        </div>
        <div className="legend-item">
          <div className="box is-occupied"></div> Occupied
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stall Details - {selectedStall?.stall_code}</DialogTitle>
            <DialogDescription>
              View detailed information about this stall
            </DialogDescription>
          </DialogHeader>
          {selectedStall && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={selectedStall.occupancy_status === 'occupied' ? 'destructive' : 'default'}>
                  {selectedStall.occupancy_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Floor:</span>
                <span className="font-medium">{selectedStall.floor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-medium">₱{selectedStall.monthly_rent.toLocaleString()}</span>
              </div>
              {selectedStall.floor_size && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Floor Size:</span>
                  <span className="font-medium">{selectedStall.floor_size}</span>
                </div>
              )}
              {selectedStall.electricity_reader && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Electricity Reader:</span>
                  <span className="font-medium">{selectedStall.electricity_reader}</span>
                </div>
              )}
              
              {selectedStall.occupancy_status === 'occupied' && selectedTenant && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-semibold mb-3">Tenant Information</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Business Name:</span>
                        <span className="font-medium">{selectedTenant.business_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contact Person:</span>
                        <span className="font-medium">{selectedTenant.contact_person}</span>
                      </div>
                      {selectedTenant.phone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <span className="font-medium">{selectedTenant.phone}</span>
                        </div>
                      )}
                      {selectedTenant.email && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-medium">{selectedTenant.email}</span>
                        </div>
                      )}
                      {selectedTenant.lease_start_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lease Start:</span>
                          <span className="font-medium">{new Date(selectedTenant.lease_start_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedTenant.lease_end_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lease End:</span>
                          <span className="font-medium">{new Date(selectedTenant.lease_end_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
