import express from "express";
import * as qoController from "./QO.controller.js";
import { verifyToken, verifyRole } from "../middleware/auth.middleware.js";
import { validate } from '../middleware/validate.middleware.js';
import { createQOSchema, updateQOSchema , updateQOStatusSchema} from './QO.schema.js';


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: QualityOfficer
 *   description: Quality Officer profile management
 */

router.post(
  "/profile",
  verifyToken,
  validate(createQOSchema),
  verifyRole("quality_officer"),
  qoController.createQOProfile
);

router.get(
  "/profile/me",
  verifyToken,
  verifyRole("quality_officer"),
  qoController.getMyQOProfile
);

router.put(
  "/profile/me",
  verifyToken,
  validate(updateQOSchema),
  verifyRole("quality_officer"),
  qoController.updateQOProfile
);

router.patch(
  "/profile/me/status",
  verifyToken,
   validate(updateQOStatusSchema),
  verifyRole("quality_officer"),
  qoController.updateQOStatus
);

router.get(
  "/",
  verifyToken,
  verifyRole("admin"),
  qoController.getAllQOs
);

router.get(
  "/:id",
  verifyToken,
  verifyRole("admin"),
  qoController.getQOById
);

export default router;