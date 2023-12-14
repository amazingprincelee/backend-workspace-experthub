import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'mail.privateemail.com',
    port: 587,  
    auth: {
      user: 'verify@experthubllc.com',
      pass: 'STUdent1@',
    },
  });

export const sendVerificationEmail = async (to, code) => {
  const mailOptions = {
    from: 'verify@experthubllc.com',
    to,
    subject: 'Verification Code',
    text: `Your verification code is: ${code}`,
  };

  return transporter.sendMail(mailOptions);
};
