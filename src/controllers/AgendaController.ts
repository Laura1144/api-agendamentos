import type { Request, Response } from "express";
import { AgendaService } from "../services/AgendaService.js";

export class AgendaController {
    constructor(private agendaService: AgendaService) {}

    listar = async (_req: Request, res: Response) => {
        const agendamentos = await this.agendaService.listar();
        res.status(200).json(agendamentos);
    };

    buscarPorId = async (req: Request, res: Response) => {
        const agendamento = await this.agendaService.buscarPorId(req.params.id);
        res.status(200).json(agendamento);
    };

    criar = async (req: Request, res: Response) => {
        const agendamento = await this.agendaService.criar(req.body ?? {});
        res.status(201).json(agendamento);
    };

    atualizar = async (req: Request, res: Response) => {
        const agendamento = await this.agendaService.atualizar(req.params.id, req.body ?? {});
        res.status(200).json(agendamento);
    };

    excluir = async (req: Request, res: Response) => {
        await this.agendaService.excluir(req.params.id);
        res.status(200).json({ message: "Agendamento removido com sucesso." });
    };
}
