import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { sendSuccess } from "../utils/response";
const router = Router();
router.use(authenticate as any);
router.get("/", async (req: any, res: any) => sendSuccess(res, []));
export default router;
