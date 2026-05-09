import { body } from "express-validator";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required.")
            .isEmail()
            .withMessage("Email is Invalid"),
        body("username")
            .trim()
            .notEmpty()
            .withMessage("username is required")
            .isLowercase()
            .withMessage("username should be in lowercase")
            .isLength({ min: 3 })
            .withMessage("username must be atleast 3 character long."),
        body("password")
            .trim()
            .notEmpty()
            .withMessage("password is required.")
            .isLength({ min: 6, max: 12 })
            .withMessage("password should be at least 6 character long, max 12 chars"),
        body("fullname")
            .optional()
            .trim()
    ]
}

export {
    userRegisterValidator
}