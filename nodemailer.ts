import { createTransport } from "nodemailer"
import type Mail from "nodemailer/lib/mailer"

const nodemailer = async(mailOption: Mail.Options) => {
  const transporter = createTransport(process.env.EMAIL_SERVER);

  const res = await transporter.sendMail(mailOption);

  return res.accepted;
}

export default nodemailer