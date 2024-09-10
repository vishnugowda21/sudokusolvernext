import dynamic from 'next/dynamic'

const SudokuSolver = dynamic(() => import('../components/SudokuSolver'), { ssr: false })

export default function Home() {
  return (
    <div>
      <h1 style={{textAlign: 'center', marginBottom: '20px'}}>Sudoku Solver</h1>
      <SudokuSolver />
    </div>
  )
}
