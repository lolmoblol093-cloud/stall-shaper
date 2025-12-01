import React, { useState, useEffect, useRef } from 'react';
import './DirectoryMap.css';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import groundFloorSvg from '@/assets/ground-floor.svg';
import secondFloorSvg from '@/assets/second-floor.svg';
import thirdFloorSvg from '@/assets/third-floor.svg';

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
  const [currentFloor, setCurrentFloor] = useState<'ground' | 'second' | 'third'>('ground');
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
    const thirdFloorStalls = stallsData.filter(s => s.floor === 'Third Floor');
    
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
    
    // Third floor click handling
    if (currentFloor === 'third') {
      const thirdFloorAreas = [
        { coords: [757,421,793,386,852,386,852,468,757,468], type: 'poly' }, // d1
        { coords: [620,424,696,468], type: 'rect' }, // d2
        { coords: [757,276,817,341], type: 'rect' }, // d3
        { coords: [693,278,755,341], type: 'rect' }, // d4
        { coords: [631,276,692,342], type: 'rect' }, // d5
        { coords: [586,276,629,343], type: 'rect' }, // d6
        { coords: [729,384,748,402], type: 'rect' }, // d7
        { coords: [729,367,748,385], type: 'rect' }, // d8
        { coords: [713,385,729,403], type: 'rect' }, // d9
        { coords: [713,368,729,384], type: 'rect' }, // d10
        { coords: [673,385,692,403], type: 'rect' }, // d11
        { coords: [675,367,692,384], type: 'rect' }, // d12
        { coords: [657,385,673,403], type: 'rect' }, // d13
        { coords: [657,367,675,385], type: 'rect' }, // d14
        { coords: [639,385,657,402], type: 'rect' }, // d15
        { coords: [639,367,657,384], type: 'rect' }, // d16
        { coords: [623,385,639,404], type: 'rect' }, // d17
        { coords: [622,368,639,384], type: 'rect' }, // d18
        { coords: [578,387,595,403], type: 'rect' }, // d19
        { coords: [578,367,595,384], type: 'rect' }, // d20
        { coords: [561,386,577,404], type: 'rect' }, // d21
        { coords: [560,369,577,386], type: 'rect' }, // d54
        { coords: [554,276,533,275,533,252,437,252,412,226,392,244,418,271,495,271,539,315,554,314], type: 'poly' }, // d23
        { coords: [440,412,334,309,324,308,325,259,462,392], type: 'poly' }, // d24
        { coords: [265,258,324,309], type: 'rect' }, // d25
        { coords: [238,256,263,285], type: 'rect' }, // d26
        { coords: [209,256,236,285], type: 'rect' }, // d27
        { coords: [183,257,209,286], type: 'rect' }, // d28
        { coords: [156,257,182,285], type: 'rect' }, // d29
        { coords: [129,257,154,286], type: 'rect' }, // d30
        { coords: [339,32,374,177], type: 'rect' }, // d31
        { coords: [215,9,245,60], type: 'rect' }, // d32
        { coords: [174,9,213,60], type: 'rect' }, // d33
        { coords: [135,8,174,62], type: 'rect' }, // d34
        { coords: [95,8,135,61], type: 'rect' }, // d35
        { coords: [57,9,94,62], type: 'rect' }, // d36
        { coords: [5,8,56,78], type: 'rect' }, // d37
        { coords: [3,78,56,117], type: 'rect' }, // d38
        { coords: [3,118,56,158], type: 'rect' }, // d39
        { coords: [3,159,56,196], type: 'rect' }, // d40
        { coords: [3,197,56,237], type: 'rect' }, // d41
        { coords: [262,214,280,232], type: 'rect' }, // d42
        { coords: [247,215,262,232], type: 'rect' }, // d43
        { coords: [262,197,280,213], type: 'rect' }, // d44
        { coords: [245,197,262,214], type: 'rect' }, // d45
        { coords: [189,216,206,233], type: 'rect' }, // d46
        { coords: [189,198,207,215], type: 'rect' }, // d47
        { coords: [173,216,189,232], type: 'rect' }, // d48
        { coords: [173,198,189,215], type: 'rect' }, // d49
        { coords: [115,214,132,232], type: 'rect' }, // d50
        { coords: [115,199,132,214], type: 'rect' }, // d51
        { coords: [98,216,115,234], type: 'rect' }, // d52
        { coords: [98,198,115,215], type: 'rect' }, // d53
      ];
      
      const thirdFloorStallIds = [
        'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10',
        'd11', 'd12', 'd13', 'd14', 'd15', 'd16', 'd17', 'd18', 'd19', 'd20',
        'd21', 'd54', 'd23', 'd24', 'd25', 'd26', 'd27', 'd28', 'd29', 'd30',
        'd31', 'd32', 'd33', 'd34', 'd35', 'd36', 'd37', 'd38', 'd39', 'd40',
        'd41', 'd42', 'd43', 'd44', 'd45', 'd46', 'd47', 'd48', 'd49', 'd50',
        'd51', 'd52', 'd53'
      ];
      
      for (let i = 0; i < thirdFloorAreas.length; i++) {
        const area = thirdFloorAreas[i];
        if (area.type === 'rect' && area.coords.length >= 4) {
          const [x1, y1, x2, y2] = area.coords;
          if (scaledX >= x1 && scaledX <= x2 && scaledY >= y1 && scaledY <= y2) {
            const stallId = thirdFloorStallIds[i];
            const stall = thirdFloorStalls.find(s => s.stall_code === stallId);
            if (stall) {
              handleBoothClick(stall.stall_code);
            }
            return;
          }
        } else if (area.type === 'poly') {
          if (isPointInPolygon(scaledX, scaledY, area.coords)) {
            const stallId = thirdFloorStallIds[i];
            const stall = thirdFloorStalls.find(s => s.stall_code === stallId);
            if (stall) {
              handleBoothClick(stall.stall_code);
            }
            return;
          }
        }
      }
      return;
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
                className="absolute inset-0 w-full h-auto cursor-pointer pointer-events-none"
                viewBox="0 0 850 491"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Render colored overlays for each stall area */}
                {(() => {
                  const groundFloorStalls = stallsData.filter(s => s.floor === 'Ground Floor');
                  
  const groundFloorStallIds = [
    'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8', 'b9', 'b10',
    'b11', 'b12', 'b13', 'b14', 'b15', 'b16', 'b17', 'b18', 'b19', 'b20',
    'b21', 'b22', 'b23', 'b24', 'b25', 'b26', 'b27', 'b28', 'b29', 'b30',
    'b31', 'b32', 'b33', 'b34', 'b35', 'b36', 'b37', 'b38', 'b39', 'b40',
    'b41', 'b42', 'b43', 'b44', 'b45', 'b46', 'b47', 'b48', 'b49', 'b50',
    'b51', 'b52', 'b53', 'b54', 'b55', 'b56', 'b57', 'b58', 'b59', 'b60',
    'b61', 'b62', 'b63', 'b64', 'b65', 'b66', 'b67', 'b68', 'b69', 'b70',
    'b71', 'b72', 'b73', 'b74', 'b75', 'b76'
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
                    { coords: [137,193,154,218], type: 'rect' },
                    { coords: [117,191,136,218], type: 'rect' },
                    { coords: [137,166,155,191], type: 'rect' },
                    { coords: [119,166,136,190], type: 'rect' },
                    { coords: [139,139,155,164], type: 'rect' },
                    { coords: [119,139,137,164], type: 'rect' },
                    { coords: [137,112,155,137], type: 'rect' },
                    { coords: [117,114,137,139], type: 'rect' },
                    { coords: [137,87,155,110], type: 'rect' },
                    { coords: [117,87,137,110], type: 'rect' },
                    { coords: [119,62,135,85], type: 'rect' },
                    { coords: [139,60,153,87], type: 'rect' },
                    { coords: [137,33,155,58], type: 'rect' },
                    { coords: [119,35,137,58], type: 'rect' },
                    { coords: [191,33,209,58], type: 'rect' },
                    { coords: [211,35,229,58], type: 'rect' },
                    { coords: [191,62,211,85], type: 'rect' },
                    { coords: [211,62,227,87], type: 'rect' },
                    { coords: [193,85,209,112], type: 'rect' },
                    { coords: [211,85,227,110], type: 'rect' },
                    { coords: [191,112,211,137], type: 'rect' },
                    { coords: [211,110,227,137], type: 'rect' },
                    { coords: [191,138,209,164], type: 'rect' },
                    { coords: [211,139,227,164], type: 'rect' },
                    { coords: [191,164,209,191], type: 'rect' },
                    { coords: [209,164,229,191], type: 'rect' },
                    { coords: [211,191,227,216], type: 'rect' },
                    { coords: [191,191,209,218], type: 'rect' },
                    { coords: [191,218,209,241], type: 'rect' },
                    { coords: [211,218,229,241], type: 'rect' },
                    { coords: [211,243,227,270], type: 'rect' },
                    { coords: [191,243,209,270], type: 'rect' },
                    { coords: [261,60,281,88], type: 'rect' },
                    { coords: [281,60,299,87], type: 'rect' },
                    { coords: [261,88,281,112], type: 'rect' },
                    { coords: [281,87,299,114], type: 'rect' },
                    { coords: [263,114,281,137], type: 'rect' },
                    { coords: [281,114,299,139], type: 'rect' },
                    { coords: [281,139,299,166], type: 'rect' },
                    { coords: [261,137,281,166], type: 'rect' },
                    { coords: [261,165,281,191], type: 'rect' },
                    { coords: [281,165,299,191], type: 'rect' },
                    { coords: [261,191,281,218], type: 'rect' },
                    { coords: [281,191,299,218], type: 'rect' },
                    { coords: [263,220,281,245], type: 'rect' },
                    { coords: [281,218,299,244], type: 'rect' },
                    { coords: [261,244,281,269], type: 'rect' },
                    { coords: [281,244,299,269], type: 'rect' },
                    { coords: [321,62,348,77], type: 'rect' },
                    { coords: [349,62,369,78], type: 'rect' },
                    { coords: [371,59,389,131], type: 'rect' },
                    { coords: [371,132,389,165], type: 'rect' },
                    { coords: [371,166,389,197], type: 'rect' },
                    { coords: [324,102,340,131], type: 'rect' },
                    { coords: [324,131,340,162], type: 'rect' },
                    { coords: [324,161,340,192], type: 'rect' },
                    { coords: [130,303,157,322], type: 'rect' },
                    { coords: [157,303,184,320], type: 'rect' },
                    { coords: [184,303,211,321], type: 'rect' },
                    { coords: [209,302,238,320], type: 'rect' },
                    { coords: [240,302,265,322], type: 'rect' },
                    { coords: [268,301,312,303,290,323,264,323], type: 'poly' },
                    { coords: [323,209,323,261,342,241,339,209], type: 'poly' },
                    { coords: [560,315,808,356], type: 'rect' },
                    { coords: [748,397,846,479], type: 'rect' },
                    { coords: [524,436,689,478], type: 'rect' },
                    { coords: [412,380,452,422,469,402,428,362], type: 'poly' },
                    { coords: [583,378,599,396], type: 'rect' },
                    { coords: [564,379,581,396], type: 'rect' },
                    { coords: [581,397,599,413], type: 'rect' },
                    { coords: [564,396,581,413], type: 'rect' },
                    { coords: [625,397,639,412], type: 'rect' },
                    { coords: [623,378,639,395], type: 'rect' },
                    { coords: [639,396,657,413], type: 'rect' },
                    { coords: [640,377,657,395], type: 'rect' },
                    { coords: [658,397,674,412], type: 'rect' },
                    { coords: [657,378,674,394], type: 'rect' },
                    { coords: [674,396,690,413], type: 'rect' },
                    { coords: [674,378,690,394], type: 'rect' },
                    { coords: [693,379,707,394], type: 'rect' },
                    { coords: [693,397,707,413], type: 'rect' },
                  ];
                  
                  const shapes = groundFloorAreas.map((area, index) => {
                    const stallId = groundFloorStallIds[index];
                    const stall = groundFloorStalls.find(s => s.stall_code === stallId);
                    const isOccupied = stall?.occupancy_status === 'occupied';
                    const isSelected = selectedStallCode === stallId;
                    const fillColor = isSelected
                      ? 'rgba(59, 130, 246, 0.5)'
                      : isOccupied 
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(34, 197, 94, 0.3)';
                    const strokeColor = isSelected
                      ? 'rgba(59, 130, 246, 0.8)'
                      : isOccupied 
                        ? 'rgba(239, 68, 68, 0.6)' 
                        : 'rgba(34, 197, 94, 0.6)';
                    const strokeWidth = isSelected ? '4' : '2';
                    
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
                            strokeWidth={strokeWidth}
                            className="pointer-events-auto cursor-pointer hover:opacity-80 transition-all"
                            onClick={() => stall && handleBoothClick(stall.stall_code)}
                          />
                          {stallId && (
                            <text
                              x={centerX}
                              y={centerY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none text-xs font-semibold fill-foreground"
                              style={{ fontSize: '8px' }}
                            >
                              {stallId}
                            </text>
                          )}
                        </g>
                      );
                    } else if (area.type === 'poly') {
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
                            strokeWidth={strokeWidth}
                            className="pointer-events-auto cursor-pointer hover:opacity-80 transition-all"
                            onClick={() => stall && handleBoothClick(stall.stall_code)}
                          />
                          {stallId && (
                            <text
                              x={centerX}
                              y={centerY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="pointer-events-none text-xs font-semibold fill-foreground"
                              style={{ fontSize: '8px' }}
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
                    const isSelected = selectedStallCode === stallId;
                    const fillColor = isSelected
                      ? 'rgba(59, 130, 246, 0.5)'
                      : isOccupied 
                        ? 'rgba(239, 68, 68, 0.3)'  // red for occupied
                        : 'rgba(34, 197, 94, 0.3)'; // green for available
                    const strokeColor = isSelected
                      ? 'rgba(59, 130, 246, 0.8)'
                      : isOccupied 
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
        
        <TabsContent value="third">
          <div className="relative w-full max-w-4xl mx-auto">
            <div className="relative">
              <img 
                ref={imageRef}
                src={thirdFloorSvg} 
                alt="Third Floor Map" 
                className="w-full h-auto border border-border rounded-lg"
              />
              <svg 
                className="absolute inset-0 w-full h-auto cursor-pointer pointer-events-none"
                viewBox="0 0 858 482"
                preserveAspectRatio="xMidYMid meet"
              >
                {(() => {
                  const thirdFloorStalls = stallsData.filter(s => s.floor === 'Third Floor');
                  
                  const thirdFloorStallIds = [
                    'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10',
                    'd11', 'd12', 'd13', 'd14', 'd15', 'd16', 'd17', 'd18', 'd19', 'd20',
                    'd21', 'd54', 'd23', 'd24', 'd25', 'd26', 'd27', 'd28', 'd29', 'd30',
                    'd31', 'd32', 'd33', 'd34', 'd35', 'd36', 'd37', 'd38', 'd39', 'd40',
                    'd41', 'd42', 'd43', 'd44', 'd45', 'd46', 'd47', 'd48', 'd49', 'd50',
                    'd51', 'd52', 'd53'
                  ];
                  
                  const thirdFloorAreas = [
                    { coords: [757,421,793,386,852,386,852,468,757,468], type: 'poly' }, // d1
                    { coords: [620,424,696,468], type: 'rect' }, // d2
                    { coords: [757,276,817,341], type: 'rect' }, // d3
                    { coords: [693,278,755,341], type: 'rect' }, // d4
                    { coords: [631,276,692,342], type: 'rect' }, // d5
                    { coords: [586,276,629,343], type: 'rect' }, // d6
                    { coords: [729,384,748,402], type: 'rect' }, // d7
                    { coords: [729,367,748,385], type: 'rect' }, // d8
                    { coords: [713,385,729,403], type: 'rect' }, // d9
                    { coords: [713,368,729,384], type: 'rect' }, // d10
                    { coords: [673,385,692,403], type: 'rect' }, // d11
                    { coords: [675,367,692,384], type: 'rect' }, // d12
                    { coords: [657,385,673,403], type: 'rect' }, // d13
                    { coords: [657,367,675,385], type: 'rect' }, // d14
                    { coords: [639,385,657,402], type: 'rect' }, // d15
                    { coords: [639,367,657,384], type: 'rect' }, // d16
                    { coords: [623,385,639,404], type: 'rect' }, // d17
                    { coords: [622,368,639,384], type: 'rect' }, // d18
                    { coords: [578,387,595,403], type: 'rect' }, // d19
                    { coords: [578,367,595,384], type: 'rect' }, // d20
                    { coords: [561,386,577,404], type: 'rect' }, // d21
                    { coords: [560,369,577,386], type: 'rect' }, // d54
                    { coords: [554,276,533,275,533,252,437,252,412,226,392,244,418,271,495,271,539,315,554,314], type: 'poly' }, // d23
                    { coords: [440,412,334,309,324,308,325,259,462,392], type: 'poly' }, // d24
                    { coords: [265,258,324,309], type: 'rect' }, // d25
                    { coords: [238,256,263,285], type: 'rect' }, // d26
                    { coords: [209,256,236,285], type: 'rect' }, // d27
                    { coords: [183,257,209,286], type: 'rect' }, // d28
                    { coords: [156,257,182,285], type: 'rect' }, // d29
                    { coords: [129,257,154,286], type: 'rect' }, // d30
                    { coords: [339,32,374,177], type: 'rect' }, // d31
                    { coords: [215,9,245,60], type: 'rect' }, // d32
                    { coords: [174,9,213,60], type: 'rect' }, // d33
                    { coords: [135,8,174,62], type: 'rect' }, // d34
                    { coords: [95,8,135,61], type: 'rect' }, // d35
                    { coords: [57,9,94,62], type: 'rect' }, // d36
                    { coords: [5,8,56,78], type: 'rect' }, // d37
                    { coords: [3,78,56,117], type: 'rect' }, // d38
                    { coords: [3,118,56,158], type: 'rect' }, // d39
                    { coords: [3,159,56,196], type: 'rect' }, // d40
                    { coords: [3,197,56,237], type: 'rect' }, // d41
                    { coords: [262,214,280,232], type: 'rect' }, // d42
                    { coords: [247,215,262,232], type: 'rect' }, // d43
                    { coords: [262,197,280,213], type: 'rect' }, // d44
                    { coords: [245,197,262,214], type: 'rect' }, // d45
                    { coords: [189,216,206,233], type: 'rect' }, // d46
                    { coords: [189,198,207,215], type: 'rect' }, // d47
                    { coords: [173,216,189,232], type: 'rect' }, // d48
                    { coords: [173,198,189,215], type: 'rect' }, // d49
                    { coords: [115,214,132,232], type: 'rect' }, // d50
                    { coords: [115,199,132,214], type: 'rect' }, // d51
                    { coords: [98,216,115,234], type: 'rect' }, // d52
                    { coords: [98,198,115,215], type: 'rect' }, // d53
                  ];
                  
                  const shapes = thirdFloorAreas.map((area, index) => {
                    const stallId = thirdFloorStallIds[index];
                    const stall = thirdFloorStalls.find(s => s.stall_code === stallId);
                    const isOccupied = stall?.occupancy_status === 'occupied';
                    const isSelected = selectedStallCode === stallId;
                    const fillColor = isSelected
                      ? 'rgba(59, 130, 246, 0.5)'
                      : isOccupied 
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(34, 197, 94, 0.3)';
                    const strokeColor = isSelected
                      ? 'rgba(59, 130, 246, 0.8)'
                      : isOccupied 
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
                              style={{ fontSize: '8px' }}
                            >
                              {stallId}
                            </text>
                          )}
                        </g>
                      );
                    } else if (area.type === 'poly') {
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
                              style={{ fontSize: '10px' }}
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
