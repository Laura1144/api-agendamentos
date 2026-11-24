import { ServicoRepository } from "../repositories/ServicoRepository.js";
import { Servico } from "../models/Servico.js";
import { NaoEncontradoError } from "../errors/NaoEncontrado.js";
import { ConflitoError } from "../errors/Conflito.js";
import { DadoInvalidoError } from "../errors/DadoInvalido.js";
import { Validacao } from "../models/Validacao.js";
import type { DadosEntrada } from "./ClienteService.js";

export class ServicoService {
    constructor(private servicoRepository: ServicoRepository) {}

    async listar() {
        return this.servicoRepository.listar();
    }

    async buscarPorId(id: unknown) {
        const servico = await this.servicoRepository.buscarPorId(Validacao.uuid(id));

        if (!servico) {
            throw new NaoEncontradoError("Serviço não encontrado.");
        }

        return servico;
    }

    async criar(dados: DadosEntrada) {
        const servico = new Servico({
            nome: dados.nome,
            descricao: dados.descricao,
            valor: dados.valor
        });

        await this.garantirNomeDisponivel(servico.nome);

        return this.servicoRepository.criar(servico.paraPersistencia());
    }

    async atualizar(id: unknown, dados: DadosEntrada) {
        const atual = await this.buscarPorId(id);

        if (dados.nome === undefined && dados.descricao === undefined && dados.valor === undefined) {
            throw new DadoInvalidoError("Informe ao menos um campo para atualizar: nome, descricao ou valor.");
        }

        const servico = new Servico({
            nome: dados.nome ?? atual.nome,
            descricao: dados.descricao ?? atual.descricao,
            valor: dados.valor ?? atual.valor.toString()
        });

        await this.garantirNomeDisponivel(servico.nome, atual.id);

        return this.servicoRepository.atualizar(atual.id, servico.paraPersistencia());
    }

    async excluir(id: unknown) {
        const servico = await this.buscarPorId(id);

        const totalAgendamentos = await this.servicoRepository.contarAgendamentos(servico.id);

        if (totalAgendamentos > 0) {
            throw new ConflitoError("Não é possível excluir o serviço porque ele está vinculado a agendamentos.");
        }

        await this.servicoRepository.excluir(servico.id);
    }

    private async garantirNomeDisponivel(nome: string, ignorarId?: string) {
        const existente = await this.servicoRepository.buscarPorNome(nome);

        if (existente && existente.id !== ignorarId) {
            throw new ConflitoError("Já existe um serviço cadastrado com este nome.");
        }
    }
}
