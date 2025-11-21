export type Coordinate = {
  row: number;
  col: number;
};

export type CellType = 'empty' | 'start' | 'end' | 'number';

export interface Cell {
  row: number;
  col: number;
  value: number | null; // The number in the cell, if any
  isFixed: boolean; // True if the number was part of the initial puzzle
  visitedOrder: number | null; // The order in which the user visited this cell (1, 2, 3...)
}

export interface Wall {
  row: number;
  col: number;
  orientation: 'horizontal' | 'vertical';
}

export interface Level {
  id: string;
  rows: number;
  cols: number;
  initialValues: { row: number; col: number; value: number }[];
  walls: Wall[];
}

export interface GameState {
  level: Level;
  grid: Cell[][];
  currentPath: Coordinate[];
  isComplete: boolean;
  lastVisitedNumber: number; // The last fixed number we successfully connected to
}
