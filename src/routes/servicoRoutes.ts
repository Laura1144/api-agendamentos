import { Router } from "express";
import { ServicoRepository } from "../repositories/ServicoRepository.js";
import { ServicoService } from "../services/ServicoService.js";
import { ServicoController } from "../controllers/ServicoController.js";

const controller = new ServicoController(new ServicoService(new ServicoRepository()));

export const servicoRoutes = Router();

servicoRoutes.get("/", controller.listar);
servicoRoutes.get("/:id", controller.buscarPorId);
servicoRoutes.post("/", controller.criar);
servicoRoutes.put("/:id", controller.atualizar);
servicoRoutes.delete("/:id", controller.excluir);
