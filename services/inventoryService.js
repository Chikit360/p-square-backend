const cron = require('node-cron');
const Inventory = require('../models/inventoryModel');
const sendEmail = require('./mailService');
const User = require('../models/userModel');

// HTML Templates
const lowStockAlertTemp = `...`; // as provided above
const expirySoonTemp = `...`;    // as provided above

// ===============================
// 🛑 Low Stock Alert Service
// ===============================
const lowStockAlert = async () => {
  try {
    const users=await User.find({role:"admin"});
    if(users.length===0){
        console.log("No admin users found for low stock alert.");
        return;
    }

    const lowStockItems = await Inventory.find({
      $expr: { $lt: ['$quantityInStock', '$minimumStockLevel'] }
    }).populate('medicineId');

    if (lowStockItems.length > 0) {
      // Replace placeholders manually or use a template engine
      const rows = lowStockItems.map(item => `
        <tr>
          <td style="border: 1px solid #ccc; padding: 10px; text-align: left;">${item.medicineId.name}</td>
          <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${item.quantityInStock}</td>
          <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${item.minimumStockLevel}</td>
        </tr>
      `).join('');
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>🚨 Low Stock Alert</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 700px; margin: auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.06);">
          <div style="background-color: #d9534f; padding: 20px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
            <h2 style="color: white; margin: 0;">🚨 Low Stock Alert</h2>
          </div>
          <div style="padding: 20px;">
            <p style="font-size: 16px; color: #333;">The following medicines are <strong>below their minimum stock levels</strong> and need your attention:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 15px;">
              <thead>
                <tr style="background-color: #f2f2f2;">
                  <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Medicine Name</th>
                  <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Current Quantity</th>
                  <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Minimum Required</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
            <p style="margin-top: 25px; font-size: 14px; color: #555;">Consider restocking these items to maintain sufficient inventory levels.</p>
          </div>
        </div>
      </body>
      </html>
      `;
      
      await sendEmail(
        users[0].email, // Assuming you want to send to the first admin user
        "🚨 Low Stock Alert",
        html
      );
    }

    return lowStockItems;
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    throw error;
  }
};

// ===============================
// ⏳ Expiring Soon Alert Service
// ===============================
const expiringSoonAlert = async () => {
  try {
    const today = new Date();
    const nextTenDays = new Date();
    nextTenDays.setDate(today.getDate() + 10);
    const users=await User.find({role:"admin"});
    if(users.length===0){
        console.log("No admin users found for expiring soon alert.");
        return;
    }
    const expiringItems = await Inventory.find({
      expiryDate: { $gte: today, $lte: nextTenDays }
    }).populate('medicineId');

    if (expiringItems.length > 0) {
        const rows = expiringItems.map(item => `
            <tr>
              <td style="border: 1px solid #ccc; padding: 10px; text-align: left;">${item.medicineId.name}</td>
              <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${item.expiryDate.toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}</td>
              <td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${item.quantityInStock}</td>
            </tr>
          `).join('');
          
          const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>⚠️ Expiring Medicines Alert</title>
          </head>
          <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; padding: 30px;">
            <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.05); overflow: hidden;">
              <div style="background-color: #f0ad4e; padding: 20px; color: white;">
                <h2 style="margin: 0;">⚠️ Medicines Expiring Soon</h2>
              </div>
              <div style="padding: 20px;">
                <p style="font-size: 16px;">The following medicines in your inventory will expire within the next <strong>10 days</strong>:</p>
                <table style="border-collapse: collapse; width: 100%; margin-top: 20px; font-size: 15px;">
                  <thead>
                    <tr style="background-color: #f2f2f2;">
                      <th style="border: 1px solid #ccc; padding: 10px; text-align: left;">Medicine Name</th>
                      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Expiry Date</th>
                      <th style="border: 1px solid #ccc; padding: 10px; text-align: center;">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows}
                  </tbody>
                </table>
                <p style="margin-top: 30px; font-size: 14px; color: #555;">Please take appropriate action to manage or remove expiring stock.</p>
              </div>
            </div>
          </body>
          </html>
          `;
          

      await sendEmail(
        users[0].email, // Assuming you want to send to the first admin user
        "⚠️ Expiring Soon Alert",
        html
      );
    }

    return expiringItems;
  } catch (error) {
    console.error('Error fetching expiring soon items:', error);
    throw error;
  }
};

// ===============================
// Cron Job Runner
// ===============================
const runLowStockCheck = async () => {
  console.log(`[${new Date().toLocaleString()}] Running low stock check...`);
  try {
    const alerts = await lowStockAlert();
    console.log(alerts.length > 0
      ? `Found ${alerts.length} low stock items.`
      : 'No low stock items found.');
  } catch (err) {
    console.error('Error during low stock cron job:', err);
  }
};

const runExpiryCheck = async () => {
  console.log(`[${new Date().toLocaleString()}] Running expiry check...`);
  try {
    const alerts = await expiringSoonAlert();
    console.log(alerts.length > 0
      ? `Found ${alerts.length} expiring items.`
      : 'No expiring items found.');
  } catch (err) {
    console.error('Error during expiry cron job:', err);
  }
};



module.exports = {
  runLowStockCheck,
  runExpiryCheck
};
