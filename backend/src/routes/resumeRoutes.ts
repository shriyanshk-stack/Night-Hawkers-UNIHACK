import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../middleware/authMiddleware";
import { extractAndSaveResume, ResumeServiceError } from "../services/resumeService";

const resumeRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are accepted."));
    }
  },
});

resumeRouter.post("/upload", requireAuth, upload.single("resume"), async (req, res) => {
  if (!req.auth) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No PDF file provided. Send the file in a 'resume' field." });
    return;
  }

  try {
    const result = await extractAndSaveResume(req.file.buffer, req.auth.userId, req.auth.accessToken);
    res.status(200).json({ message: "Resume processed and saved.", data: result.structured });
  } catch (error) {
    if (error instanceof ResumeServiceError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: "Failed to process resume." });
  }
});

export default resumeRouter;
