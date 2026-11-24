import { ProfissionalRepository } from "../repositories/ProfissionalRepository.js";
import { Profissional } from "../models/Profissional.js";
import { NaoEncontradoError } from "../errors/NaoEncontrado.js";
import { ConflitoError } from "../errors/Conflito.js";
import { DadoInvalidoError } from "../errors/DadoInvalido.js";
import { Validacao } from "../models/Validacao.js";
import type { DadosEntrada } from "./ClienteService.js";

export class ProfissionalService {
    constructor(private profissionalRepository: ProfissionalRepository) {}

    async listar() {
        return this.profissionalRepository.listar();
    }

    async buscarPorId(id: unknown) {
        const profissional = await this.profissionalRepository.buscarPorId(Validacao.uuid(id));

        if (!profissional) {
            throw new NaoEncontradoError("Profissional não encontrado.");
        }

        return profissional;
    }

    async criar(dados: DadosEntrada) {
        const profissional = new Profissional({ nome: dados.nome, email: dados.email });

        await this.garantirEmailDisponivel(profissional.email);

        return this.profissionalRepository.criar(profissional.paraPersistencia());
    }

    async atualizar(id: unknown, dados: DadosEntrada) {
        const atual = await this.buscarPorId(id);

        if (dados.nome === undefined && dados.email === undefined) {
            throw new DadoInvalidoError("Informe ao menos um campo para atualizar: nome ou email.");
        }

        const profissional = new Profissional({
            nome: dados.nome ?? atual.nome,
            email: dados.email ?? atual.email
        });

        await this.garantirEmailDisponivel(profissional.email, atual.id);

        return this.profissionalRepository.atualizar(atual.id, profissional.paraPersistencia());
    }

    async excluir(id: unknown) {
        const profissional = await this.buscarPorId(id);

        const totalAgendamentos = await this.profissionalRepository.contarAgendamentos(profissional.id);

        if (totalAgendamentos > 0) {
            throw new ConflitoError("Não é possível excluir o profissional porque ele possui agendamentos.");
        }

        await this.profissionalRepository.excluir(profissional.id);
    }

    private async garantirEmailDisponivel(email: string, ignorarId?: string) {
        const existente = await this.profissionalRepository.buscarPorEmail(email);

        if (existente && existente.id !== ignorarId) {
            throw new ConflitoError("Já existe um profissional cadastrado com este e-mail.");
        }
    }
}
