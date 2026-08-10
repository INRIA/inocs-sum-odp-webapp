import React from "react";

interface Tile {
  label: string;
  value: string | number;
}

interface StatusTilesProps {
  tiles: Tile[];
}

export function StatusTiles({ tiles }: StatusTilesProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="bg-white border border-gray-200 rounded-lg p-4 text-center"
        >
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {tile.value}
          </div>
          <div className="text-xs text-gray-500">{tile.label}</div>
        </div>
      ))}
    </div>
  );
}
