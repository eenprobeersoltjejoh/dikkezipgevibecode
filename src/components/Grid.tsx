import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { GameState, Coordinate } from '../game/types';
import { Cell } from './Cell';

interface GridProps {
    gameState: GameState;
    onMove: (target: Coordinate) => void;
}

export const Grid: React.FC<GridProps> = ({ gameState, onMove }) => {
    const { grid, level, currentPath } = gameState;
    const gridRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const animationFrameRef = useRef<number | null>(null);
    const lastProcessedCellRef = useRef<Coordinate | null>(null);
    const currentMouseCellRef = useRef<Coordinate | null>(null);
    const moveQueueRef = useRef<Coordinate[]>([]);

    // Sync last processed cell with path head
    useEffect(() => {
        if (currentPath.length > 0) {
            lastProcessedCellRef.current = currentPath[currentPath.length - 1];
        } else {
            lastProcessedCellRef.current = null;
        }
    }, [currentPath]);

    const getCellFromPoint = useCallback((clientX: number, clientY: number): Coordinate | null => {
        if (!gridRef.current) return null;
        const rect = gridRef.current.getBoundingClientRect();
        const x = clientX - rect.left - 10; // 10px padding
        const y = clientY - rect.top - 10;

        const col = Math.floor(x / 70);
        const row = Math.floor(y / 70);

        if (row >= 0 && row < level.rows && col >= 0 && col < level.cols) {
            return { row, col };
        }
        return null;
    }, [level.rows, level.cols]);

    // Get all cells along a line from start to end (Bresenham's line algorithm)
    const getLineCells = useCallback((start: Coordinate, end: Coordinate): Coordinate[] => {
        const cells: Coordinate[] = [];

        let x0 = start.col;
        let y0 = start.row;
        const x1 = end.col;
        const y1 = end.row;

        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            // Add current cell (but not the start, since we're already there)
            if (!(x0 === start.col && y0 === start.row)) {
                cells.push({ row: y0, col: x0 });
            }

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }

        return cells;
    }, []);

    // Process queued moves in animation frame
    const processQueue = useCallback(() => {
        if (moveQueueRef.current.length === 0) {
            animationFrameRef.current = null;
            return;
        }

        // Process all queued moves
        const movesToProcess = [...moveQueueRef.current];
        moveQueueRef.current = [];

        for (const move of movesToProcess) {
            onMove(move);
        }

        // Continue processing if drag is still active
        if (isDragging && currentMouseCellRef.current) {
            animationFrameRef.current = requestAnimationFrame(processQueue);
        } else {
            animationFrameRef.current = null;
        }
    }, [isDragging, onMove]);

    const queueMove = useCallback((target: Coordinate) => {
        const last = lastProcessedCellRef.current;

        // If no previous cell, just move to target
        if (!last) {
            moveQueueRef.current.push(target);
            lastProcessedCellRef.current = target;
            return;
        }

        // If same cell, skip
        if (last.row === target.row && last.col === target.col) {
            return;
        }

        // Check if target is already in current path
        const targetInPath = currentPath.findIndex(p => p.row === target.row && p.col === target.col);

        if (targetInPath >= 0) {
            // Check if this is intentional backtracking (moving to the previous cell)
            // Allow rewinding only if target is the second-to-last cell (one step back)
            const isSequentialBacktrack = targetInPath === currentPath.length - 2;

            if (isSequentialBacktrack) {
                // Intentional backward movement - allow rewind
                moveQueueRef.current.push(target);
                lastProcessedCellRef.current = target;
                return;
            } else {
                // Crossing over middle of path - ignore to prevent accidental rewinding
                return;
            }
        }

        // Get all cells between last and target
        const interpolatedCells = getLineCells(last, target);

        // Queue all interpolated cells
        for (const cell of interpolatedCells) {
            moveQueueRef.current.push(cell);
        }

        lastProcessedCellRef.current = target;
    }, [currentPath, getLineCells]);

    const startProcessing = useCallback(() => {
        if (!animationFrameRef.current && moveQueueRef.current.length > 0) {
            animationFrameRef.current = requestAnimationFrame(processQueue);
        }
    }, [processQueue]);

    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        setIsDragging(true);

        const cell = getCellFromPoint(e.clientX, e.clientY);
        if (cell) {
            currentMouseCellRef.current = cell;
            queueMove(cell);
            startProcessing();
        }
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        e.preventDefault();

        const cell = getCellFromPoint(e.clientX, e.clientY);
        if (!cell) return;

        currentMouseCellRef.current = cell;

        // Queue the move with interpolation
        queueMove(cell);
        startProcessing();
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        currentMouseCellRef.current = null;

        // Process any remaining queued moves
        if (moveQueueRef.current.length > 0 && !animationFrameRef.current) {
            animationFrameRef.current = requestAnimationFrame(processQueue);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // Calculate path points for SVG
    const getPathPoints = () => {
        if (currentPath.length < 2) return '';

        return currentPath.map(p => {
            const x = p.col * 70 + 35 + 10;
            const y = p.row * 70 + 35 + 10;
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div
            className="grid-container"
            ref={gridRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
        >
            <svg className="path-overlay" width={level.cols * 70 + 20} height={level.rows * 70 + 20}>
                <polyline
                    points={getPathPoints()}
                    className="path-line"
                />
                {currentPath.length > 0 && (() => {
                    const last = currentPath[currentPath.length - 1];
                    const x = last.col * 70 + 35 + 10;
                    const y = last.row * 70 + 35 + 10;
                    return <circle cx={x} cy={y} r="8" fill="var(--color-primary)" />;
                })()}
            </svg>

            {grid.map((row, r) => (
                <div key={r} className="grid-row">
                    {row.map((cell, c) => (
                        <Cell
                            key={`${r}-${c}`}
                            cell={cell}
                            walls={level.walls}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};
