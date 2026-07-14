import { Router, type IRouter } from "express";
import { LoginBody, LoginResponse, LogoutResponse, GetMeResponse } from "@workspace/api-zod";

const ADMIN_USERNAME = "ahnafsaikat08";
const ADMIN_PASSWORD = "280323";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.authenticated = true;
    res.json(LoginResponse.parse({ authenticated: true }));
    return;
  }

  res.status(401).json({ error: "Invalid credentials" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json(LogoutResponse.parse({ authenticated: false }));
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  res.json(GetMeResponse.parse({ authenticated: !!req.session.authenticated }));
});

export default router;
