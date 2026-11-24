import type { Request, Response } from "express";
import { ClienteService } from "../services/ClienteService.js";

export class ClienteController {
    constructor(private clienteService: ClienteService) {}

    listar = async (_req: Request, res: Response) => {
        const clientes = await this.clienteService.listar();
        res.status(200).json(clientes);
    };

    buscarPorId = async (req: Request, res: Response) => {
        const cliente = await this.clienteService.buscarPorId(req.params.id);
        res.status(200).json(cliente);
    };

    criar = async (req: Request, res: Response) => {
        const cliente = await this.clienteService.criar(req.body ?? {});
        res.status(201).json(cliente);
    };

    atualizar = async (req: Request, res: Response) => {
        const cliente = await this.clienteService.atualizar(req.params.id, req.body ?? {});
        res.status(200).json(cliente);
    };

    excluir = async (req: Request, res: Response) => {
        await this.clienteService.excluir(req.params.id);
        res.status(200).json({ message: "Cliente removido com sucesso." });
    };
}
