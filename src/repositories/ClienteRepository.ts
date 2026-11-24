import { prisma } from "../lib/prisma.js";

export interface DadosClienteBanco {
    nome: string;
    email: string;
    telefone: string;
}

export class ClienteRepository {
    async listar() {
        return prisma.cliente.findMany({ orderBy: { nome: "asc" } });
    }

    async buscarPorId(id: string) {
        return prisma.cliente.findUnique({ where: { id } });
    }

    async buscarPorEmail(email: string) {
        return prisma.cliente.findUnique({ where: { email } });
    }

    async criar(dados: DadosClienteBanco) {
        return prisma.cliente.create({ data: dados });
    }

    async atualizar(id: string, dados: DadosClienteBanco) {
        return prisma.cliente.update({ where: { id }, data: dados });
    }

    async excluir(id: string) {
        return prisma.cliente.delete({ where: { id } });
    }

    async contarAgendamentos(id: string) {
        return prisma.agenda.count({ where: { clienteId: id } });
    }
}
