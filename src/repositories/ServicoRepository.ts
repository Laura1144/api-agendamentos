import { prisma } from "../lib/prisma.js";

export interface DadosServicoBanco {
    nome: string;
    descricao: string;
    valor: number;
}

export class ServicoRepository {
    async listar() {
        return prisma.servico.findMany({ orderBy: { nome: "asc" } });
    }

    async buscarPorId(id: string) {
        return prisma.servico.findUnique({ where: { id } });
    }

    async buscarPorNome(nome: string) {
        return prisma.servico.findUnique({ where: { nome } });
    }

    async criar(dados: DadosServicoBanco) {
        return prisma.servico.create({ data: dados });
    }

    async atualizar(id: string, dados: DadosServicoBanco) {
        return prisma.servico.update({ where: { id }, data: dados });
    }

    async excluir(id: string) {
        return prisma.servico.delete({ where: { id } });
    }

    async contarAgendamentos(id: string) {
        return prisma.agenda.count({ where: { servicoId: id } });
    }
}
