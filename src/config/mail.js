import nodemailer from "nodemailer";

let transporter;

export const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GOOGLE_APP_EMAIL,
        pass: process.env.GOOGLE_APP_PASSWORD,
      },
    });

    console.log("Mail transporter ready");
  }

  return transporter;
};

export const sendOTP = (email, OTP) => {
  const message = {
    from:process.env.GOOGLE_APP_EMAIL,
    to: email,
    subject: "Email verification",
    text: `
    
    Your One Time pass word is ${OTP}:
  
    Email : ${email}
    OTP : ${OTP}
      `,
  };

  return message;
}