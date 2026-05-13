import { APIResponse } from "../utils/api-response.js";
import { APIError } from "../utils/api-errors.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js"
import { sendEmail, emailVerificationMailgenContent } from "../utils/mail.js";
import crypto from "crypto";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });
        return { accessToken, refreshToken };
    } catch (error) {
        throw new APIError(500,
            "Something went wrong while generating Access and Refresh Token"
        );
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password, role } = req.body;
    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExists) {
        throw new APIError(409, "Username or email already exists", []);
    }

    const user = await User.create({
        email,
        username,
        password,
        isEmailVerified: false
    });

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        username: user.username,
        subject: "This email is to verify your email address with us.",
        mailGenContent: emailVerificationMailgenContent(user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`
        ),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

    if (!createdUser) {
        throw new APIError(500, "Something went wrong while registering a user");
    }

    return res.status(200).json(
        new APIResponse(200, { user: createdUser },
            "User registered successfully and verification email has been sent on user's email"
        )
    )
});

const verifyUserEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params; // getting unhashed token from user

    // console.log(verificationToken);

    const hashedToken = crypto.createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() } // Token not expired
    });

    if (!user) {
        throw new APIError(400, "Invalid or Expired token");
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new APIResponse(200, {}, "Email verified successful.")
    );
});

const login = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    if (!email) {
        throw new APIError(400, "email is required");
    }

    const user = await User.findOne({ email });

    if (!user) {
        throw new APIError(400, "User not found with this email");
    }

    const isPasswordValid = await user.isPasswordValid(password);

    if (!isPasswordValid) {
        throw new APIError(400, "Invalid Credentials.");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new APIResponse(200, {
                user: loggedInUser,
                accessToken,
                refreshToken
            }, "User Logged In Successfully.")
        )
});

export { registerUser, verifyUserEmail, login };

