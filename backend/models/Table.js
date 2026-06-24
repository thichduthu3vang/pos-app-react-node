import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
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
      // available, occupied, cleaning, reserved
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