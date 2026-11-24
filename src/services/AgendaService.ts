import { AgendaRepository, type CriarAgendamento } from "../repositories/AgendaRepository.js";
import { ClienteRepository } from "../repositories/ClienteRepository.js";
import { ProfissionalRepository } from "../repositories/ProfissionalRepository.js";
import { ServicoRepository } from "../repositories/ServicoRepository.js";
import { Agendamento } from "../models/Agendamento.js";
import { NaoEncontradoError } from "../errors/NaoEncontrado.js";
import { DadoInvalidoError } from "../errors/DadoInvalido.js";
import { ConflitoError } from "../errors/Conflito.js";
import { Validacao } from "../models/Validacao.js";
import type { DadosEntrada } from "./ClienteService.js";

export class AgendaService {
    constructor(
        private agendaRepository: AgendaRepository,
        private clienteRepository: ClienteRepository,
        private profissionalRepository: ProfissionalRepository,
        private servicoRepository: ServicoRepository
    ) {}

    async listar() {
        return this.agendaRepository.listar();
    }

    async buscarPorId(id: unknown) {
        const agenda = await this.agendaRepository.buscarPorId(Validacao.uuid(id));

        if (!agenda) {
            throw new NaoEncontradoError("Agendamento não encontrado.");
        }

        return agenda;
    }

    async criar(dados: DadosEntrada) {
        if (!dados.data || !dados.clienteId || !dados.profissionalId || !dados.servicoId) {
            throw new DadoInvalidoError("Data, cliente, profissional e serviço são obrigatórios.");
        }

        const clienteId = Validacao.uuid(dados.clienteId, "clienteId");
        const profissionalId = Validacao.uuid(dados.profissionalId, "profissionalId");
        const servicoId = Validacao.uuid(dados.servicoId, "servicoId");

        const data = Agendamento.validarData(dados.data);

        await this.garantirClienteExiste(clienteId);
        await this.garantirProfissionalExiste(profissionalId);
        const servico = await this.buscarServico(servicoId);

        await this.garantirHorarioLivre(data, profissionalId);

        return this.agendaRepository.criar({
            data,
            status: Agendamento.STATUS_INICIAL,
            valor: servico.valor,
            clienteId,
            profissionalId,
            servicoId
        });
    }

    async atualizar(id: unknown, dados: DadosEntrada) {
        const agenda = await this.buscarPorId(id);

        const camposPermitidos = ["data", "status", "clienteId", "profissionalId", "servicoId"];
        if (!camposPermitidos.some((campo) => dados[campo] !== undefined)) {
            throw new DadoInvalidoError(`Informe ao menos um campo para atualizar: ${camposPermitidos.join(", ")}.`);
        }

        if (new Agendamento(agenda.status).estaFinalizado()) {
            throw new ConflitoError("Agendamentos concluídos ou cancelados não podem ser alterados.");
        }

        const alteracoes: Partial<CriarAgendamento> = {};

        if (dados.status !== undefined) {
            alteracoes.status = Agendamento.validarStatus(dados.status);
        }

        if (dados.data !== undefined) {
            alteracoes.data = Agendamento.validarData(dados.data);
        }

        if (dados.clienteId !== undefined) {
            alteracoes.clienteId = Validacao.uuid(dados.clienteId, "clienteId");
            await this.garantirClienteExiste(alteracoes.clienteId);
        }

        if (dados.profissionalId !== undefined) {
            alteracoes.profissionalId = Validacao.uuid(dados.profissionalId, "profissionalId");
            await this.garantirProfissionalExiste(alteracoes.profissionalId);
        }

        if (dados.servicoId !== undefined) {
            alteracoes.servicoId = Validacao.uuid(dados.servicoId, "servicoId");
            const servico = await this.buscarServico(alteracoes.servicoId);
            alteracoes.valor = servico.valor;
        }

        const mudouHorario = alteracoes.data !== undefined || alteracoes.profissionalId !== undefined;
        const continuaAtivo = new Agendamento(alteracoes.status ?? agenda.status).estaAtivo();

        if (mudouHorario && continuaAtivo) {
            await this.garantirHorarioLivre(
                alteracoes.data ?? agenda.data,
                alteracoes.profissionalId ?? agenda.profissionalId,
                agenda.id
            );
        }

        return this.agendaRepository.atualizar(agenda.id, alteracoes);
    }

    async excluir(id: unknown) {
        const agenda = await this.buscarPorId(id);
        await this.agendaRepository.excluir(agenda.id);
    }

    private async garantirClienteExiste(clienteId: string) {
        const cliente = await this.clienteRepository.buscarPorId(clienteId);

        if (!cliente) {
            throw new NaoEncontradoError("Cliente não encontrado.");
        }
    }

    private async garantirProfissionalExiste(profissionalId: string) {
        const profissional = await this.profissionalRepository.buscarPorId(profissionalId);

        if (!profissional) {
            throw new NaoEncontradoError("Profissional não encontrado.");
        }
    }

    private async buscarServico(servicoId: string) {
        const servico = await this.servicoRepository.buscarPorId(servicoId);

        if (!servico) {
            throw new NaoEncontradoError("Serviço não encontrado.");
        }

        return servico;
    }

    private async garantirHorarioLivre(data: Date, profissionalId: string, ignorarId?: string) {
        const conflito = await this.agendaRepository.buscarHorarios(data, profissionalId, ignorarId);

        if (conflito) {
            throw new ConflitoError("Profissional já possui agendamento neste horário.");
        }
    }
}
