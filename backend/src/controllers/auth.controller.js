import User from "../models/User.js";
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
    if (req.user.role !== 'admin' && req.user.role !== 'project_manager') {
      throw new ApiError(403, 'Only admins and project managers can view registered developers');
    }
    const developers = await User.find({ role: 'developer' }).select('username email avatar');
    res.status(200).json({
      status: 'success',
      data: { developers }
    });
  } catch (error) {
    next(error);
  }
};

