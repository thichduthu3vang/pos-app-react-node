import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in backend/.env file");
  process.exit(1);
}

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
// TABLE SCHEMA
// =======================
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
// TABLE API
// =======================
app.get("/api/tables", async (req, res) => {
  try {
    const tables = await Table.find().sort({ createdAt: 1 });

    res.json({
      success: true,
      data: tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot get tables",
      error: error.message
    });
  }
});

app.post("/api/tables", async (req, res) => {
  try {
    const { name, area } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Table name is required"
      });
    }

    const newTable = await Table.create({
      name,
      area
    });

    res.status(201).json({
      success: true,
      message: "Table created",
      data: newTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot create table",
      error: error.message
    });
  }
});

app.patch("/api/tables/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ["available", "occupied", "cleaning", "reserved"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table status"
      });
    }

    const updateData = {
      status
    };

    if (status === "available") {
      updateData.currentOrderId = null;
    }

    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updatedTable) {
      return res.status(404).json({
        success: false,
        message: "Table not found"
      });
    }

    res.json({
      success: true,
      message: "Table status updated",
      data: updatedTable
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot update table status",
      error: error.message
    });
  }
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
    const { name, category, price, image, isAvailable } = req.body;

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
      image,
      isAvailable
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

app.patch("/api/menu/:id", async (req, res) => {
  try {
    const { name, category, price, image, isAvailable } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Name, category and price are required"
      });
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      {
        name,
        category,
        price,
        image,
        isAvailable
      },
      { new: true }
    );

    if (!updatedMenuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    res.json({
      success: true,
      message: "Menu item updated",
      data: updatedMenuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot update menu item",
      error: error.message
    });
  }
});

app.patch("/api/menu/:id/toggle", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    menuItem.isAvailable = !menuItem.isAvailable;
    await menuItem.save();

    res.json({
      success: true,
      message: "Menu item status updated",
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot toggle menu item",
      error: error.message
    });
  }
});

app.delete("/api/menu/:id", async (req, res) => {
  try {
    const deletedMenuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!deletedMenuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found"
      });
    }

    res.json({
      success: true,
      message: "Menu item deleted",
      data: deletedMenuItem
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot delete menu item",
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
    const { tableId, tableName, customerName, items, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must have at least one item"
      });
    }

    let selectedTable = null;

    if (tableId) {
      selectedTable = await Table.findById(tableId);

      if (!selectedTable) {
        return res.status(404).json({
          success: false,
          message: "Table not found"
        });
      }

      if (selectedTable.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `${selectedTable.name} hiện không trống`
        });
      }
    }

    const totalAmount = items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    const newOrder = await Order.create({
      tableId: selectedTable ? selectedTable._id : null,
      tableName: selectedTable ? selectedTable.name : tableName || "Takeaway",
      customerName,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "cash",
      paymentStatus: "unpaid",
      paidAt: null
    });

    if (selectedTable) {
      selectedTable.status = "occupied";
      selectedTable.currentOrderId = newOrder._id;
      await selectedTable.save();
    }

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

    if (updatedOrder.tableId) {
      if (status === "completed") {
        await Table.findByIdAndUpdate(updatedOrder.tableId, {
          status: "cleaning"
        });
      }

      if (status === "cancelled") {
        await Table.findByIdAndUpdate(updatedOrder.tableId, {
          status: "available",
          currentOrderId: null
        });
      }
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

app.patch("/api/orders/:id/pay", async (req, res) => {
  try {
    const { paymentMethod } = req.body;

    const allowedPaymentMethods = ["cash", "bank", "card", "momo", "zalopay"];

    if (!allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method"
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Không thể thanh toán đơn đã hủy"
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Đơn này đã thanh toán rồi"
      });
    }

    order.paymentMethod = paymentMethod;
    order.paymentStatus = "paid";
    order.paidAt = new Date();

    await order.save();

    if (order.tableId) {
      await Table.findByIdAndUpdate(order.tableId, {
        status: "available",
        currentOrderId: null
      });
    }

    res.json({
      success: true,
      message: "Order paid successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot pay order",
      error: error.message
    });
  }
});

// =======================
// REPORT API
// =======================
app.get("/api/reports/today", async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const paidOrders = await Order.find({
      paymentStatus: "paid",
      paidAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ paidAt: -1 });

    const unpaidOrders = await Order.find({
      paymentStatus: {
        $ne: "paid"
      },
      status: {
        $ne: "cancelled"
      }
    });

    const totalRevenue = paidOrders.reduce((sum, order) => {
      return sum + order.totalAmount;
    }, 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalPaidOrders: paidOrders.length,
        totalUnpaidOrders: unpaidOrders.length,
        paidOrders
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Cannot get today report",
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