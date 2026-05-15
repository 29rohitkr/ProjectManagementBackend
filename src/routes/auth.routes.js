import { Router } from "express";
import {
    registerUser,
    verifyUserEmail,
    loginUser,
    logoutUser,
    currentUser,
    changePassword
} from "../controllers/auth.controllers.js";
import { userRegisterValidator, userLoginValidator } from "../validators/index.js";
import { validate } from "../middleware/validator.middleware.js"
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(userRegisterValidator(), validate, registerUser);
router.route("/verify-email/:verificationToken").get(verifyUserEmail);
router.route("/login").post(userLoginValidator(), validate, loginUser);

// secure routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/current-user").get(verifyJWT, currentUser);
router.route("/change-password").post(verifyJWT, changePassword);


export default router;