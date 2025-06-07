import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createSession , joinSession , endInterview } from "../controllers/session.controller.js";


const router = express.Router();

router.post("/sessions" , protectRoute , createSession);
router.post("/sessions/:code" , protectRoute , joinSession);
router.post("/sessions/:code/end" , protectRoute , endInterview);

export default router;