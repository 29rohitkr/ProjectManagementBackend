import { validationResult } from "express-validator"
import { APIError } from "../utils/api-errors.js"


export const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];

    errors.array().map((err) => extractedErrors.push({
        [err.path]: err.msg
    }));
    console.log(extractedErrors);

    throw new APIError(422, "Received data is not valid.", extractedErrors);
    // return next(new APIError(422, "Received data is not valid.", extractedErrors));
}