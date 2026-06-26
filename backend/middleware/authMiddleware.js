import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Bạn chưa đăng nhập"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Token không hợp lệ hoặc đã hết hạn"
        });
    }
};

export const requireOwner = (req, res, next) => {
    if (req.user?.role !== "owner") {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền chủ cửa hàng"
        });
    }

    next();
};

export const requireBranchAccess = (req, res, next) => {
    if (req.user?.role === "owner") {
        return next();
    }

    const userBranchCode = req.user?.branchCode
        ? req.user.branchCode.toUpperCase()
        : "";

    if (!userBranchCode) {
        return res.status(403).json({
            success: false,
            message: "Tài khoản này chưa được gán chi nhánh"
        });
    }

    const requestBranchCode =
        req.query.branchCode ||
        req.body.branchCode ||
        req.params.branchCode ||
        "";

    if (!requestBranchCode) {
        req.query.branchCode = userBranchCode;
        req.body.branchCode = userBranchCode;
        return next();
    }

    if (requestBranchCode.toUpperCase() !== userBranchCode) {
        return res.status(403).json({
            success: false,
            message: "Bạn không có quyền truy cập chi nhánh này"
        });
    }

    req.query.branchCode = userBranchCode;
    req.body.branchCode = userBranchCode;

    next();
};