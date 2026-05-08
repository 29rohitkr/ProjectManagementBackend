import { APIResponse } from "../utils/api-response";
import { APIError } from "../utils/api-errors";
import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/async-handler.js"
import { sendEmail, emailVerificationMailgenContent } from "../utils/mail.js";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRafreshToken();

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
    const userExists = User.findOne({
        $or: [{ username }, { email }]
    })

    if (userExists) {
        throw new APIError(409, "Username or email already exists", []);
    }

    const user = await User.create({
        email,
        password,
        username,
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
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        ),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken, emailVerificationToken -emailVerificationExpiry");

    if (!createdUser) {
        throw new APIError(500, "Something went wrong while registering a user");
    }

    return res.status(200).json(
        new APIResponse(200, { user: createdUser },
            "User registered successfully and verification email has been sent on user's email"
        )
    )
})

export { registerUser };