import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class ProfissionalController {
    static async criar(req: Request, res: Response) {
        const {nome, email} = req.body;

        try{
            const profssional = await prisma.profissional.create({
                data: {
                    nome, 
                    email
                }
            });

            res.status(201).json(profssional);
        } catch(error) {
            console.log("Erro ao cadastrar profissional: ", error)

            res.status(500).json({
                message: "Erro ao cadastrar profissional"
            })
        }
    }

    static async listar(req: Request, res: Response) {
        try{
            const profssional = await prisma.profissional.findMany();
            res.status(201).json(profssional);
        } catch(error) {
            console.log("Erro ao buscar profissional: ", error)

            res.status(500).json({
                message: "Erro ao buscar profissional"
            })
        }
    }

    static async atualizar(req: Request, res: Response) {
        const id = Number(req.params.id)

        try{
            const {nome, email} = req.body;
            const profssional = await prisma.profissional.update({
                where: {
                    id
                },
                data: {
                    ...(nome !== undefined && {nome}),
                    ...(email !== undefined && {email})
                }
            });

            res.status(201).json(profssional);
        } catch(error) {
            console.log("Erro ao atualizar profissional: ", error)

            res.status(500).json({
                message: "Erro ao atualizar profissional"
            })
        }
    }

    static async deletar(req: Request, res: Response) {
        const id = Number(req.params.id)

        try{
            const profssional = await prisma.profissional.delete({
                where: {
                    id
                }
            });

            res.status(201).json(profssional);
        } catch(error) {
            console.log("Erro ao deletar profissional: ", error)

            res.status(500).json({
                message: "Erro ao deletar profissional"
            })
        }
    }
}