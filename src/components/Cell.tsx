import React from 'react';
import type { Cell as CellType, Wall } from '../game/types';

interface CellProps {
    cell: CellType;
    walls: Wall[];
}

export const Cell: React.FC<CellProps> = ({ cell, walls }) => {
    // Check for walls attached to this cell
    const hWall = walls.find(w => w.row === cell.row && w.col === cell.col && w.orientation === 'horizontal');
    const vWall = walls.find(w => w.row === cell.row && w.col === cell.col && w.orientation === 'vertical');

    return (
        <div
            className={`cell ${cell.visitedOrder !== null ? 'visited' : ''} ${cell.isFixed ? 'fixed' : ''}`}
        >
            {cell.value}
            {hWall && <div className="wall-h" />}
            {vWall && <div className="wall-v" />}
        </div>
    );
};
