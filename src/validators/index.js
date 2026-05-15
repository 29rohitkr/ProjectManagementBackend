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

const userLoginValidator = () => {
    return [
        body("email")
            .optional()
            .isEmail()
            .withMessage("email is invalid."),
        body("password")
            .notEmpty()
            .withMessage("Password is required.")
    ]
}

const userChangePasswordValidator = () => {
    return [
        body("oldPassword")
            .notEmpty()
            .withMessage("Old Password is Required"),
        body("newPassword")
            .notEmpty()
            .withMessage("Old Password is Required")
            .isLength({ min: 6, max: 12 })
            .withMessage("password should be at least 6 character long, max 12 chars")
    ]
}

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is Invalid")
    ]
}

const userResetPasswordValidator = () => {
    return [
        body("newPassword")
            .notEmpty()
            .withMessage("New Password is Required")
            .isLength({ min: 6, max: 12 })
            .withMessage("password should be at least 6 character long, max 12 chars")
    ]
}
export {
    userRegisterValidator,
    userLoginValidator,
    userChangePasswordValidator,
    userForgotPasswordValidator,
    userResetPasswordValidator
}