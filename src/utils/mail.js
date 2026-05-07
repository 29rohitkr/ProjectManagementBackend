import Mailgen from "mailgen";
import nodemailer from "nodemailer";


const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            // Appears in header & footer of e-mails
            name: 'Project Management',
            link: 'https://devmodeon.tech/projectm'
        }
    });

    const emailHtml = mailGenerator.generate(options.mailGenContent);
    const emailText = mailGenerator.generatePlaintext(options.mailGenContent);


    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: process.env.MAILTRAP_PORT,
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS
        }
    });

    const mail = {
        from: 'Project Team <team@devmodeon.tech>',
        to: options.email, //"29rkwhitelist@gmail.com",
        subject: options.subject,//"This is a test mail.",
        html: emailHtml,
        text: emailText
    }

    try {
        await transporter.sendMail(mail);
    } catch (error) {
        console.error("Email service failed. check your configuration, credentials");
        console.error("Error: ", error);
    }

}

// Email Verification
const emailVerificationMailgenContent = (username, verificationURL) => {
    return {
        body: {
            name: username,
            intro: 'Welcome to Project Management App! We\'re very excited to have you on board.',
            action: {
                instructions: 'To get started with Project Management App, please click here:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Confirm your account',
                    link: verificationURL
                }
            },
            outro: 'Need help, or have questions? Just reply to this email, we\'d love to help.'
        }
    }
}

// Forgot Password
const forgotPasswordMailgenContent = (username, resetURL) => {
    return {
        body: {
            name: username,
            intro: 'You recently requested to reset your password for Project Management App.',
            action: {
                instructions: 'Click the button below to reset it:',
                button: {
                    color: '#FF6F61',
                    text: 'Reset your password',
                    link: resetURL
                }
            },
            outro: 'If you did not request a password reset, please ignore this email or contact support if you have questions.'
        }
    }
}


export { emailVerificationMailgenContent, forgotPasswordMailgenContent, sendMail };