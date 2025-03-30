import { Router } from "express";
import { UploadsController } from "@/controllers/uploads-controller";
import { verifyUserAuthorization } from "@/middlewares/verify-user-authorization";
import uploadsConfig from "@/config/upload";
import multer from "multer";

export const uploadsRoutes = Router();
const uploadsController = new UploadsController();

const upload = multer(uploadsConfig.MULTER);

uploadsRoutes.use(verifyUserAuthorization(["employee"]));
uploadsRoutes.post("/", upload.single("file"), uploadsController.create);
