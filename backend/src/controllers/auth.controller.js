import User from "../models/User.js";
import Session from "../models/Session.js";
import Workspace from "../models/Workspace.js";
import { generateToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/apiError.js";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role = "developer" } = req.body;

    if (role === "admin") {
      throw new ApiError(400, "Registration with 'admin' role is not allowed");
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const user = await User.create({ username, email, password, role });
    const token = generateToken(user._id);

    await Session.create({
      userId: user._id,
      token,
      userAgent: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
      lastActive: new Date()
    });

    res.status(201).json({
      status: "success",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.isPasswordCorrect(password))) {
      throw new ApiError(401, "Invalid credentials");
    }

    if (role && (user.role || "developer") !== role) {
      throw new ApiError(401, "Invalid role selected for this account");
    }

    const token = generateToken(user._id);
    res.cookie("token", token);

    await Session.create({
      userId: user._id,
      token,
      userAgent: req.headers['user-agent'] || 'Unknown Device',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown IP',
      lastActive: new Date()
    });

    res.status(200).json({
      status: "success",
      data: { user, token },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      status: "success",
      data: { user: req.user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) return next(new ApiError(404, 'User not found'));

    if (req.body.username) user.username = req.body.username;
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    if (req.file) {
      user.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  } catch (err) {
    next(err);
  }
};


export const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      await Session.findOneAndDelete({ token });
    }
    res.clearCookie('token');
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getDevelopers = async (req, res, next) => {
  try {
    const developers = await User.find({ role: { $in: ['developer', 'client'] } }).select('username email avatar role');
    res.status(200).json({
      status: 'success',
      data: { developers }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await User.findByIdAndDelete(userId);
    res.clearCookie('token');
    res.status(200).json({
      status: 'success',
      message: 'Account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').lean();
    const workspaces = await Workspace.find().lean();
    
    const usersWithWorkspaceCount = users.map(user => {
      const userIdStr = user._id.toString();
      const count = workspaces.filter(ws => {
        const isAdmin = ws.Admin && ws.Admin.toString() === userIdStr;
        const isMember = ws.members && ws.members.some(m => m.user && m.user.toString() === userIdStr);
        return isAdmin || isMember;
      }).length;
      
      return {
        ...user,
        workspaceCount: count
      };
    });

    res.status(200).json({
      status: 'success',
      data: { users: usersWithWorkspaceCount }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    user.role = role;
    await user.save();
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const createUserByAdmin = async (req, res, next) => {
  try {
    const { username, email, password, role = 'developer' } = req.body;
    if (!username || !email || !password) {
      throw new ApiError(400, 'Username, email and password are required');
    }
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      throw new ApiError(400, 'User with this username or email already exists');
    }
    const user = await User.create({ username, email, password, role });
    res.status(201).json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const get2FAStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    res.status(200).json({
      status: "success",
      data: { twoFactorEnabled: !!user.twoFactorEnabled }
    });
  } catch (error) {
    next(error);
  }
};

export const toggle2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    const { enabled } = req.body;
    user.twoFactorEnabled = enabled !== undefined ? enabled : !user.twoFactorEnabled;
    await user.save();
    
    res.status(200).json({
      status: "success",
      message: `Two-factor authentication has been ${user.twoFactorEnabled ? 'enabled' : 'disabled'}`,
      data: { twoFactorEnabled: user.twoFactorEnabled }
    });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id }).sort({ lastActive: -1 });
    res.status(200).json({
      status: "success",
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
};

export const revokeSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await Session.findOneAndDelete({ _id: id, userId: req.user._id });
    if (!session) {
      throw new ApiError(404, "Session not found");
    }
    res.status(200).json({
      status: "success",
      message: "Session revoked successfully"
    });
  } catch (error) {
    next(error);
  }
};
