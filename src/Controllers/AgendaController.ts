import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export class AgendaController {
    static async criar(req: Request, res: Response) {
        const {data, status, valor, servicoId, profissionalId, clienteId} = req.body;

        try{
           const agenda = await prisma.agenda.create({
            data: {
                data: new Date(data),
                status,
                valor,
                servicoId,
                profissionalId,
                clienteId
            }
        });

        res.status(201).json(agenda); 
        }catch (error) {
            console.log("Erro ao criar agendamento: ", error)

            res.status(500).json({
                message: "Erro ao criar agendamento."
            });
        };
    }

    static async listar(req: Request, res: Response) {
        try{
           const agenda = await prisma.agenda.findMany();

            res.status(201).json(agenda); 
        }catch (error) {
            console.log("Erro ao buscar agendamento: ", error)

            res.status(500).json({
                message: "Erro ao buscar agendamento."
            });
        };
    }

    static async atualizar(req: Request, res: Response) {
        const id = Number(req.params.id);

        try{
            const {data, status, valor, servicoId, profissionalId, clienteId} = req.body;
            const agenda = await prisma.agenda.update({
                where: {
                    id
                },
                data: {
                    ...(data !== undefined && {data}),
                    ...(status !== undefined && {status}),
                    ...(valor !== undefined && {valor}),
                    ...(servicoId !== undefined && {servicoId}),
                    ...(profissionalId !== undefined && {profissionalId}),
                    ...(clienteId !== undefined && {clienteId})
                }
            });

            res.status(200).json(agenda); 
        }catch (error) {
            console.log("Erro ao atualizar agendamento: ", error)

            res.status(500).json({
                message: "Erro ao atualizar agendamento."
            });
        };
    }

    static async deletar(req: Request, res: Response) {
        const id = Number(req.params.id);

        try{
            const agenda = await prisma.agenda.delete({
                where: {
                    id
                }
            });

            res.status(200).json(agenda); 
        }catch (error) {
            console.log("Erro ao deletar agendamento: ", error)

            res.status(500).json({
                message: "Erro ao deletar agendamento."
            });
        };
    }
}