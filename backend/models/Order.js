import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        menuItemId: String,
        name: String,
        category: String,
        price: Number,
        quantity: Number,
        note: String,
        image: String
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        tableId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Table",
            default: null
        },
        tableName: {
            type: String,
            default: "Takeaway"
        },
        customerName: {
            type: String,
            default: ""
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            default: 0
        },
        paymentMethod: {
            type: String,
            default: "cash"
            // cash, bank, card, momo, zalopay
        },
        paymentStatus: {
            type: String,
            default: "unpaid"
            // unpaid, paid
        },
        paidAt: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            default: "pending"
            // pending, preparing, completed, cancelled
        }
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;