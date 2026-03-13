import { Response, Router } from "express";

import { requireAuth } from "../middleware/authMiddleware";
import {
  AuthServiceError,
  isValidEmail,
  loginUser,
  logoutCurrentSession,
  registerUser,
} from "../services/authService";

const authRouter = Router();

const sendBadRequest = (message: string, response: Response): void => {
  response.status(400).json({ error: message });
};

authRouter.post("/register", async (req, res) => {
  const emailValue = req.body?.email;
  const passwordValue = req.body?.password;

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    sendBadRequest("Email and password are required.", res);
    return;
  }

  if (!isValidEmail(emailValue.trim().toLowerCase())) {
    sendBadRequest("Invalid email format.", res);
    return;
  }

  if (passwordValue.trim().length < 8) {
    sendBadRequest("Password must be at least 8 characters long.", res);
    return;
  }

  try {
    const user = await registerUser(emailValue, passwordValue);
    res.status(201).json({ user });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to register user." });
  }
});

authRouter.post("/login", async (req, res) => {
  const emailValue = req.body?.email;
  const passwordValue = req.body?.password;

  if (typeof emailValue !== "string" || typeof passwordValue !== "string") {
    sendBadRequest("Email and password are required.", res);
    return;
  }

  if (!isValidEmail(emailValue.trim().toLowerCase())) {
    sendBadRequest("Invalid email format.", res);
    return;
  }

  try {
    const loginResult = await loginUser(emailValue, passwordValue);
    res.status(200).json(loginResult);
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to process login." });
  }
});

authRouter.get("/me", requireAuth, async (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  res.status(200).json({
    user: {
      id: req.auth.userId,
      email: req.auth.email,
    },
  });
});

authRouter.post("/logout", requireAuth, async (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  try {
    await logoutCurrentSession(req.auth.accessToken);
    res.status(200).json({ message: "Logged out." });
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to log out." });
  }
});

export default authRouter;
