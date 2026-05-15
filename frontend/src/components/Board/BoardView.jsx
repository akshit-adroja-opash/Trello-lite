import ColumnList from '../Column/ColumnList';

const BoardView = ({ board }) => (
    <div className="board-view h-full">
        <ColumnList board={board} />
    </div>
);

export default BoardView;
