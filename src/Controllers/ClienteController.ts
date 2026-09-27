import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class ClienteController {
    static async criar(req: Request, res: Response) {
        const {nome, email, telefone} = req.body;

        try{
           const cliente = await prisma.cliente.create({
            data: {
                nome, 
                email, 
                telefone
            }
        });

        res.status(201).json(cliente); 
        }catch (error) {
            console.log("Erro ao cadastrar cliente: ", error)

            res.status(500).json({
                message: "Erro ao cadastrar cliente."
            });
        };
    }

    static async listar(req: Request, res: Response) {
        try {
            const cliente = await prisma.cliente.findMany();
            res.json(cliente);
        } catch(error) {
            console.log("Erro ao buscr clientes: ", error);

            res.status(500).json({
                message: "Erro ao bsucar clientes."
            });
        }
    }

    static async atualizar(req: Request, res: Response) {
        const id = Number(req.params.id);

        try{
            const {nome, email, telefone} = req.body;
            const cliente = await prisma.cliente.update({
                where: {
                    id
                },
                data: {
                    ...(nome !== undefined && { nome }),
                    ...(email !== undefined && { email }),
                    ...(telefone !== undefined && { telefone })
                }
            });
            res.json(cliente);
        } catch(error) {
            console.log("Erro ao atualizar usuário: ", error)
            res.status(500).json({
                message: "Erro ao atualizar usuário"
            })
        }
    }

    static async deletar(req: Request, res: Response) {
        const id = Number(req.params.id);

        try{
            const cliente = await prisma.cliente.delete({
                where: {
                    id
                }
            });
            res.json(cliente);
        } catch(error) {
            console.log("Erro ao deletar usuário: ", error)
            res.status(500).json({
                message: "Erro ao deletar usuário"
            })
        }
    }
}