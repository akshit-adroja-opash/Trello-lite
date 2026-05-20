import Activity from "../models/Activity.js";

const logActivity = async ({
    boardId,
    userId,
    action,
    target,
}) => {
    try {

        await Activity.create({
            board: boardId,
            user: userId,
            action,
            target,
        });

    } catch (error) {

        console.error(
            "Activity Logger Error:",
            error.message
        );
    }
};

export default logActivity;