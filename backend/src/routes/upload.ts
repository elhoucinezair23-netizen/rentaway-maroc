import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.middleware";
import { upload, handleUploadError } from "../middleware/upload.middleware";
import { uploadToCloudinary } from "../services/cloudinary.service";

const router = Router();

router.post(
  "/image",
  authenticate,
  upload.single("file"),
  handleUploadError,
  async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: "Fichier manquant" });
      return;
    }
    const folder = (req.query.folder as string) || "uploads";
    const url = await uploadToCloudinary(req.file.buffer, folder);
    res.json({ url });
  }
);

export default router;
