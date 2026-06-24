import express from "express";
import MenuItem from "../models/MenuItem.js";

const router = express.Router();

router.get("/", async (req, res) => {
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

router.post("/", async (req, res) => {
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

router.patch("/:id", async (req, res) => {
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

router.patch("/:id/toggle", async (req, res) => {
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

router.delete("/:id", async (req, res) => {
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

export default router;