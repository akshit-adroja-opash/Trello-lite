import ColumnList from '../Column/ColumnList';

const BoardView = ({ board }) => (
  <div className="w-full h-full min-h-0 overflow-hidden bg-transparent">
    <ColumnList board={board} />
  </div>
);

export default BoardView;
