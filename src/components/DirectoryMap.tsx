import React, { useState } from 'react';
import './DirectoryMap.css';

interface Booth {
  id: string;
  status: 'available' | 'occupied';
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
}

function Booth({ id, status, onClick }: BoothProps) {
  const statusClass = status === 'available' ? 'is-available' : 'is-occupied';

  return (
    <div
      className={`booth ${statusClass}`}
      id={id}
      onClick={onClick}
    >
      {id}
    </div>
  );
}

export function DirectoryMap() {
  const [booths, setBooths] = useState(initialBoothData);

  const toggleStatus = (id: string) => {
    setBooths((currentBooths) =>
      currentBooths.map((booth) =>
        booth.id === id
          ? {
              ...booth,
              status:
                booth.status === 'available' ? 'occupied' : 'available',
            }
          : booth
      )
    );
  };

  return (
    <div className="directory-map-container">
      <h3 className="text-xl font-semibold mb-4">Stall Directory Map</h3>
      <div className="directory-map">
        {booths.map((booth) => (
          <Booth
            key={booth.id}
            id={booth.id}
            status={booth.status}
            onClick={() => toggleStatus(booth.id)}
          />
        ))}
      </div>
      <div className="legend">
        <div className="legend-item">
          <div className="box is-available"></div> Available
        </div>
        <div className="legend-item">
          <div className="box is-occupied"></div> Occupied
        </div>
      </div>
    </div>
  );
}
