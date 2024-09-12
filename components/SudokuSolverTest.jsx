import React, { useState, useRef, useCallback } from 'react';

const EMPTY_BOARD = Array(9).fill().map(() => Array(9).fill(0));

const isValid = (board, row, col, num) => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (x !== col && board[row][x] === num) return false;
  }
  
  // Check column
  for (let x = 0; x < 9; x++) {
    if (x !== row && board[x][col] === num) return false;
  }
  
  // Check 3x3 box
  let boxRow = Math.floor(row / 3) * 3;
  let boxCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if ((boxRow + i !== row || boxCol + j !== col) && board[boxRow + i][boxCol + j] === num) return false;
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

const generateSudoku = (difficulty) => {
  const board = Array(9).fill().map(() => Array(9).fill(0));
  const numToFill = difficulty === 'easy' ? 35 : difficulty === 'medium' ? 30 : 25;

  const fillCell = (row, col) => {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [nums[i], nums[j]] = [nums[j], nums[i]];
    }

    for (let num of nums) {
      if (isValid(board, row, col, num)) {
        board[row][col] = num;
        if (col === 8) {
          if (row === 8) return true;
          else if (fillCell(row + 1, 0)) return true;
        } else if (fillCell(row, col + 1)) return true;
        board[row][col] = 0;
      }
    }
    return false;
  };

  fillCell(0, 0);

  let cellsToRemove = 81 - numToFill;
  while (cellsToRemove > 0) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
    if (board[row][col] !== 0) {
      board[row][col] = 0;
      cellsToRemove--;
    }
  }

  return board;
};

const Board = ({ board, isFixed, selectedCell, onCellClick, systemFilledCells, mode }) => {
  const renderCell = (value, row, col) => {
    const isSelected = selectedCell && selectedCell.row === row && selectedCell.col === col;
    const isSystemFilled = mode === 'answer' && systemFilledCells[row][col];

    let cellColor;
    if (mode === 'answer') {
      cellColor = isSystemFilled ? '#e74c3c' : '#ecf0f1';
    } else {
      cellColor = isFixed[row][col] ? '#e74c3c' : '#ecf0f1';
    }

    return (
      <div
        key={`${row}-${col}`}
        style={{
          ...styles.cell,
          backgroundColor: isSelected ? '#3498db' : isFixed[row][col] ? '#2c3e50' : '#34495e',
          color: cellColor,
          fontWeight: isFixed[row][col] || isSystemFilled ? 'bold' : 'normal',
          borderRight: (col + 1) % 3 === 0 ? '2px solid #2c3e50' : undefined,
          borderBottom: (row + 1) % 3 === 0 ? '2px solid #2c3e50' : undefined,
        }}
        onClick={() => onCellClick(row, col)}
      >
        {value !== 0 ? value : ''}
      </div>
    );
  };


  return (
    <div style={styles.board}>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} style={styles.row}>
          {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
        </div>
      ))}
    </div>
  );
};

const NumberInput = ({ onNumberClick }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div style={styles.numberInput}>
      {numbers.map((num) => (
        <button
          key={num}
          style={styles.numberButton}
          onClick={() => onNumberClick(num)}
        >
          {num}
        </button>
      ))}
      <button
        style={{...styles.numberButton,background:"red"}}
        onClick={() => onNumberClick(0)}
      >
        X
      </button>
    </div>
  );
};

const ModeToggle = ({ mode, onModeChange }) => {
  return (
    <div style={styles.modeToggleContainer}>
      <button
        style={{
          ...styles.modeToggleButton,
          ...styles.modeToggleButtonFirst,
          ...(mode === 'solve' ? styles.activeButton : {}),
        }}
        onClick={() => onModeChange('solve')}
      >
        Solve Mode
      </button>
      <button
        style={{
          ...styles.modeToggleButton,
          ...styles.modeToggleButtonLast,
          ...(mode === 'answer' ? styles.activeButton : {}),
        }}
        onClick={() => onModeChange('answer')}
      >
        Answer Mode
      </button>
    </div>
  );
};

const SudokuSolver = () => {
  const [board, setBoard] = useState(EMPTY_BOARD);
  const [originalBoard, setOriginalBoard] = useState(EMPTY_BOARD);
  const [isFixed, setIsFixed] = useState(Array(9).fill().map(() => Array(9).fill(false)));
  const [mode, setMode] = useState('solve');
  const [solving, setSolving] = useState(false);
  const [solved, setSolved] = useState(false);
  const [invalidBoard, setInvalidBoard] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [showVisualization, setShowVisualization] = useState(true);
  const [speed, setSpeed] = useState(50);
  const [showKeyboard, setShowKeyboard] = useState(true);
  const [validationMessage, setValidationMessage] = useState('');
  const [systemFilledCells, setSystemFilledCells] = useState(
    Array(9).fill().map(() => Array(9).fill(false))
  );
  const [boardGenerated, setBoardGenerated] = useState(false);

  const cancelRef = useRef(false);

  const handleCellClick = (row, col) => {
    if (!solving) {
      setSelectedCell({ row, col });
    }
  };

  const handleNumberClick = (number) => {
    if (!selectedCell || solving) return;
  
    const { row, col } = selectedCell;
    
    if (mode === 'solve' && !boardGenerated) {
      setValidationMessage('Please generate a board before entering numbers.');
      return;
    }
  
    if (isFixed[row][col]) return;
  
    const newBoard = board.map(row => [...row]);
    newBoard[row][col] = number;
  
    if (mode === 'answer') {
      if (isValid(newBoard, row, col, number) || number === 0) {
        setBoard(newBoard);
        setSystemFilledCells(prev => {
          const newSystemFilled = [...prev];
          newSystemFilled[row][col] = false;
          return newSystemFilled;
        });
        if (isBoardFull(newBoard)) {
          setSolved(validateBoard(newBoard));
        }
      } else {
        setValidationMessage('Invalid move ❌');
        return;
      }
    } else {
      setBoard(newBoard);
    }
  
    setValidationMessage('');
  
    if (number !== 0) {
      const nextCell = findNextEmptyCell(newBoard, row, col);
      if (nextCell) {
        setSelectedCell(nextCell);
      }
    }
  };

  const findNextEmptyCell = (board, row, col) => {
    for (let i = row * 9 + col + 1; i < 81; i++) {
      const newRow = Math.floor(i / 9);
      const newCol = i % 9;
      if (board[newRow][newCol] === 0 && !isFixed[newRow][newCol]) {
        return { row: newRow, col: newCol };
      }
    }
    return null;
  };

  const isBoardFull = (board) => {
    return board.every(row => row.every(cell => cell !== 0));
  };

  const handleGenerate = () => {
    if (mode !== 'solve') return;
    
    const newBoard = generateSudoku(difficulty);
    setBoard(newBoard);
    setOriginalBoard(newBoard.map(row => [...row]));
    setIsFixed(newBoard.map(row => row.map(cell => cell !== 0)));
    setSolved(false);
    setInvalidBoard(false);
    setSelectedCell(null);
    setValidationMessage('');
    setBoardGenerated(true);  // Set this to true when a board is generated
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

  const solveSudokuAsync = async (board) => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (cancelRef.current) return false;
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              setBoard([...board]);
              await new Promise(resolve => setTimeout(resolve, 100 - speed));
              if (await solveSudokuAsync(board)) {
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

  const handleSolve = useCallback(async () => {
    if (!validateBoard(board)) {
      setValidationMessage('The current board configuration is invalid. Please correct it before solving.');
      return;
    }

    setSolving(true);
    setInvalidBoard(false);
    cancelRef.current = false;

    const boardCopy = board.map(row => [...row]);

    if (showVisualization) {
      const solved = await solveSudokuAsync(boardCopy);
      if (solved && !cancelRef.current) {
        setBoard(boardCopy);
        setSolved(true);
        setValidationMessage('Solved ✔️');
      } else if (!cancelRef.current) {
        setValidationMessage('Unable to solve the puzzle ❌');
      }
    } else {
      const solved = solveSudokuSync(boardCopy, cancelRef);
      if (solved && !cancelRef.current) {
        setBoard(boardCopy);
        setSolved(true);
        setValidationMessage('Solved ✔️');
      } else if (!cancelRef.current) {
        setValidationMessage('Unable to solve the puzzle ❌');
      }
    }
    setSolving(false);
  }, [board, showVisualization, speed]);

  const handleClear = () => {
    if (solving) return;

    if (mode === 'solve') {
      setBoard(originalBoard.map(row => [...row]));
    } else {
      setBoard(EMPTY_BOARD);
      setIsFixed(Array(9).fill().map(() => Array(9).fill(false)));
    }

    setSolved(false);
    setInvalidBoard(false);
    setSelectedCell(null);
    setValidationMessage('');
  };

  const handleValidate = () => {
    if (solving) return;

    if (!isBoardFull(board)) {
      setValidationMessage('Please fill in all cells before validating.');
      return;
    }

    if (validateBoard(board)) {
      setValidationMessage('Solved ✔️');
      setSolved(true);
    } else {
      setValidationMessage('Invalid board configuration ❌');
      setSolved(false);
    }
  };

  const handleShowAnswer = useCallback(async () => {
    if (mode !== 'answer' || solving) return;
  
    if (!validateBoard(board)) {
      setValidationMessage('The current board configuration is invalid. Please correct it before showing the answer.');
      return;
    }
  
    setSolving(true);
    cancelRef.current = false;
  
    // Create a copy of the current board, preserving user inputs
    const boardCopy = board.map(row => [...row]);
  
    // Create a new systemFilledCells array
    const newSystemFilledCells = Array(9).fill().map(() => Array(9).fill(false));
  
    const solveSudoku = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === 0) {
            for (let num = 1; num <= 9; num++) {
              if (isValid(board, row, col, num)) {
                board[row][col] = num;
                newSystemFilledCells[row][col] = true; // Mark as system-filled
                if (solveSudoku(board)) {
                  return true;
                }
                board[row][col] = 0;
                newSystemFilledCells[row][col] = false;
              }
            }
            return false;
          }
        }
      }
      return true;
    };
  
    const solved = solveSudoku(boardCopy);
  
    if (solved && !cancelRef.current) {
      setBoard(boardCopy);
      setSystemFilledCells(newSystemFilledCells);
      setSolved(true);
      setValidationMessage('Solved ✔️');
    } else if (!cancelRef.current) {
      setValidationMessage('Unable to find a solution ❌');
    }
  
    setSolving(false);
  }, [board, mode, isValid, validateBoard]);

  const handleModeChange = (newMode) => {
    if (newMode === 'solve') {
      // Initialize an empty board for Solve mode
      setBoard(Array(9).fill().map(() => Array(9).fill(0)));
      setIsFixed(Array(9).fill().map(() => Array(9).fill(false)));
      setBoardGenerated(false);  // Reset this when changing to Solve mode
    } else {
      // For Answer mode, just clear the board
      setBoard(Array(9).fill().map(() => Array(9).fill(0)));
      setIsFixed(Array(9).fill().map(() => Array(9).fill(false)));
    }
    
    // Common reset operations
    setSystemFilledCells(Array(9).fill().map(() => Array(9).fill(false)));
    setMode(newMode);
    setSolved(false);
    setSelectedCell(null);
    setValidationMessage('');
  };

 return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sudoku Solver</h1>

      <ModeToggle mode={mode} onModeChange={handleModeChange} />

      <Board 
        board={board}
        isFixed={isFixed}
        selectedCell={selectedCell}
        onCellClick={handleCellClick}
        systemFilledCells={systemFilledCells}  // Add this line
        mode={mode}
      />

{validationMessage && (
  <div 
    style={{
      ...styles.validationMessage,
      ...(validationMessage === 'Solved ✔️' ? styles.positiveMessage : styles.negativeMessage)
    }}
  >
    {validationMessage}
  </div>
)}

      <div style={styles.controlPanel}>
        {mode === 'solve' && (
          <>
            <button onClick={handleGenerate} disabled={solving} style={styles.button}>
              Generate
            </button>
            <button onClick={handleSolve} disabled={solving} style={styles.button}>
              Solve
            </button>
            <button onClick={handleValidate} disabled={solving} style={styles.button}>
              Validate
            </button>
          </>
        )}
        {mode === 'answer' && (
          <button onClick={handleShowAnswer} disabled={solving} style={styles.button}>
            Show Answer
          </button>
        )}
        <button onClick={handleClear} disabled={solving} style={styles.button}>
          Clear
        </button>
        {solving && (
          <button onClick={() => {cancelRef.current = true}} style={styles.button}>
            Stop
          </button>
        )}
      </div>

      {showKeyboard && <NumberInput onNumberClick={handleNumberClick} />}

      <div style={styles.settings}>
        <div style={styles.settingRow}>
          <label htmlFor="difficulty">Difficulty:</label>
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

        <div style={styles.settingRow}>
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

        <div style={styles.settingRow}>
          <label>
            <input 
              type="checkbox" 
              checked={showVisualization} 
              onChange={(e) => setShowVisualization(e.target.checked)}
              style={styles.checkbox}
            />
            Show solving visualization
          </label>
        </div>

        <div style={styles.settingRow}>
          <label>
            <input 
              type="checkbox" 
              checked={showKeyboard} 
              onChange={(e) => setShowKeyboard(e.target.checked)}
              style={styles.checkbox}
            />
            Show number keyboard
          </label>
        </div>
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
    border: '1px solid #2c3e50',
  },
  controlPanel: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px',
  },
  button: {
    padding: '10px 15px',
    fontSize: '14px',
    backgroundColor: '#3498db',
    color: '#ecf0f1',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  numberInput: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px',
    marginTop: '20px',
    marginBottom: '20px',
  },
  numberButton: {
    padding: '15px',
    fontSize: '18px',
    backgroundColor: '#3498db',
    color: '#ecf0f1',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  clearButton: {
    backgroundColor: '#e74c3c',
    gridColumn: 'span 2',
  },
  validationMessage: {
    padding: '10px',
    textAlign: 'center',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  positiveMessage: {
    backgroundColor: '#4CAF50',  // Green background
    color: 'white',
  },
  negativeMessage: {
    backgroundColor: '#FFCCCB',  // Light red background
    color: 'black',
  },
  settings: {
    marginTop: '20px',
  },
  settingRow: {
    marginBottom: '10px',
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
  },
  checkbox: {
    marginRight: '10px',
  },
  modeToggleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  modeToggleButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#34495e',
    color: '#ecf0f1',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  modeToggleButtonFirst: {
    borderTopLeftRadius: '5px',
    borderBottomLeftRadius: '5px',
  },
  modeToggleButtonLast: {
    borderTopRightRadius: '5px',
    borderBottomRightRadius: '5px',
  },
  activeButton: {
    backgroundColor: '#2980b9',
  },
};
export default SudokuSolver
