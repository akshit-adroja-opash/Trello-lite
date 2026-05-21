import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
{
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Board",
    },

    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },

    type: {
        type: String,
        enum: ["full", "client"],
        default: "full",
    },

    pdfUrl: String,

    sharedToken: String,
},
{ timestamps: true }
);

export default mongoose.model("Report", reportSchema);