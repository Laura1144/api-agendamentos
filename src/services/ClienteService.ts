import { ClienteRepository } from "../repositories/ClienteRepository.js";
import { Cliente } from "../models/Cliente.js";
import { NaoEncontradoError } from "../errors/NaoEncontrado.js";
import { ConflitoError } from "../errors/Conflito.js";
import { DadoInvalidoError } from "../errors/DadoInvalido.js";
import { Validacao } from "../models/Validacao.js";

export type DadosEntrada = Record<string, unknown>;

export class ClienteService {
    constructor(private clienteRepository: ClienteRepository) {}

    async listar() {
        return this.clienteRepository.listar();
    }

    async buscarPorId(id: unknown) {
        const cliente = await this.clienteRepository.buscarPorId(Validacao.uuid(id));

        if (!cliente) {
            throw new NaoEncontradoError("Cliente não encontrado.");
        }

        return cliente;
    }

    async criar(dados: DadosEntrada) {
        const cliente = new Cliente({
            nome: dados.nome,
            email: dados.email,
            telefone: dados.telefone
        });

        await this.garantirEmailDisponivel(cliente.email);

        return this.clienteRepository.criar(cliente.paraPersistencia());
    }

    async atualizar(id: unknown, dados: DadosEntrada) {
        const atual = await this.buscarPorId(id);

        if (dados.nome === undefined && dados.email === undefined && dados.telefone === undefined) {
            throw new DadoInvalidoError("Informe ao menos um campo para atualizar: nome, email ou telefone.");
        }

        const cliente = new Cliente({
            nome: dados.nome ?? atual.nome,
            email: dados.email ?? atual.email,
            telefone: dados.telefone ?? atual.telefone
        });

        await this.garantirEmailDisponivel(cliente.email, atual.id);

        return this.clienteRepository.atualizar(atual.id, cliente.paraPersistencia());
    }

    async excluir(id: unknown) {
        const cliente = await this.buscarPorId(id);

        const totalAgendamentos = await this.clienteRepository.contarAgendamentos(cliente.id);

        if (totalAgendamentos > 0) {
            throw new ConflitoError("Não é possível excluir o cliente porque ele possui agendamentos.");
        }

        await this.clienteRepository.excluir(cliente.id);
    }

    private async garantirEmailDisponivel(email: string, ignorarId?: string) {
        const existente = await this.clienteRepository.buscarPorEmail(email);

        if (existente && existente.id !== ignorarId) {
            throw new ConflitoError("Já existe um cliente cadastrado com este e-mail.");
        }
    }
}
