import React, { useState, useRef, useCallback } from 'react';

const EMPTY_BOARD = Array(9).fill().map(() => Array(9).fill(0));

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

const validateBoard = (board) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) {
        const temp = board[row][col];
        board[row][col] = 0;
        if (!isValid(board, row, col, temp)) {
          board[row][col] = temp;
          return false;
        }
        board[row][col] = temp;
      }
    }
  }
  return true;
};

const solveSudokuSync = (board, cancelRef) => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (cancelRef.current) return false;
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudokuSync(board, cancelRef)) {
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

const SudokuSolver = () => {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [solving, setSolving] = useState(false);
  const [speed, setSpeed] = useState(50);
  const [difficulty, setDifficulty] = useState('medium');
  const [showVisualization, setShowVisualization] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [invalidBoard, setInvalidBoard] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const cancelRef = useRef(false);

  const solve = useCallback(async () => {
    if (!validateBoard(board)) {
      setInvalidBoard(true);
      return;
    }

    const solveSudoku = async (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (cancelRef.current) return false;
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
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

    setSolving(true);
    setInvalidBoard(false);
    cancelRef.current = false;
    
    const boardCopy = board.map(row => [...row]);
    
    if (showVisualization) {
      const solved = await solveSudoku(boardCopy);
      if (solved && !cancelRef.current) {
        setBoard(boardCopy);
      } else if (!cancelRef.current) {
        setInvalidBoard(true);
      }
    } else {
      const solved = solveSudokuSync(boardCopy, cancelRef);
      if (solved && !cancelRef.current) {
        setBoard(boardCopy);
      } else if (!cancelRef.current) {
        setInvalidBoard(true);
      }
    }
    setSolving(false);
  }, [board, speed, showVisualization]);

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
    solveSudokuSync(newBoard, { current: false });

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
    setInvalidBoard(false);
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setSolving(false);
  };

  const findNextCell = (row, col) => {
    for (let i = row * 9 + col + 1; i < 81; i++) {
      const nextRow = Math.floor(i / 9);
      const nextCol = i % 9;
      if (board[nextRow][nextCol] === 0) {
        return { row: nextRow, col: nextCol };
      }
    }
    for (let i = 0; i < row * 9 + col; i++) {
      const nextRow = Math.floor(i / 9);
      const nextCol = i % 9;
      if (board[nextRow][nextCol] === 0) {
        return { row: nextRow, col: nextCol };
      }
    }
    return null;
  };

  const handleCellChange = (value) => {
    if (!selectedCell) return;
    const { row, col } = selectedCell;
    const newValue = value === 0 ? 0 : parseInt(value, 10);
    if (isNaN(newValue) || newValue < 0 || newValue > 9) return;

    const newBoard = [...board];
    newBoard[row][col] = newValue;
    setBoard(newBoard);
    setInvalidBoard(!validateBoard(newBoard));

    // Find and select the next empty cell
    const nextCell = findNextCell(row, col);
    if (nextCell) {
      setSelectedCell(nextCell);
    }
  };

  const handleCellClick = (row, col) => {
    if (!solving) {
      setSelectedCell({ row, col });
    }
  };

  const handleClearBoard = () => {
    setBoard(EMPTY_BOARD.map(row => [...row]));
    setInvalidBoard(false);
    setSelectedCell(null);
  };

  const renderNumberInput = () => {
    if (!showKeyboard) return null;
    return (
      <div style={styles.numberInput}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            style={styles.numberButton}
            onClick={() => handleCellChange(num)}
          >
            {num}
          </button>
        ))}
        <button
          style={styles.numberButton}
          onClick={() => handleCellChange(0)}
        >
          Clear
        </button>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sudoku Solver</h1>
      <div style={styles.board}>
        {board.map((row, rowIndex) => (
          <div key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                style={{
                  ...styles.cell,
                  backgroundColor: selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex
                    ? '#3498db'
                    : cell ? '#2c3e50' : '#34495e',
                  color: '#ecf0f1',
                  borderRight: (colIndex + 1) % 3 === 0 ? '2px solid #2c3e50' : '1px solid #34495e',
                  borderBottom: (rowIndex + 1) % 3 === 0 ? '2px solid #2c3e50' : '1px solid #34495e',
                }}
                onClick={() => handleCellClick(rowIndex, colIndex)}
              >
                {cell || ''}
              </div>
            ))}
          </div>
        ))}
      </div>
      {invalidBoard && (
        <div style={styles.invalidBanner}>
          The current board configuration is invalid.
        </div>
      )}
      <button 
        onClick={() => setShowKeyboard(!showKeyboard)} 
        style={styles.toggleButton}
      >
        {showKeyboard ? 'Hide Keyboard' : 'Show Keyboard'}
      </button>
      {renderNumberInput()}
      <div style={styles.controls}>
        <button 
          onClick={solve} 
          disabled={solving} 
          style={styles.button}
        >
          Solve
        </button>
        <button onClick={generatePuzzle} disabled={solving} style={styles.button}>
          Generate
        </button>
        <button onClick={handleClearBoard} disabled={solving} style={styles.button}>
          Clear
        </button>
        <button onClick={handleCancel} disabled={!solving} style={styles.button}>
          Stop
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
    gap: '0',
    backgroundColor: '#2c3e50',
    border: '2px solid #2c3e50',
    borderRadius: '5px',
    overflow: 'hidden',
    marginBottom: '20px',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: '0',
  },
  cell: {
    width: '100%',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    borderTop: '1px solid #34495e',
    borderLeft: '1px solid #34495e',
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
  numberInput: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    marginTop: '20px',
  },
  numberButton: {
    padding: '15px',
    fontSize: '18px',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  invalidBanner: {
    backgroundColor: '#e74c3c',
    color: '#ecf0f1',
    padding: '10px',
    textAlign: 'center',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  toggleButton: {
    width: '100%',
    padding: '10px',
    fontSize: '16px',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'background-color 0.3s',
  },
};

export default SudokuSolver;
