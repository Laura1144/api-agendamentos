import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class ServicoController {
    static async criar(req: Request, res: Response) {
        const {nome, descricao, valor} = req.body;

        try{
            const servico = await prisma.servico.create({
                data: {
                    nome,
                    descricao,
                    valor
                }
            })

            res.status(201).json(servico);
        } catch(error) {
            console.log('Erro ao criar serviço: ', error)

            res.status(500).json({
                message: "Erro ao criar serviço"
            })
        }
    }

    static async listar(req: Request, res: Response) {
        try{
            const servico = await prisma.servico.findMany();
            res.status(201).json(servico);
        } catch(error) {
            console.log('Erro ao listar serviço: ', error)

            res.status(500).json({
                message: "Erro ao listar serviço"
            })
        }
    }

    static async atualizar(req: Request, res: Response) {
        const id = Number(req.params.id);

        try{
            const {nome, descricao, valor} = req.body;
            const servico = await prisma.servico.update({
                where: {
                    id
                },
                data: {
                    ...(nome !== undefined && {nome}),
                    ...(descricao !== undefined && {descricao}),
                    ...(valor !== undefined && {valor})
                }
            })

            res.status(201).json(servico);
        } catch(error) {
            console.log('Erro ao atualizar serviço: ', error)

            res.status(500).json({
                message: "Erro ao atualizar serviço"
            })
        }
    }

    static async deletar(req: Request, res: Response) {
        const id = Number(req.params.id);

        try{
            const servico = await prisma.servico.delete({
                where: {
                    id
                }
            })

            res.status(201).json(servico);
        } catch(error) {
            console.log('Erro ao deletar serviço: ', error)

            res.status(500).json({
                message: "Erro ao deletar serviço"
            })
        }
    }
}