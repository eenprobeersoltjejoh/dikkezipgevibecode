import type { Cell, Coordinate, GameState, Level, Wall } from './types';

export const initializeGame = (level: Level): GameState => {
    const grid: Cell[][] = Array.from({ length: level.rows }, (_, r) =>
        Array.from({ length: level.cols }, (_, c) => ({
            row: r,
            col: c,
            value: null,
            isFixed: false,
            visitedOrder: null,
        }))
    );

    // Set initial values
    level.initialValues.forEach(({ row, col, value }) => {
        grid[row][col].value = value;
        grid[row][col].isFixed = true;
    });

    // Find start cell (usually 1)
    const startCell = level.initialValues.find((v) => v.value === 1);
    const currentPath: Coordinate[] = [];
    let lastVisitedNumber = 0;

    if (startCell) {
        grid[startCell.row][startCell.col].visitedOrder = 1;
        currentPath.push({ row: startCell.row, col: startCell.col });
        lastVisitedNumber = 1;
    }

    return {
        level,
        grid,
        currentPath,
        isComplete: false,
        lastVisitedNumber,
    };
};

export const isValidMove = (
    gameState: GameState,
    target: Coordinate
): boolean => {
    const { currentPath, level, grid } = gameState;
    if (currentPath.length === 0) return false;

    const current = currentPath[currentPath.length - 1];

    // 1. Check bounds
    if (
        target.row < 0 ||
        target.row >= level.rows ||
        target.col < 0 ||
        target.col >= level.cols
    ) {
        return false;
    }

    // 2. Check adjacency (orthogonal only)
    const dRow = Math.abs(target.row - current.row);
    const dCol = Math.abs(target.col - current.col);

    // Special case: Allow clicking on ANY part of the existing path (for rewind)
    // But if it's NOT in the path, it must be adjacent.
    const inPathIndex = currentPath.findIndex(p => p.row === target.row && p.col === target.col);

    if (inPathIndex === -1) {
        // Not in path, must be adjacent
        if (dRow + dCol !== 1) return false;
    } else {
        // In path, allow it (rewind)
        return true;
    }

    // 3. Check if already visited (and not handled by rewind above)
    if (grid[target.row][target.col].visitedOrder !== null && inPathIndex === -1) {
        return false;
    }

    // 4. Check walls (only if moving forward)
    if (inPathIndex === -1 && hasWall(level.walls, current, target)) {
        return false;
    }

    // 5. Check number sequence (only if moving forward)
    if (inPathIndex === -1) {
        const targetCell = grid[target.row][target.col];
        if (targetCell.isFixed && targetCell.value !== null) {
            if (targetCell.value !== gameState.lastVisitedNumber + 1) {
                return false;
            }
        }
    }

    return true;
};

const hasWall = (walls: Wall[], from: Coordinate, to: Coordinate): boolean => {
    return walls.some((wall) => {
        if (wall.orientation === 'horizontal') {
            if (from.col === wall.col && to.col === wall.col) {
                if (
                    (from.row === wall.row && to.row === wall.row + 1) ||
                    (from.row === wall.row + 1 && to.row === wall.row)
                ) {
                    return true;
                }
            }
        } else {
            if (from.row === wall.row && to.row === wall.row) {
                if (
                    (from.col === wall.col && to.col === wall.col + 1) ||
                    (from.col === wall.col + 1 && to.col === wall.col)
                ) {
                    return true;
                }
            }
        }
        return false;
    });
};

export const makeMove = (gameState: GameState, target: Coordinate): GameState => {
    const { currentPath, grid } = gameState;

    // Check if target is in the current path (rewind)
    const pathIndex = currentPath.findIndex(p => p.row === target.row && p.col === target.col);

    if (pathIndex !== -1 && pathIndex < currentPath.length - 1) {
        // Rewind to this point
        const newGrid = grid.map(row => row.map(cell => ({ ...cell })));

        // Clear visited status for all cells AFTER the target
        for (let i = pathIndex + 1; i < currentPath.length; i++) {
            const p = currentPath[i];
            newGrid[p.row][p.col].visitedOrder = null;
        }

        const newPath = currentPath.slice(0, pathIndex + 1);

        // Re-calculate lastVisitedNumber
        let newLastVisited = 0;
        for (const p of newPath) {
            const val = newGrid[p.row][p.col].value;
            if (val !== null && newGrid[p.row][p.col].isFixed) {
                if (val > newLastVisited) newLastVisited = val;
            }
        }

        return {
            ...gameState,
            grid: newGrid,
            currentPath: newPath,
            lastVisitedNumber: newLastVisited,
            isComplete: false
        };
    }

    // Normal move
    if (!isValidMove(gameState, target)) {
        return gameState;
    }

    const newGrid = grid.map(row => row.map(cell => ({ ...cell })));
    const targetCell = newGrid[target.row][target.col];

    targetCell.visitedOrder = currentPath.length + 1;

    let newLastVisited = gameState.lastVisitedNumber;
    if (targetCell.isFixed && targetCell.value !== null) {
        newLastVisited = targetCell.value;
    }

    const newPath = [...currentPath, target];

    // Check win condition
    const totalCells = gameState.level.rows * gameState.level.cols;
    const isPathComplete = newPath.length === totalCells;

    const maxNumber = Math.max(...gameState.level.initialValues.map(v => v.value));

    // The puzzle is complete if:
    // 1. All cells are filled (path covers entire grid)
    // 2. We've visited the max number (all numbers visited in sequence)
    const hasVisitedAllNumbers = newLastVisited === maxNumber;

    return {
        ...gameState,
        grid: newGrid,
        currentPath: newPath,
        lastVisitedNumber: newLastVisited,
        isComplete: isPathComplete && hasVisitedAllNumbers
    };
};
