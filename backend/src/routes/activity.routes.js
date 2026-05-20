import express from "express";
import Activity from "../models/Activity.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();



router.get(
    "/board/:boardId",
    verifyJWT,
    async (req, res, next) => {
        try {

            const activities =
                await Activity.find({
                    board: req.params.boardId,
                })
                    .populate(
                        "user",
                        "username avatar"
                    )
                    .sort("-createdAt")
                    .limit(50);

            res.status(200).json({
                success: true,
                activities,
            });

        } catch (error) {
            next(error);
        }
    }
);

export default router;
