import { prisma } from "../lib/prisma.js";

export interface DadosProfissionalBanco {
    nome: string;
    email: string;
}

export class ProfissionalRepository {
    async listar() {
        return prisma.profissional.findMany({ orderBy: { nome: "asc" } });
    }

    async buscarPorId(id: string) {
        return prisma.profissional.findUnique({ where: { id } });
    }

    async buscarPorEmail(email: string) {
        return prisma.profissional.findUnique({ where: { email } });
    }

    async criar(dados: DadosProfissionalBanco) {
        return prisma.profissional.create({ data: dados });
    }

    async atualizar(id: string, dados: DadosProfissionalBanco) {
        return prisma.profissional.update({ where: { id }, data: dados });
    }

    async excluir(id: string) {
        return prisma.profissional.delete({ where: { id } });
    }

    async contarAgendamentos(id: string) {
        return prisma.agenda.count({ where: { profissionalId: id } });
    }
}
