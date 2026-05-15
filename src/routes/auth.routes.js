import { Router } from "express";
import {
    registerUser,
    verifyUserEmail,
    loginUser,
    logoutUser,
    currentUser,
    changePassword,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    resendEmailVerification
} from "../controllers/auth.controllers.js";
import { userRegisterValidator, userLoginValidator, userForgotPasswordValidator, userResetPasswordValidator, userChangePasswordValidator } from "../validators/index.js";
import { validate } from "../middleware/validator.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// unsecured routes
router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/login").post(userLoginValidator(), validate, loginUser);
router.route("/verify-email/:verificationToken").get(verifyUserEmail);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/forgot-password").post(userForgotPasswordValidator(), validate, forgotPasswordRequest);
router.route("/reset-password/:resetToken").post(userResetPasswordValidator(), validate, resetForgotPassword);
router.route("/resend-email-verification").post(resendEmailVerification);


// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, currentUser);
router.route("/change-password").post(verifyJWT, userChangePasswordValidator(), validate, changePassword);
// moved resendEmailVerification to unsecured routes


export default router;