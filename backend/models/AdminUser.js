import mongoose from "mongoose";

const adminUserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            default: ""
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        passwordHash: {
            type: String,
            required: true
        },
        role: {
            type: String,
            enum: ["owner", "staff"],
            default: "staff"
        },
        branchCode: {
            type: String,
            default: ""
        },
        branchName: {
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

const AdminUser = mongoose.model("AdminUser", adminUserSchema);

export default AdminUser;