import { Router } from "express";
import { registerUser, verifyUserEmail } from "../controllers/auth.controllers.js";

const router = Router();

router.route("/register").post(registerUser);
router.route("/verify-email/:verificationToken").get(verifyUserEmail);

export default router;