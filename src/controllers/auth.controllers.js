import { APIResponse } from "../utils/api-response.js";
import { APIError } from "../utils/api-errors.js";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js"
import { sendEmail, emailVerificationMailgenContent, forgotPasswordMailgenContent } from "../utils/mail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";


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

const loginUser = asyncHandler(async (req, res) => {
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

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: "",
            },
        },
        {
            // new: true,
            returnDocument: "after",
        },
    );

    const options = {
        httpOnly: true,
        secure: true,
    }

    res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new APIResponse(200, {}, "User logged out"));
});

const currentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new APIResponse(200, req.user, `${req.user.username} is current User: data fetched.`)
    )
});

const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new APIError(404, "User doesnot exist");
    }

    if (user.isEmailVerified) {
        throw new APIError(409, "Email is already Verified,");
    }

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

    return res.status(200)
        .json(
            new APIResponse(200,
                {},
                "Verification mail sent to Your email."
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!oldRefreshToken) {
        throw new APIError(401, "Unauthorized Access");
    }

    try {
        const decodedToken = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new APIError(401, "Invalid Refresh Token, User not found in DB.");
        }

        if (oldRefreshToken !== user.refreshToken) {
            throw new APIError(401, " Refresh Token Does not match");
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id); // it also update refresh token in DB

        const options = {
            httpOnly: true,
            secure: true
        }

        return res.status(200)
            .clearCookie("accessToken", options)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new APIResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access Token refreshed."
                )
            )


    } catch (error) {
        throw new APIError(401, "Invalid Refresh Token, caught in catch block");
    }
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new APIError(401, "Email address does not exist");
    }

    const { unHashedToken, hashedToken, tokenExpiry } = user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    await sendEmail({
        email: user?.email,
        username: user.username,
        subject: "Password Reset Request",
        mailGenContent: forgotPasswordMailgenContent(user.username,
            `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`
        ),
    });

    return res.status(200)
        .json(
            new APIResponse(
                200,
                {},
                "Password reset link has been sent to your email. Link expires in 20 minutes."
            )
        )
});

const resetForgotPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto.createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: {
            $gt: Date.now()
        }
    });

    if (!user) {
        throw new APIError(401, "reset Token Expired or Invalid reset Token");
    }

    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new APIResponse(
                200,
                {},
                "Password has been reset successfully. Please login with new password"
            )
        )
})

const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    // if (!oldPassword || !newPassword) {
    //     throw new APIError(400, "Both old and new password is required");
    // }

    const user = await User.findById(req.user._id);

    if (!user) {
        throw new APIError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordValid(oldPassword);

    if (!isPasswordValid) {
        throw new APIError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    res.status(200).json(
        new APIResponse(200, {}, "Password changed successfully")
    );
});

export {
    registerUser,
    verifyUserEmail,
    loginUser,
    logoutUser,
    currentUser,
    resendEmailVerification,
    refreshAccessToken,
    forgotPasswordRequest,
    resetForgotPassword,
    changePassword,
};

