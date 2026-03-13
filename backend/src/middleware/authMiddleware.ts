import { NextFunction, Request, Response } from "express";

import { AuthServiceError, getSessionFromToken } from "../services/authService";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const providedToken = req.header("x-bearer-token")?.trim();

  if (!providedToken) {
    res.status(401).json({ error: "Missing authentication token." });
    return;
  }

  try {
    const session = await getSessionFromToken(providedToken);
    req.auth = {
      userId: session.userId,
      sessionId: session.sessionId,
    };
    next();
  } catch (error) {
    if (error instanceof AuthServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    res.status(500).json({ error: "Failed to validate session." });
  }
};
