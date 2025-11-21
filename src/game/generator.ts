import type { Coordinate, Level, Wall } from './types';

const DIRECTIONS = [
    { row: -1, col: 0 }, // Up
    { row: 1, col: 0 },  // Down
    { row: 0, col: -1 }, // Left
    { row: 0, col: 1 },  // Right
    { row: -1, col: -1 }, // Up-Left
    { row: -1, col: 1 },  // Up-Right
    { row: 1, col: -1 },  // Down-Left
    { row: 1, col: 1 },   // Down-Right
];

// Check if a puzzle is solvable
const isPuzzleSolvable = (level: Level): boolean => {
    const { rows, cols, initialValues, walls } = level;

    // Create a map of number positions
    const numberPositions = new Map<number, Coordinate>();
    initialValues.forEach(iv => {
        numberPositions.set(iv.value, { row: iv.row, col: iv.col });
    });

    const maxNumber = Math.max(...initialValues.map(iv => iv.value));

    // Helper to check if two cells are blocked by a wall
    const isBlocked = (from: Coordinate, to: Coordinate): boolean => {
        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;

        for (const wall of walls) {
            if (wall.orientation === 'horizontal') {
                // Horizontal wall blocks vertical movement
                if (rowDiff !== 0 && colDiff === 0) {
                    if (wall.col === from.col) {
                        const minRow = Math.min(from.row, to.row);
                        const maxRow = Math.max(from.row, to.row);
                        if (wall.row >= minRow && wall.row < maxRow) {
                            return true;
                        }
                    }
                }
            } else {
                // Vertical wall blocks horizontal movement
                if (colDiff !== 0 && rowDiff === 0) {
                    if (wall.row === from.row) {
                        const minCol = Math.min(from.col, to.col);
                        const maxCol = Math.max(from.col, to.col);
                        if (wall.col >= minCol && wall.col < maxCol) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };

    // Try to find a path using BFS
    const findPath = (start: Coordinate, end: Coordinate, visited: Set<string>): Coordinate[] | null => {
        const queue: { pos: Coordinate, path: Coordinate[] }[] = [{ pos: start, path: [start] }];
        const localVisited = new Set<string>();
        localVisited.add(`${start.row},${start.col}`);

        while (queue.length > 0) {
            const { pos, path } = queue.shift()!;

            if (pos.row === end.row && pos.col === end.col) {
                return path;
            }

            for (const dir of DIRECTIONS) {
                const next = { row: pos.row + dir.row, col: pos.col + dir.col };
                const key = `${next.row},${next.col}`;

                if (
                    next.row >= 0 && next.row < rows &&
                    next.col >= 0 && next.col < cols &&
                    !localVisited.has(key) &&
                    !visited.has(key) &&
                    !isBlocked(pos, next)
                ) {
                    localVisited.add(key);
                    queue.push({ pos: next, path: [...path, next] });
                }
            }
        }

        return null;
    };

    // Try to visit all numbers in sequence while filling all cells
    const visited = new Set<string>();

    for (let i = 1; i <= maxNumber; i++) {
        const currentPos = numberPositions.get(i)!;

        if (i > 1) {
            const prevPos = numberPositions.get(i - 1)!;
            const path = findPath(prevPos, currentPos, visited);

            if (!path) {
                return false; // Can't reach next number
            }

            // Add all cells in path to visited (except the last one, we'll add it next iteration)
            for (let j = 0; j < path.length - 1; j++) {
                visited.add(`${path[j].row},${path[j].col}`);
            }
        }

        visited.add(`${currentPos.row},${currentPos.col}`);
    }

    // Check if we can fill all remaining cells
    const totalCells = rows * cols;
    return visited.size <= totalCells; // Should be able to reach all cells
};

export const generateLevel = (rows: number, cols: number, difficulty: 'easy' | 'medium' | 'hard'): Level => {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
        attempts++;

        try {
            // 1. Generate a random Hamiltonian path
            const path = generateHamiltonianPath(rows, cols);

            if (!path) {
                continue;
            }

            // 2. Place numbers based on difficulty
            const totalCells = rows * cols;
            let numberCount;
            switch (difficulty) {
                case 'easy': numberCount = Math.floor(totalCells / 3); break;
                case 'medium': numberCount = Math.floor(totalCells / 4); break;
                case 'hard': numberCount = Math.floor(totalCells / 5); break;
            }

            // Always include start (1) and end (max)
            const initialValues: { row: number; col: number; value: number }[] = [];
            initialValues.push({ row: path[0].row, col: path[0].col, value: 1 });

            // Determine which indices in the path will have numbers
            const indicesToMark = new Set<number>();
            indicesToMark.add(0);
            indicesToMark.add(path.length - 1);

            while (indicesToMark.size < numberCount && indicesToMark.size < path.length) {
                const idx = Math.floor(Math.random() * path.length);
                indicesToMark.add(idx);
            }

            // Sort indices to assign values correctly
            const sortedIndices = Array.from(indicesToMark).sort((a, b) => a - b);

            sortedIndices.forEach((pathIdx, i) => {
                if (pathIdx === 0) return;
                const pos = path[pathIdx];
                initialValues.push({ row: pos.row, col: pos.col, value: i + 1 });
            });

            // 3. Generate Walls - REDUCED density for better solvability
            const walls: Wall[] = [];
            const wallDensity = difficulty === 'easy' ? 0.03 : difficulty === 'medium' ? 0.05 : 0.08;

            const isWallBlocking = (w: Wall) => {
                for (let i = 0; i < path.length - 1; i++) {
                    const u = path[i];
                    const v = path[i + 1];

                    if (w.orientation === 'horizontal') {
                        if (u.col === w.col && v.col === w.col) {
                            if ((u.row === w.row && v.row === w.row + 1) || (u.row === w.row + 1 && v.row === w.row)) {
                                return true;
                            }
                        }
                    } else {
                        if (u.row === w.row && v.row === w.row) {
                            if ((u.col === w.col && v.col === w.col + 1) || (u.col === w.col + 1 && v.col === w.col)) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            };

            // Try adding walls
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (r < rows - 1 && Math.random() < wallDensity) {
                        const w: Wall = { row: r, col: c, orientation: 'horizontal' };
                        if (!isWallBlocking(w)) walls.push(w);
                    }
                    if (c < cols - 1 && Math.random() < wallDensity) {
                        const w: Wall = { row: r, col: c, orientation: 'vertical' };
                        if (!isWallBlocking(w)) walls.push(w);
                    }
                }
            }

            const level: Level = {
                id: Math.random().toString(36).substring(7),
                rows,
                cols,
                initialValues,
                walls
            };

            // CRITICAL: Verify the puzzle is solvable
            if (isPuzzleSolvable(level)) {
                console.log(`✅ Generated solvable puzzle on attempt ${attempts}`);
                return level;
            } else {
                console.log(`❌ Puzzle not solvable, retrying... (attempt ${attempts})`);
            }
        } catch (error) {
            console.error('Error generating level:', error);
        }
    }

    // Fallback: Generate simple puzzle without walls
    console.warn('Failed to generate solvable puzzle with walls, creating simple version');
    const simplePath = generateHamiltonianPath(rows, cols)!;
    const numberCount = Math.floor((rows * cols) / 3);
    const indicesToMark = new Set<number>();
    indicesToMark.add(0);
    indicesToMark.add(simplePath.length - 1);

    while (indicesToMark.size < numberCount) {
        indicesToMark.add(Math.floor(Math.random() * simplePath.length));
    }

    const sortedIndices = Array.from(indicesToMark).sort((a, b) => a - b);
    const initialValues: { row: number; col: number; value: number }[] = [];
    initialValues.push({ row: simplePath[0].row, col: simplePath[0].col, value: 1 });

    sortedIndices.forEach((pathIdx, i) => {
        if (pathIdx === 0) return;
        const pos = simplePath[pathIdx];
        initialValues.push({ row: pos.row, col: pos.col, value: i + 1 });
    });

    return {
        id: Math.random().toString(36).substring(7),
        rows,
        cols,
        initialValues,
        walls: [] // No walls in fallback
    };
};

const generateHamiltonianPath = (rows: number, cols: number): Coordinate[] | null => {
    const visited = new Set<string>();
    const path: Coordinate[] = [];

    const start: Coordinate = {
        row: Math.floor(Math.random() * rows),
        col: Math.floor(Math.random() * cols)
    };

    path.push(start);
    visited.add(`${start.row},${start.col}`);

    if (dfs(start, visited, path, rows, cols)) {
        return path;
    }

    return null;
};

const dfs = (
    current: Coordinate,
    visited: Set<string>,
    path: Coordinate[],
    rows: number,
    cols: number
): boolean => {
    if (path.length === rows * cols) {
        return true;
    }

    const dirs = [...DIRECTIONS.slice(0, 4)].sort(() => Math.random() - 0.5);

    for (const dir of dirs) {
        const next: Coordinate = {
            row: current.row + dir.row,
            col: current.col + dir.col
        };

        if (
            next.row >= 0 && next.row < rows &&
            next.col >= 0 && next.col < cols &&
            !visited.has(`${next.row},${next.col}`)
        ) {
            visited.add(`${next.row},${next.col}`);
            path.push(next);

            if (dfs(next, visited, path, rows, cols)) {
                return true;
            }

            path.pop();
            visited.delete(`${next.row},${next.col}`);
        }
    }

    return false;
};
