import React, { useState, useCallback, useRef } from 'react';

const EMPTY_BOARD = Array(9).fill().map(() => Array(9).fill(0));

const SudokuSolver = () => {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [solving, setSolving] = useState(false);
  const [speed, setSpeed] = useState(50);
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

  const solve = useCallback(() => {
    const solveSudoku = async (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (cancelRef.current) return false;
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                setBoard([...board]);
                await new Promise(resolve => setTimeout(resolve, 100 - speed));
                if (await solveSudoku(board)) {
                  return true;
                }
                board[row][col] = 0;
                setBoard([...board]);
                await new Promise(resolve => setTimeout(resolve, 100 - speed));
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
    solveSudoku([...board]).then(() => {
      setSolving(false);
    });
  }, [board, speed]);

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
                  backgroundColor: cell ? '#e6f3ff' : '#fff',
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
        <button onClick={handleClearBoard} disabled={solving} style={styles.button}>
          Clear Board
        </button>
        <button onClick={handleCancel} disabled={!solving} style={styles.button}>
          Cancel
        </button>
      </div>
      <div style={styles.speedControl}>
        <label htmlFor="speedRange">Speed: {speed}%</label>
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
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  board: {
    display: 'grid',
    gridTemplateRows: 'repeat(9, 1fr)',
    gap: '1px',
    backgroundColor: '#000',
    border: '2px solid #000',
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
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  speedControl: {
    marginTop: '20px',
  },
  slider: {
    width: '100%',
    marginTop: '10px',
  },
};

export default SudokuSolver;
