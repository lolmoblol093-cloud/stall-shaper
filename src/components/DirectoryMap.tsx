import React, { useState, useEffect, useRef } from 'react';
import './DirectoryMap.css';
import stallService from '@/services/stallService';
import tenantService from '@/services/tenantService';
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
  hideOccupiedDetails?: boolean;
}

export function DirectoryMap({ highlightedStallCode, hideOccupiedDetails = false }: DirectoryMapProps) {
  const [booths, setBooths] = useState(initialBoothData);
  const [stallsData, setStallsData] = useState<StallData[]>([]);
  const [selectedStall, setSelectedStall] = useState<StallData | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentFloor, setCurrentFloor] = useState<'ground' | 'second' | 'third'>('ground');
  const imageRef = useRef<HTMLImageElement>(null);
  const [tenantsData, setTenantsData] = useState<TenantData[]>([]);

  useEffect(() => {
    fetchStallsAndTenants();
  }, []);

  const fetchStallsAndTenants = async () => {
    try {
      // Fetch stalls
      const stalls = await stallService.getAll();
      
      // Fetch active tenants
      const tenants = await tenantService.getPublicInfo();
      
      if (stalls) {
        setStallsData(stalls as StallData[]);
        
        // Update booth statuses based on actual stall data from database
        setBooths(currentBooths =>
          currentBooths.map(booth => {
            const stall = stalls.find(s => s.stall_code === booth.id);
            if (!stall) {
              return { ...booth, status: 'available' };
            }
            
            const tenant = tenants?.find(t => t.stall_number === booth.id);
            const isOccupied = stall.occupancy_status === 'occupied' || tenant !== undefined;
            
            return {
              ...booth,
              status: isOccupied ? 'occupied' : 'available'
            };
          })
        );
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleBoothClick = async (id: string) => {
    const stall = stallsData.find(s => s.stall_code === id);
    if (stall) {
      // If hideOccupiedDetails is true and stall is occupied, don't show modal
      if (hideOccupiedDetails && stall.occupancy_status === 'occupied') {
        return;
      }
      
      setSelectedStall(stall);
      
      // Fetch tenant data if stall is occupied
      if (stall.occupancy_status === 'occupied') {
        try {
          const activeTenants = await tenantService.getActive();
          const tenant = activeTenants.find(t => t.stall_number === id);
          setSelectedTenant(tenant as TenantData || null);
        } catch (error) {
          console.error('Error fetching tenant:', error);
          setSelectedTenant(null);
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
    
    for (let i = 0; i < areas.length; i++) {
      const area = areas[i];
      if (area.type === 'rect' && area.coords.length >= 4) {
        const [x1, y1, x2, y2] = area.coords;
        if (scaledX >= x1 && scaledX <= x2 && scaledY >= y1 && scaledY <= y2) {
          // Found matching area, get stall by ID instead of index
          const stallId = stallIdMap[i];
          const stall = secondFloorStalls.find(s => s.stall_code === stallId);
          if (stall) {
            handleBoothClick(stall.stall_code);
          }
          return;
        }
      } else if (area.type === 'poly') {
        // Point-in-polygon test
        if (isPointInPolygon(scaledX, scaledY, area.coords)) {
          const stallId = stallIdMap[i];
          const stall = secondFloorStalls.find(s => s.stall_code === stallId);
          if (stall) {
            handleBoothClick(stall.stall_code);
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
        { coords: [560,369,577,386], type: 'rect' }, // d54
      ];
      
      const thirdFloorStallIds = [
        'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8', 'd9', 'd10',
        'd11', 'd12', 'd13', 'd14', 'd15', 'd16', 'd17', 'd18', 'd19', 'd20',
        'd21', 'd23', 'd24', 'd25', 'd26', 'd27', 'd28', 'd29', 'd30',
        'd31', 'd32', 'd33', 'd34', 'd35', 'd36', 'd37', 'd38', 'd39', 'd40',
        'd41', 'd42', 'd43', 'd44', 'd45', 'd46', 'd47', 'd48', 'd49', 'd50',
        'd51', 'd52', 'd53', 'd54'
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

  // Ground floor stall areas - these are derived from actual SVG coordinates
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
    { coords: [117,191,137,218], type: 'rect' },
    { coords: [137,191,155,218], type: 'rect' },
    { coords: [117,166,137,191], type: 'rect' },
    { coords: [137,166,155,191], type: 'rect' },
    { coords: [117,139,137,166], type: 'rect' },
    { coords: [137,139,155,166], type: 'rect' },
    { coords: [117,115,137,139], type: 'rect' },
    { coords: [137,115,155,139], type: 'rect' },
    { coords: [183,139,203,166], type: 'rect' },
    { coords: [203,139,221,166], type: 'rect' },
    { coords: [183,166,203,191], type: 'rect' },
    { coords: [203,166,221,191], type: 'rect' },
    { coords: [183,191,203,218], type: 'rect' },
    { coords: [203,191,221,218], type: 'rect' },
    { coords: [183,218,203,245], type: 'rect' },
    { coords: [203,218,221,245], type: 'rect' },
    { coords: [183,245,203,270], type: 'rect' },
    { coords: [203,245,221,270], type: 'rect' },
    { coords: [248,139,268,166], type: 'rect' },
    { coords: [268,139,286,166], type: 'rect' },
    { coords: [248,166,268,191], type: 'rect' },
    { coords: [268,166,286,191], type: 'rect' },
    { coords: [248,191,268,218], type: 'rect' },
    { coords: [268,191,286,218], type: 'rect' },
    { coords: [248,218,268,245], type: 'rect' },
    { coords: [268,218,286,245], type: 'rect' },
    { coords: [248,245,268,270], type: 'rect' },
    { coords: [268,245,286,270], type: 'rect' },
    { coords: [314,139,334,166], type: 'rect' },
    { coords: [334,139,352,166], type: 'rect' },
    { coords: [314,166,334,191], type: 'rect' },
    { coords: [334,166,352,191], type: 'rect' },
    { coords: [314,191,334,218], type: 'rect' },
    { coords: [334,191,352,218], type: 'rect' },
    { coords: [314,218,334,245], type: 'rect' },
    { coords: [334,218,352,245], type: 'rect' },
    { coords: [314,245,334,270], type: 'rect' },
    { coords: [334,245,352,270], type: 'rect' },
    { coords: [379,139,399,166], type: 'rect' },
    { coords: [399,139,417,166], type: 'rect' },
    { coords: [379,166,399,191], type: 'rect' },
    { coords: [399,166,417,191], type: 'rect' },
    { coords: [379,191,399,218], type: 'rect' },
    { coords: [399,191,417,218], type: 'rect' },
    { coords: [379,218,399,245], type: 'rect' },
    { coords: [399,218,417,245], type: 'rect' },
    { coords: [379,245,399,270], type: 'rect' },
    { coords: [399,245,417,270], type: 'rect' },
    { coords: [445,166,465,191], type: 'rect' },
    { coords: [465,166,483,191], type: 'rect' },
    { coords: [445,191,465,218], type: 'rect' },
    { coords: [465,191,483,218], type: 'rect' },
    { coords: [445,218,465,245], type: 'rect' },
    { coords: [465,218,483,245], type: 'rect' },
    { coords: [510,166,530,191], type: 'rect' },
    { coords: [530,166,548,191], type: 'rect' },
    { coords: [510,191,530,218], type: 'rect' },
    { coords: [530,191,548,218], type: 'rect' },
    { coords: [510,218,530,245], type: 'rect' },
    { coords: [530,218,548,245], type: 'rect' },
    { coords: [575,166,595,191], type: 'rect' },
    { coords: [595,166,613,191], type: 'rect' },
    { coords: [575,191,595,218], type: 'rect' },
    { coords: [595,191,613,218], type: 'rect' },
    { coords: [575,218,595,245], type: 'rect' },
    { coords: [595,218,613,245], type: 'rect' },
    { coords: [640,166,660,191], type: 'rect' },
    { coords: [660,166,678,191], type: 'rect' },
    { coords: [640,191,660,218], type: 'rect' },
    { coords: [660,191,678,218], type: 'rect' },
    { coords: [640,218,660,245], type: 'rect' },
    { coords: [660,218,678,245], type: 'rect' },
    { coords: [701,191,719,218], type: 'rect' },
    { coords: [719,191,737,218], type: 'rect' },
    { coords: [701,218,719,245], type: 'rect' },
  ];

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

  const handleGroundFloorClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = 850 / rect.width;
    const scaleY = 491 / rect.height;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    const groundFloorStalls = stallsData.filter(s => s.floor === 'Ground Floor');
    
    for (let i = 0; i < groundFloorAreas.length; i++) {
      const area = groundFloorAreas[i];
      if (area.type === 'rect' && area.coords.length >= 4) {
        const [x1, y1, x2, y2] = area.coords;
        if (scaledX >= x1 && scaledX <= x2 && scaledY >= y1 && scaledY <= y2) {
          const stallId = groundFloorStallIds[i];
          const stall = groundFloorStalls.find(s => s.stall_code === stallId);
          if (stall) {
            handleBoothClick(stall.stall_code);
          }
          return;
        }
      }
    }
  };

  return (
    <div className="directory-map-container">
      <h3 className="text-xl font-semibold mb-4">Stall Directory Map</h3>
      
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
                onClick={handleGroundFloorClick}
              >
                {groundFloorAreas.map((area, index) => {
                  const stallId = groundFloorStallIds[index];
                  const stall = stallsData.find(s => s.stall_code === stallId);
                  const isOccupied = stall?.occupancy_status === 'occupied';
                  const isHighlighted = highlightedStallCode === stallId;
                  
                  if (area.type === 'rect' && area.coords.length >= 4) {
                    const [x1, y1, x2, y2] = area.coords;
                    return (
                      <rect
                        key={index}
                        x={x1}
                        y={y1}
                        width={x2 - x1}
                        height={y2 - y1}
                        fill={isOccupied ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'}
                        stroke={isHighlighted ? '#3b82f6' : (isOccupied ? '#ef4444' : '#22c55e')}
                        strokeWidth={isHighlighted ? 3 : 1}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
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
              className="w-full h-auto border border-border rounded-lg cursor-pointer"
              onClick={handleImageMapClick}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="third">
          <div className="relative w-full max-w-4xl mx-auto">
            <img 
              ref={imageRef}
              src={thirdFloorSvg} 
              alt="Third Floor Map" 
              className="w-full h-auto border border-border rounded-lg cursor-pointer"
              onClick={handleImageMapClick}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-vacant rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-status-occupied rounded"></div>
          <span>Occupied</span>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stall {selectedStall?.stall_code}</DialogTitle>
            <DialogDescription>
              {selectedStall?.floor}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStall && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge 
                  variant={selectedStall.occupancy_status === 'occupied' ? 'destructive' : 'default'}
                  className={selectedStall.occupancy_status === 'occupied' ? 'bg-status-occupied' : 'bg-status-vacant'}
                >
                  {selectedStall.occupancy_status}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Monthly Rent</p>
                  <p className="font-medium">₱{selectedStall.monthly_rent?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Floor Size</p>
                  <p className="font-medium">{selectedStall.floor_size || 'N/A'}</p>
                </div>
              </div>

              {selectedTenant && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-2">Tenant Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Business Name</p>
                      <p className="font-medium">{selectedTenant.business_name}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{selectedTenant.contact_person}</p>
                    </div>
                    {selectedTenant.email && (
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedTenant.email}</p>
                      </div>
                    )}
                    {selectedTenant.phone && (
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedTenant.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DirectoryMap;
