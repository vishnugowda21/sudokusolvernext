import React, { useState, useCallback, useRef } from 'react';

const EMPTY_BOARD = Array(9).fill().map(() => Array(9).fill(0));

const SudokuSolver = () => {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [solving, setSolving] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [difficulty, setDifficulty] = useState('medium');
  const [showVisualization, setShowVisualization] = useState(true);
  const cancelRef = useRef(false);

  const isValid = (board, row, col, num) => {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num || board[x][col] === num) return false;
    }
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[boxRow + i][boxCol + j] === num) return false;
      }
    }
    return true;
  };

  const solveSudokuSync = (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              if (solveSudokuSync(board)) {
                return true;
              }
              board[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  const generatePuzzle = () => {
    const newBoard = Array(9).fill().map(() => Array(9).fill(0));
    const numClues = {
      easy: 40,
      medium: 35,
      hard: 30
    }[difficulty];

    // Fill diagonal 3x3 boxes
    for (let i = 0; i < 9; i += 3) {
      for (let j = 1; j <= 9; j++) {
        let row, col;
        do {
          row = Math.floor(Math.random() * 3) + i;
          col = Math.floor(Math.random() * 3) + i;
        } while (newBoard[row][col] !== 0);
        newBoard[row][col] = j;
      }
    }

    // Solve the board
    solveSudokuSync(newBoard);

    // Remove numbers to create the puzzle
    let count = 81 - numClues;
    while (count > 0) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      if (newBoard[row][col] !== 0) {
        newBoard[row][col] = 0;
        count--;
      }
    }

    setBoard(newBoard);
  };

  const solve = useCallback(() => {
    const solveSudoku = async (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (cancelRef.current) return false;
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                if (showVisualization) {
                  setBoard([...board]);
                  await new Promise(resolve => setTimeout(resolve, 100 - speed));
                }
                if (await solveSudoku(board)) {
                  return true;
                }
                board[row][col] = 0;
                if (showVisualization) {
                  setBoard([...board]);
                  await new Promise(resolve => setTimeout(resolve, 100 - speed));
                }
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    cancelRef.current = false;
    setSolving(true);
    
    const boardCopy = board.map(row => [...row]);
    
    if (showVisualization) {
      solveSudoku(boardCopy).then((solved) => {
        if (solved) {
          setBoard(boardCopy);
        } else {
          alert("No solution exists for this puzzle.");
        }
        setSolving(false);
      });
    } else {
      const solved = solveSudokuSync(boardCopy);
      if (solved) {
        setBoard(boardCopy);
      } else {
        alert("No solution exists for this puzzle.");
      }
      setSolving(false);
    }
  }, [board, speed, showVisualization]);

  const handleCancel = () => {
    cancelRef.current = true;
    setSolving(false);
  };

  const handleCellChange = (row, col, value) => {
    const newBoard = [...board];
    newBoard[row][col] = value === '' ? 0 : parseInt(value, 10);
    setBoard(newBoard);
  };

  const handleClearBoard = () => {
    setBoard(EMPTY_BOARD);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sudoku Solver</h1>
      <div style={styles.board}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <input
                key={colIndex}
                type="number"
                min="1"
                max="9"
                value={cell || ''}
                onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                style={{
                  ...styles.cell,
                  backgroundColor: cell ? '#2c3e50' : '#34495e',
                  color: '#ecf0f1',
                }}
                disabled={solving}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={styles.controls}>
        <button onClick={solve} disabled={solving} style={styles.button}>
          Solve
        </button>
        <button onClick={generatePuzzle} disabled={solving} style={styles.button}>
          Generate
        </button>
        <button onClick={handleClearBoard} disabled={solving} style={styles.button}>
          Clear
        </button>
        <button onClick={handleCancel} disabled={!solving} style={styles.button}>
          Cancel
        </button>
      </div>
      <div style={styles.difficultyControl}>
        <label htmlFor="difficulty" style={styles.label}>Difficulty:</label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          style={styles.select}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div style={styles.speedControl}>
        <label htmlFor="speedRange" style={styles.label}>Speed: {speed}%</label>
        <input
          type="range"
          id="speedRange"
          min="1"
          max="100"
          value={speed}
          onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
          style={styles.slider}
        />
      </div>
      <div style={styles.visualizationControl}>
        <label style={styles.label}>
          <input
            type="checkbox"
            checked={showVisualization}
            onChange={(e) => setShowVisualization(e.target.checked)}
            style={styles.checkbox}
          />
          Show solving visualization
        </label>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#1a1a1a',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(255,255,255,0.1)',
    color: '#ecf0f1',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#ecf0f1',
  },
  board: {
    display: 'grid',
    gridTemplateRows: 'repeat(9, 1fr)',
    gap: '1px',
    backgroundColor: '#2c3e50',
    border: '2px solid #2c3e50',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: '1px',
  },
  cell: {
    width: '100%',
    height: '40px',
    textAlign: 'center',
    fontSize: '18px',
    border: 'none',
    transition: 'background-color 0.3s',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  },
  button: {
    padding: '10px 15px',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#3498db',
    color: '#ecf0f1',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  difficultyControl: {
    marginTop: '20px',
  },
  speedControl: {
    marginTop: '20px',
  },
  visualizationControl: {
    marginTop: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#ecf0f1',
  },
  select: {
    width: '100%',
    padding: '5px',
    fontSize: '16px',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    border: '1px solid #34495e',
    borderRadius: '5px',
  },
  slider: {
    width: '100%',
    marginTop: '10px',
    backgroundColor: '#2c3e50',
  },
  checkbox: {
    marginRight: '10px',
  },
};

export default SudokuSolver;
