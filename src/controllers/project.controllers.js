import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { APIResponse } from "../utils/api-response.js";
import { APIError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js"
import mongoose from "mongoose";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";


const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([{
        $match: {
            user: new mongoose.Types.ObjectId(req.user._id)
        }
    },
    {
        $lookup: {
            from: "projects",
            localField: "project",
            foreignField: "_id",
            as: "projects",
            pipeline: [
                {
                    $lookup: {
                        from: "projectmembers",
                        localField: "_id",
                        foreignField: "project",
                        as: "projectmembers"
                    }
                },
                {
                    $addFields: {
                        members: {
                            $size: "$projectmembers"
                        }
                    }
                }
            ]
        }
    },
    {
        $unwind: "$projects"
    },
    {
        $project: {
            project: {
                _id: 1,
                name: 1,
                description: 1,
                members: 1,
                createdAt: 1,
                createdBy: 1
            },
            role: 1,
            _id: 0
        }
    }
    ])

    return res.status(200).json(new APIResponse(200, projects, "project fetched successfully."))
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new APIError(404, "Project not found");
    }

    return res.status(200)
        .json(new APIResponse(200, project, "Project fetched successfully."))
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id)
    });

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRolesEnum.ADMIN,
    })

    return res
        .status(201)
        .json(
            new APIResponse(
                201,
                project,
                `Project ${name} created. and ${req.user.username} is the project ADMIN.`
            )
        )
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const projectId = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        }, { new: true }
    );

    if (!project) {
        throw new APIError(404, "project not found.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200,
                project,
                "Project Updated successfully."
            )
        )
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findByIdAndDelete(projectId);

    if (!project) {
        throw new APIError(404, "Project Not found.")
    }

    return res
        .status(200)
        .json(
            new APIResponse(200,
                project,
                "Project Deleted successfully."
            )
        )
});

const addMembersToProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User does not exists");
    }

    await ProjectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
        },
        {
            user: new mongoose.Types.ObjectId(user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role,
        },
        {
            new: true,
            upsert: true
        },
    );

    return res
        .status(201)
        .json(new APIResponse(201, {}, "Project Member added successfully."))
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
        throw new APIError(404, "Project does not exist.");
    }

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "user",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                user: {
                    $arrElemAt: ["$user", 0]
                }
            }
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0
            }
        }
    ])

    return res.status(200).json(new APIResponse(200, projectMembers, "Project members fetched successfully."));

});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const { newRole } = req.body;

    if (!AvailableUserRoles.includes(newRole)) {
        throw new APIError(400, "Invalid Role.");
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
        {
            user: userId,       // Let Mongoose handle auto-casting to ObjectId
            project: projectId
        },
        {
            role: newRole
        },
        {
            new: true           // Returns the updated document
        }
    );

    // 3. If it returns null, the document didn't exist
    if (!projectMember) {
        // Note: 404 is the standard HTTP status code for "Not Found"
        throw new APIError(404, "Project member not found.");
    }

    // 4. Send successful response
    return res.status(200).json(
        new APIResponse(200, "Project member role is updated.", projectMember)
    );
});

const deleteMember = asyncHandler(async (req, res) => {
    //test
});

export {
    getProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    addMembersToProject,
    getProjectMembers,
    updateMemberRole,
    deleteMember

}