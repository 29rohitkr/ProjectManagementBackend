import Mailgen from "mailgen";



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


export { emailVerificationMailgenContent, forgotPasswordMailgenContent };