import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";

// Fix lỗi DNS khi kết nối MongoDB Atlas bằng mongodb+srv
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173"
  })
);

app.use(express.json());

// =======================
// CHECK ENV
// =======================
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in backend/.env file");
  process.exit(1);
}

// =======================
// CONNECT MONGODB
// =======================
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10000
  })
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });

// =======================
// MENU SCHEMA
// =======================
const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String,
      default: ""
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

// =======================
// ORDER SCHEMA
// =======================
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

// =======================
// TEST API
// =======================
app.get("/", (req, res) => {
  res.send("POS Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend API is working",
    mongoStatus: mongoose.connection.readyState
  });
});

// =======================
// MENU API
// =======================
app.get("/api/menu", async (req, res) => {
  try {
    const menuItems = await MenuItem.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot get menu",
      error: error.message
    });
  }
});

app.post("/api/menu", async (req, res) => {
  try {
    const { name, category, price, image } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required"
      });
    }

    const newMenuItem = await MenuItem.create({
      name,
      category,
      price,
      image
    });

    res.status(201).json({
      success: true,
      message: "Menu item created",
      data: newMenuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot create menu item",
      error: error.message
    });
  }
});

// =======================
// ORDER API
// =======================
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot get orders",
      error: error.message
    });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { tableName, customerName, items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must have at least one item"
      });
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const newOrder = await Order.create({
      tableName,
      customerName,
      items,
      totalAmount,
      paymentMethod
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: newOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot create order",
      error: error.message
    });
  }
});

app.patch("/api/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["pending", "preparing", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot update order status",
      error: error.message
    });
  }
});

// =======================
// START SERVER
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});