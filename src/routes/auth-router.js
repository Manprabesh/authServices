import express from "express";
const authRouter = express.Router();

import {
    registerController,
    verifyOtpController,
    loginController,
    logoutController,
    refreshTokenController
} from "../controllers/auth-user.js";
authRouter.post("/register", registerController);
authRouter.post("/otp-verification", verifyOtpController);
authRouter.post("/login", loginController);
authRouter.get("/logout", logoutController);
authRouter.get("/get-token", refreshTokenController);

export default authRouter;
