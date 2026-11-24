import type { Request, Response } from "express";
import { ServicoService } from "../services/ServicoService.js";

export class ServicoController {
    constructor(private servicoService: ServicoService) {}

    listar = async (_req: Request, res: Response) => {
        const servicos = await this.servicoService.listar();
        res.status(200).json(servicos);
    };

    buscarPorId = async (req: Request, res: Response) => {
        const servico = await this.servicoService.buscarPorId(req.params.id);
        res.status(200).json(servico);
    };

    criar = async (req: Request, res: Response) => {
        const servico = await this.servicoService.criar(req.body ?? {});
        res.status(201).json(servico);
    };

    atualizar = async (req: Request, res: Response) => {
        const servico = await this.servicoService.atualizar(req.params.id, req.body ?? {});
        res.status(200).json(servico);
    };

    excluir = async (req: Request, res: Response) => {
        await this.servicoService.excluir(req.params.id);
        res.status(200).json({ message: "Serviço removido com sucesso." });
    };
}
