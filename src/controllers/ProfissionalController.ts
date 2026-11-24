import type { Request, Response } from "express";
import { ProfissionalService } from "../services/ProfissionalService.js";

export class ProfissionalController {
    constructor(private profissionalService: ProfissionalService) {}

    listar = async (_req: Request, res: Response) => {
        const profissionais = await this.profissionalService.listar();
        res.status(200).json(profissionais);
    };

    buscarPorId = async (req: Request, res: Response) => {
        const profissional = await this.profissionalService.buscarPorId(req.params.id);
        res.status(200).json(profissional);
    };

    criar = async (req: Request, res: Response) => {
        const profissional = await this.profissionalService.criar(req.body ?? {});
        res.status(201).json(profissional);
    };

    atualizar = async (req: Request, res: Response) => {
        const profissional = await this.profissionalService.atualizar(req.params.id, req.body ?? {});
        res.status(200).json(profissional);
    };

    excluir = async (req: Request, res: Response) => {
        await this.profissionalService.excluir(req.params.id);
        res.status(200).json({ message: "Profissional removido com sucesso." });
    };
}
