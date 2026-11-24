import { prisma } from "../lib/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

export interface CriarAgendamento {
    data: Date;
    status: string;
    valor: Prisma.AgendaUncheckedCreateInput["valor"];
    servicoId: string;
    profissionalId: string;
    clienteId: string;
}

const incluirRelacionamentos = {
    cliente: true,
    profissional: true,
    servico: true
} as const;

export class AgendaRepository {
    async listar() {
        return prisma.agenda.findMany({
            include: incluirRelacionamentos,
            orderBy: { data: "asc" }
        });
    }

    async buscarPorId(id: string) {
        return prisma.agenda.findUnique({
            where: { id },
            include: incluirRelacionamentos
        });
    }

    async criar(dados: CriarAgendamento) {
        return prisma.agenda.create({
            data: dados,
            include: incluirRelacionamentos
        });
    }

    async atualizar(id: string, dados: Partial<CriarAgendamento>) {
        return prisma.agenda.update({
            where: { id },
            data: dados,
            include: incluirRelacionamentos
        });
    }

    async excluir(id: string) {
        return prisma.agenda.delete({ where: { id } });
    }

    async buscarHorarios(data: Date, profissionalId: string, ignorarId?: string) {
        return prisma.agenda.findFirst({
            where: {
                profissionalId,
                data,
                status: "agendado",
                ...(ignorarId !== undefined && { id: { not: ignorarId } })
            }
        });
    }
}
