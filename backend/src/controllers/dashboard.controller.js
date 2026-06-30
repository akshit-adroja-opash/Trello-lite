import mongoose from 'mongoose';
import Card from '../models/Card.js';
import Column from '../models/Column.js';
import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';
import User from '../models/User.js';

// ─────────────────────────────────────────────────────────────
// HELPER: board IDs for workspaces the user belongs to
// ─────────────────────────────────────────────────────────────
const getBoardIdsForUser = async (userId) => {
  const workspaces = await Workspace.find({
    $or: [{ Admin: userId }, { 'members.user': userId }],
  }).select('_id');
  const boards = await Board.find({ workspace: { $in: workspaces.map(w => w._id) } }).select('_id');
  return boards.map(b => b._id);
};

// ─────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// Returns: stats, roleDistribution, recentWorkspaces,
//          productivityTimeline (last 30 days completed cards),
//          boardCount, totalCards
// ─────────────────────────────────────────────────────────────
export const getAdminDashboard = async (req, res) => {
  try {

    const [totalUsers, totalWorkspaces, totalBoards, totalCards] = await Promise.all([
      User.countDocuments(),
      Workspace.countDocuments(),
      Board.countDocuments(),
      Card.countDocuments(),
    ]);

    // Role distribution
    const roleDistribution = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { _id: 0, role: '$_id', count: 1 } },
    ]);

    // All board IDs (system-wide)
    const allBoards = await Board.find().select('_id');
    const allBoardIds = allBoards.map(b => b._id);

    const doneColumns = await Column.find({
      board: { $in: allBoardIds },
      name: { $regex: /done/i },
    }).select('_id');
    const doneColumnIds = doneColumns.map(c => c._id);

    const [overdueCount, blockedCount, reviewCount] = await Promise.all([
      Card.countDocuments({
        board: { $in: allBoardIds },
        dueDate: { $lt: new Date() },
        column: { $nin: doneColumnIds },
      }),
      Card.countDocuments({ board: { $in: allBoardIds }, blocked: true }),
      Card.countDocuments({ board: { $in: allBoardIds }, reviewRequested: true }),
    ]);

    // Recent 5 workspaces (newest first)
    const recentWorkspaces = await Workspace.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name description createdAt members')
      .populate('members.user', 'username email avatar role')
      .lean();

    // Productivity timeline – cards completed in each of the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productivityTimeline = await Card.aggregate([
      {
        $match: {
          board: { $in: allBoardIds.map(id => new mongoose.Types.ObjectId(id)) },
          column: { $in: doneColumnIds.map(id => new mongoose.Types.ObjectId(id)) },
          updatedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' } },
          completed: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id', completed: 1 } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: { totalUsers, totalWorkspaces, totalBoards, totalCards, overdueCount, blockedCount, reviewCount },
        roleDistribution,
        recentWorkspaces,
        productivityTimeline,
      },
    });
  } catch (err) {
    console.error('AdminDashboard Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load admin dashboard' });
  }
};

// ─────────────────────────────────────────────────────────────
// PROJECT MANAGER DASHBOARD
// ─────────────────────────────────────────────────────────────
export const getProjectManagerDashboard = async (req, res) => {
  try {

    const userId = req.user._id;
    const boardIds = await getBoardIdsForUser(userId);

    const doneColumns = await Column.find({
      board: { $in: boardIds },
      name: { $regex: /done/i },
    }).select('_id');
    const doneColumnIds = doneColumns.map(c => c._id);

    const [overdueCount, blockedCount, reviewCount, activeBoardCount] = await Promise.all([
      Card.countDocuments({ board: { $in: boardIds }, dueDate: { $lt: new Date() }, column: { $nin: doneColumnIds } }),
      Card.countDocuments({ board: { $in: boardIds }, blocked: true }),
      Card.countDocuments({ board: { $in: boardIds }, reviewRequested: true }),
      Board.countDocuments({ _id: { $in: boardIds } }),
    ]);

    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);

    const [upcomingMilestones, blockedTasks, pendingReviews] = await Promise.all([
      Card.find({ board: { $in: boardIds }, dueDate: { $gte: new Date(), $lte: twoWeeksLater }, column: { $nin: doneColumnIds } })
        .sort({ dueDate: 1 }).limit(5).populate('board', 'name').select('title dueDate priority board').lean(),
      Card.find({ board: { $in: boardIds }, blocked: true })
        .limit(5).populate('board', 'name').select('title blockedReason priority board').lean(),
      Card.find({ board: { $in: boardIds }, reviewRequested: true })
        .limit(5).populate('board', 'name').select('title priority board').lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: { stats: { activeBoardCount, overdueCount, blockedCount, reviewCount }, upcomingMilestones, blockedTasks, pendingReviews },
    });
  } catch (err) {
    console.error('PMDashboard Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load project manager dashboard' });
  }
};

// ─────────────────────────────────────────────────────────────
// DEVELOPER DASHBOARD
// ─────────────────────────────────────────────────────────────
export const getDeveloperDashboard = async (req, res) => {
  try {

    const userId = req.user._id;

    const doneColumns = await Column.find({ name: { $regex: /done/i } }).select('_id');
    const doneColumnIds = doneColumns.map(c => c._id);

    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const [myTaskCount, blockedCount, dueSoonCount, overdueCount] = await Promise.all([
      Card.countDocuments({ assignees: userId, column: { $nin: doneColumnIds } }),
      Card.countDocuments({ assignees: userId, blocked: true, column: { $nin: doneColumnIds } }),
      Card.countDocuments({ assignees: userId, dueDate: { $gte: new Date(), $lte: sevenDaysLater }, column: { $nin: doneColumnIds } }),
      Card.countDocuments({ assignees: userId, dueDate: { $lt: new Date() }, column: { $nin: doneColumnIds } }),
    ]);

    const [myTasks, blockedItems] = await Promise.all([
      Card.find({ assignees: userId, column: { $nin: doneColumnIds } })
        .sort({ dueDate: 1 }).limit(10).populate('board', 'name').select('title dueDate priority blocked blockedReason board').lean(),
      Card.find({ assignees: userId, blocked: true, column: { $nin: doneColumnIds } })
        .limit(5).populate('board', 'name').select('title blockedReason priority board').lean(),
    ]);

    return res.status(200).json({
      success: true,
      data: { stats: { myTaskCount, blockedCount, dueSoonCount, overdueCount }, myTasks, blockedItems },
    });
  } catch (err) {
    console.error('DevDashboard Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load developer dashboard' });
  }
};

// ─────────────────────────────────────────────────────────────
// CLIENT DASHBOARD
// ─────────────────────────────────────────────────────────────
export const getClientDashboard = async (req, res) => {
  try {

    const userId = req.user._id;

    const workspaces = await Workspace.find({ 'members.user': userId }).select('_id name');
    const workspaceIds = workspaces.map(w => w._id);

    const sharedBoards = await Board.find({ workspace: { $in: workspaceIds } })
      .sort({ updatedAt: -1 }).limit(8).select('name background updatedAt workspace').lean();

    const boardIds = sharedBoards.map(b => b._id);

    const [sharedBoardCount, reviewCount] = await Promise.all([
      Board.countDocuments({ workspace: { $in: workspaceIds } }),
      Card.countDocuments({ board: { $in: boardIds }, reviewRequested: true }),
    ]);

    const pendingApprovals = await Card.find({ board: { $in: boardIds }, reviewRequested: true })
      .limit(5).populate('board', 'name').select('title priority board').lean();

    return res.status(200).json({
      success: true,
      data: {
        stats: { sharedBoardCount, reviewCount, workspaceCount: workspaces.length },
        sharedBoards,
        pendingApprovals,
      },
    });
  } catch (err) {
    console.error('ClientDashboard Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load client dashboard' });
  }
};
