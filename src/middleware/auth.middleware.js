import mongoose from "mongoose";
import { User } from "../models/user.models.js"
import { ProjectMember } from "../models/projectmember.models.js";
import { APIError } from "../utils/api-errors.js"
import { asyncHandler } from "../utils/async-handler.js"
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new APIError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken -emailVerificationToken -emailVerificationExpiry");

        if (!user) {
            throw new APIError(401, "Invalid Access Token")
        }

        req.user = user;
        next();
    } catch (error) {
        throw new APIError(401, "Invalid Access Token")
    }
});

export const validateProjectPermission = (roles = []) => {
    asyncHandler(async (req, res, next) => {
        const { projectId } = req.params;

        if (!projectId) {
            throw new APIError(400, "project id is missing.");
        }

        const projectMember = await ProjectMember.findOne({
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(projectId)
        });

        if (!projectMember) {
            throw new APIError(400, "Project member not found.");
        }

        const givenRole = projectMember?.role;

        req.user.role = givenRole;

        if (!roles.includes(givenRole)) {
            throw new APIError(403, "you do not have permission to perform this action")
        }

        next()
    });
};