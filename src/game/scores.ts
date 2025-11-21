export interface Score {
    difficulty: 'easy' | 'medium' | 'hard';
    time: number;
    date: string;
    playerName: string;
}

const STORAGE_KEY = 'zip_puzzle_scores';

export const saveScore = (difficulty: 'easy' | 'medium' | 'hard', time: number, playerName: string): void => {
    const scores = getScores();
    const newScore: Score = {
        difficulty,
        time,
        date: new Date().toISOString(),
        playerName
    };

    scores.push(newScore);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
};

export const getScores = (): Score[] => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
};

export const getBestTimeForDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): number | null => {
    const scores = getScores();
    const difficultyScores = scores.filter(s => s.difficulty === difficulty);

    if (difficultyScores.length === 0) return null;

    return Math.min(...difficultyScores.map(s => s.time));
};
