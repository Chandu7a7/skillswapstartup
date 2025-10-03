// server/src/services/emailService.js

import nodemailer from 'nodemailer';
import sendgridTransport from 'nodemailer-sendgrid-transport';
import 'dotenv/config';

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_API_KEY
    }
}));

export const sendEmail = async ({ to, subject, text, html }) => {

    const fromEmail = 'chandugadeshwer@gmail.com'; 

    try {
        await transporter.sendMail({
            to: to,
            from: fromEmail,
            subject: subject,
            text: text,
            html: html,
        });
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};