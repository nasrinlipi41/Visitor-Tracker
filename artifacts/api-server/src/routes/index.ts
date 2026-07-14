import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import visitsRouter from "./visits";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(visitsRouter);

export default router;
