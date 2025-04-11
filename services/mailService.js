const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS    
        }
    });
    

    const mailOptions = {
      from: process.env.EMAIL_FROM , // or process.env.EMAIL_USERNAME
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

module.exports = sendEmail;
