import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { ApiError } from "../utils/apiError.js";

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role = "developer" } = req.body;

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
