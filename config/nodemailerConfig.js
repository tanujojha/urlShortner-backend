import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

const transporter = await nodemailer.createTransport({
    service: "gmail",
    port: 465,
    secure: true,
    auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASS,
    },
  });
  
  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
      console.log("transporter error");
    } else {
      // console.log(success);
      console.log(`${success} + SMTP Server is ready`);
    }
  });
  
  export default transporter