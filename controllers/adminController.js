const Customer = require("../models/customerModel");
const Inventory = require("../models/inventoryModel");
const Medicine = require("../models/medicineModel");
const Stock = require("../models/stockModel");
const sendResponse = require("../utils/response.formatter");

const dashboardAnalytics = async (req, res) => {
  try {
    const { range = "monthly" } = req.query;

    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Total counts
    const [totalMedicines, totalInventory, totalCustomers, totalTodaySales] = await Promise.all([
      Medicine.countDocuments(),
      Inventory.countDocuments(),
      Customer.countDocuments(),
      Stock.countDocuments({ createdAt: { $gte: startOfDay, $lte: endOfDay } }),
    ]);

    const todaySales = await Stock.find({ createdAt: { $gte: startOfDay, $lte: endOfDay } });

    let totalProfitToday = 0;
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        totalProfitToday += item.price * item.quantity;
      });
    });

    // Chart generation logic
    let match = {};
    let dateFormat;
    const now = new Date();

    if (range === "daily") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      match.createdAt = { $gte: firstDay, $lte: lastDay };
      dateFormat = "%d-%m-%Y";
    } else if (range === "monthly") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearEnd = new Date(now.getFullYear(), 11, 31);
      match.createdAt = { $gte: yearStart, $lte: yearEnd };
      dateFormat = "%m-%Y";
    } else if (range === "yearly") {
      const startYear = new Date(now.getFullYear() - 4, 0, 1);
      match.createdAt = { $gte: startYear, $lte: new Date() };
      dateFormat = "%Y";
    }

    const salesData = await Stock.aggregate([
      { $match: match },
      { $unwind: "$items" },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          totalSales: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
          totalRevenue: { $sum: "$items.quantity" }, // Optional, depends on schema
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chart = {
      series: [
        {
          name: "Sales",
          data: salesData.map((d) => d.totalSales),
        },
        {
          name: "Revenue",
          data: salesData.map((d) => d.totalRevenue),
        },
      ],
      xaxis: {
        type: "category",
        categories: salesData.map((d) => d._id),
      },
    };

    return sendResponse(res, {
      status: 200,
      message: "Customer purchase history fetched successfully",
      data: {
        totalMedicines,
        totalInventory,
        totalCustomers,
        totalTodaySales,
        totalProfitToday,
        chart, // ✅ Real chart from DB
      },
    });
  } catch (error) {
    console.error("Error fetching customer purchase history:", error);
    return sendResponse(res, { status: 500, message: "Internal server error" });
  }
};

module.exports = {
  dashboardAnalytics,
};
