import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { Task } from "../models/task.models.js";
import { SubTask } from "../models/subtask.models.js";
import mongoose from "mongoose";
import { APIResponse } from "../utils/api-response.js";
import { APIError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js"
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";
import { upload } from "../middleware/multer.middleware.js"

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new APIError(404, "Project does not exists.")
    }

    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId)
    }).populate("assignedTo", "avatar, username fullName")

    return res.status(201).json(
        new APIResponse(201, tasks, "Task Fetched successfully.")
    )

});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new APIError(404, "Project does not exists.")
    }

    const files = req.files || []

    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/images/${file.originalname}`,
            mimetype: file.mimetype,
            size: file.size
        }
    });

    const task = await Task.create({
        title,
        description,
        project: new mongoose.Types.ObjectId(projectId),
        assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : undefined,
        status,
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
        attachments,

    });

    if (!task) {
        throw new APIError(304, "Error occured while creating Task.")
    }

    return res.status(201).json(
        new APIResponse(201, task, "Task created successfully.")
    )
});

const getTaskById = asyncHandler(async (req, res) => {
    const taskId = req.params;

    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignFiled: "_id",
                as: "assignedTo",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]

            }
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignFiled: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignFiled: "_id",
                            as: "createdBy",
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
                            createdBy: {
                                $arrayElemAt: ["$createdBy", 0]
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                assignedTo: {
                    $arrayElemAt: ["$assignedTo", 0]
                }
            }
        }
    ]);

    if (!task || task.length === 0) {
        throw new APIError(401, "Task not found.")
    }

    return res.status(201).json(
        new APIResponse(201, task[0], "Task Fetched successfully.")
    )

});

const updateTask = asyncHandler(async (req, res) => {
    //test
});

const deleteTask = asyncHandler(async (req, res) => {
    //test
});

const createSubTask = asyncHandler(async (req, res) => {
    //test
});

const updateSubTask = asyncHandler(async (req, res) => {
    //test
});

const deleteSubTask = asyncHandler(async (req, res) => {
    //test
});


export {
    createTask,
    updateTask,
    deleteTask,
    getTasks,
    getTaskById,
    createSubTask,
    updateSubTask,
    deleteSubTask
}