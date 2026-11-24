import { Router } from "express";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository.js";
import { ProfissionalService } from "../services/ProfissionalService.js";
import { ProfissionalController } from "../controllers/ProfissionalController.js";

const controller = new ProfissionalController(new ProfissionalService(new ProfissionalRepository()));

export const profissionalRoutes = Router();

profissionalRoutes.get("/", controller.listar);
profissionalRoutes.get("/:id", controller.buscarPorId);
profissionalRoutes.post("/", controller.criar);
profissionalRoutes.put("/:id", controller.atualizar);
profissionalRoutes.delete("/:id", controller.excluir);
