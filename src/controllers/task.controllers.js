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
    const { taskId } = req.params;

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
                foreignField: "_id",
                as: "assignedTo",
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
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                as: "subtasks",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
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
    const { taskId } = req.params;
    const { title, description, assignedTo, status } = req.body;

    const updateData = {};

    if (title && title.trim()) {
        updateData.title = title.trim();
    }

    if (description && description.trim()) {
        updateData.description = description.trim();
    }

    if (assignedTo && assignedTo.trim()) {
        updateData.assignedTo = new mongoose.Types.ObjectId(assignedTo);
    }

    if (status && status.trim()) {
        updateData.status = status.trim();
    }

    const files = req.files || []
    if (files && files.length >= 1) {
        const attachments = files.map((file) => {
            return {
                url: `${process.env.SERVER_URL}/images/${file.originalname}`,
                mimetype: file.mimetype,
                size: file.size
            }
        });

        updateData.attachments = attachments;
    }




    const task = await Task.findById(taskId);

    if (!task) {
        throw new APIError(404, "TaskId is Invalid or Task does not Exists.");
    }

    // Check if at least one field is provided for update
    if (Object.keys(updateData).length === 0) {
        throw new APIError(400, "At least one field (title or description) with valid value is required.");
    }

    const utask = await Task.findByIdAndUpdate(taskId, updateData,
        { new: true }
    );

    if (!utask) {
        throw new APIError(400, "Some error occured while updating task.");
    }

    return res.status(200).json(
        new APIResponse(200, utask, "Task updated successfully.")
    )

});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findByIdAndDelete(taskId);

    if (!task) {
        throw new APIError(404, "Task not found.")
    }

    return res.status(200).json(
        new APIResponse(200, task, "Task deleted successfully.")
    )
});

const createSubTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { title } = req.body;

    const task = await Task.findById(taskId);

    if (!task) {
        throw new APIError(404, "Task not found. subtask cannot be created.");
    }

    const subtask = await SubTask.create({
        title: title,
        task: new mongoose.Types.ObjectId(task._id),
        createdBy: req.user._id
    })

    return res.status(200).json(new APIResponse(200, subtask, "Subtask created successfully."))
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;
    const { title, isCompleted } = req.body;
    const updateData = {};

    if (title && title.trim()) {
        updateData.title = title;
    }

    if (isCompleted === "true" || isCompleted === "false") {
        updateData.isCompleted = isCompleted;
    }

    const stask = await SubTask.findByIdAndUpdate(subTaskId,
        updateData,
        { returnDocument: "after" }
    );

    if (!stask) {
        throw new APIError(404, "SubTask not updated.")
    }

    return res.status(200).json(
        new APIResponse(200, stask, "Sub Task Updated successfully.")
    )
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { subTaskId } = req.params;

    const stask = await SubTask.findByIdAndDelete(subTaskId);

    if (!stask) {
        throw new APIError(404, "SubTask deleted.")
    }

    return res.status(200).json(
        new APIResponse(200, stask, "SubTask deleted.")
    )
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