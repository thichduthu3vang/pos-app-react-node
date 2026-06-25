import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        code: {
            type: String,
            required: true,
            unique: true
        },
        address: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Branch = mongoose.model("Branch", branchSchema);

export default Branch;