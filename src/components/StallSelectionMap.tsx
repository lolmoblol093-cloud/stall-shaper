import React, { useState, useEffect } from 'react';
import './DirectoryMap.css';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
