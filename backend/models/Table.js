import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null
    },
    branchCode: {
      type: String,
      default: ""
    },
    branchName: {
      type: String,
      default: ""
    },
    name: {
      type: String,
      required: true
    },
    area: {
      type: String,
      default: "Khu chính"
    },
    status: {
      type: String,
      default: "available"
    },
    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    }
  },
  { timestamps: true }
);

const Table = mongoose.model("Table", tableSchema);

export default Table;