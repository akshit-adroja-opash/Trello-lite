import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        type: {
            type: String,
            enum: ['CARD_UPDATE', 'BOARD_COMMENT', 'TASK_ACTION', 'MENTION'],
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        relatedEntity: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'entityModel',
        },
        entityModel: {
            type: String,
            enum: ['Card', 'Board', 'Workspace'],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
