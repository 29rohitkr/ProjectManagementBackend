import { Router } from "express";

import {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask
} from "../controllers/task.controllers.js"
import {
    createTaskValidator,
    createSubTaskValidator,
    updateSubTaskValidator
} from "../validators/index.js";
import { validate } from "../middleware/validator.middleware.js";
import { verifyJWT, validateProjectPermission } from "../middleware/auth.middleware.js";
import { AvailableUserRoles, UserRolesEnum } from "../utils/constants.js";
import { upload } from "../middleware/multer.middleware.js"

const router = Router()
router.use(verifyJWT);

router
    .route("/:projectId")
    .get(
        validateProjectPermission(AvailableUserRoles),
        getTasks
    )
    .post(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        upload.array("files"),
        createTaskValidator(),
        validate,
        createTask
    )


router
    .route("/:projectId/t/:taskId")
    .get(
        validateProjectPermission(AvailableUserRoles),
        getTaskById
    )
    .put(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        upload.array("files"),
        createTaskValidator(),
        validate,
        updateTask
    )
    .delete(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        deleteTask
    )
router
    .route("/:projectId/t/:taskId/subtasks")
    .post(validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        createSubTaskValidator(),
        validate,
        createSubTask
    )

router
    .route("/:projectId/st/:subTaskId")
    .put(validateProjectPermission(AvailableUserRoles),
        updateSubTaskValidator(),
        validate,
        updateSubTask
    )
    .delete(
        validateProjectPermission([UserRolesEnum.ADMIN, UserRolesEnum.PROJECT_ADMIN]),
        deleteSubTask
    )


export default router;