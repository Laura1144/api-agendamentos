import { Router } from "express";
import { AgendaRepository } from "../repositories/AgendaRepository.js";
import { ClienteRepository } from "../repositories/ClienteRepository.js";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository.js";
import { ServicoRepository } from "../repositories/ServicoRepository.js";
import { AgendaService } from "../services/AgendaService.js";
import { AgendaController } from "../controllers/AgendaController.js";

const service = new AgendaService(
    new AgendaRepository(),
    new ClienteRepository(),
    new ProfissionalRepository(),
    new ServicoRepository()
);
const controller = new AgendaController(service);

export const agendaRoutes = Router();

agendaRoutes.get("/", controller.listar);
agendaRoutes.get("/:id", controller.buscarPorId);
agendaRoutes.post("/", controller.criar);
agendaRoutes.put("/:id", controller.atualizar);
agendaRoutes.delete("/:id", controller.excluir);
