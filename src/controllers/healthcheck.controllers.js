import { APIResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";

/*
const healthCheck = async (req, res, next) => {
    try {
        // await some async operations if needed
        res.status(200).json(
            new APIResponse(200, { message: "Server is running" })
        );
    } catch (error) { 
        next(error);
    }
}
*/

// Using asyncHandler to avoid try-catch in every controller    

const healthCheck = asyncHandler(async (req, res, next) => {
    res.status(200).json(new APIResponse(200, { message: "Server is running." }));
});

export default healthCheck; // { healthCheck }