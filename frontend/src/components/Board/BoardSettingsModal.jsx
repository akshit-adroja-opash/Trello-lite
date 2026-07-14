import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { updateBoard, deleteBoard } from '../../api/board.api';
import Modal from '../common/Modal';

const BOARD_COLORS = [
  'linear-gradient(180deg, #5A5EE0 0%, #3031B7 100%)',
  'linear-gradient(180deg, #0075A7 0%, #004C6E 100%)',
  'linear-gradient(180deg, #D94670 0%, #8A1A40 100%)',
  'linear-gradient(180deg, #D44D4D 0%, #8C2222 100%)',
  'linear-gradient(180deg, #D69E2E 0%, #975A16 100%)',
  'linear-gradient(180deg, #38B2AC 0%, #234E52 100%)'
];

const BoardSettingsModal = ({ board, isOpen, onClose, onBoardUpdated }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(board?.name || '');
  const [background, setBackground] = useState(board?.background || BOARD_COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!isOpen || !board) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await updateBoard(board._id, {
        name: name.trim(),
        background
      });
      toast.success('Board updated successfully');
      if (onBoardUpdated) {
        onBoardUpdated(res.data?.board || res.board);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update board');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this board? All lists and cards will be permanently lost.')) {
      return;
    }
    setDeleting(true);
    try {
      await deleteBoard(board._id);
      toast.success('Board deleted successfully');
      onClose();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Board Settings"
      icon="settings"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-6 pt-sm">
        <div>
          <label className="block text-xs font-bold capitalize tracking-wider text-slate-500 dark:text-slate-400 mb-2">Board Title</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Board name"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-medium placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold capitalize tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">Background Theme</label>
          <div className="grid grid-cols-3 gap-3">
            {BOARD_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setBackground(color)}
                className={`h-14 rounded-xl relative transition-all duration-200 hover:scale-102 flex items-center justify-center shadow-sm ${background === color ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-slate-800 scale-102 font-bold' : ''}`}
                style={{ background: color }}
              >
                {background === color && (
                  <span className="material-symbols-outlined text-white text-lg font-bold">check</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col gap-3">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="h-10 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : 'Save Changes'}
            </button>
          </div>

          <div className="mt-3 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="text-left">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">Danger Zone</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">This action deletes the board forever.</p>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 px-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              {deleting ? (
                <span className="w-3.5 h-3.5 border-2 border-rose-600/30 border-t-rose-600 rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-sm">delete</span>
              )}
              Delete Board
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default BoardSettingsModal;
