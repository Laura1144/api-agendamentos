import { Router } from "express";
import { ClienteRepository } from "../repositories/ClienteRepository.js";
import { ClienteService } from "../services/ClienteService.js";
import { ClienteController } from "../controllers/ClienteController.js";

const controller = new ClienteController(new ClienteService(new ClienteRepository()));

export const clienteRoutes = Router();

clienteRoutes.get("/", controller.listar);
clienteRoutes.get("/:id", controller.buscarPorId);
clienteRoutes.post("/", controller.criar);
clienteRoutes.put("/:id", controller.atualizar);
clienteRoutes.delete("/:id", controller.excluir);
