import { ProjectNote } from "../models/note.models.js";
import { Project } from "../models/project.models.js";
import { APIResponse } from "../utils/api-response.js";
import { APIError } from "../utils/api-errors.js";
import { asyncHandler } from "../utils/async-handler.js";
import mongoose from "mongoose";


const getNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const notes = await ProjectNote.find({
        project: new mongoose.Types.ObjectId(projectId)
    });

    if (!notes) {
        throw new APIError(404, "project not found");
    }

    return res.status(200).json(
        new APIResponse(200, notes, "Notes fetched successfully.")
    );
})

const getNoteById = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await ProjectNote.findById(noteId);

    if (!note) {
        throw new APIError(404, "note not found.");
    }

    return res.status(200).json(
        new APIResponse(200, note.content, "Note fetched successfully.")
    )
});

const createNote = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;
    const createdBy = req.user._id;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new APIError(404, "project Not found.");
    }

    const note = await ProjectNote.create({
        project: new mongoose.Types.ObjectId(projectId),
        createdBy: new mongoose.Types.ObjectId(createdBy),
        content: content.trim()
    })

    if (!note) {
        throw new APIError(404, "Some error occured, while creating note.")
    }

    return res.status(200).json(
        new APIResponse(200, note, "Note created successfully.")
    )
})

const updateNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;
    const { content } = req.body;

    const note = await ProjectNote.findByIdAndUpdate(noteId,
        {
            content: content.trim()
        },
        { returnDocument: "after" }
    );

    if (!note) {
        throw new APIError(404, "Some error occured, while updating note.")
    }

    return res.status(200).json(
        new APIResponse(200, note, "Note Updated successfully.")
    )
})

const deleteNote = asyncHandler(async (req, res) => {
    const { noteId } = req.params;

    const note = await ProjectNote.findByIdAndDelete(noteId
    );

    if (!note) {
        throw new APIError(404, "Some error occured, while deleting note.")
    }

    return res.status(200).json(
        new APIResponse(200, note, "Note Deleted successfully.")
    )
});


export {
    getNotes,
    getNoteById,
    createNote,
    updateNote,
    deleteNote
}