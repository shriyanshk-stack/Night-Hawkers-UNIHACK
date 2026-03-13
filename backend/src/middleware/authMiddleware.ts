import { NextFunction, Request, Response } from "express";

import { AuthServiceError, getUserFromAccessToken } from "../services/authService";

const extractBearerToken = (authorizationHeader?: string): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim();
};

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const providedToken = extractBearerToken(req.header("authorization"));

  if (!providedToken) {
    res.status(401).json({ error: "Missing or invalid bearer token." });
    return;
  }

  try {
    const authenticatedUser = await getUserFromAccessToken(providedToken);
    req.auth = {
      userId: authenticatedUser.userId,
      email: authenticatedUser.email,
      accessToken: authenticatedUser.accessToken,
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
