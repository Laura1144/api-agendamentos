import { DadoInvalidoError } from "../errors/DadoInvalido.js";

export const STATUS_AGENDAMENTO = ["agendado", "concluido", "cancelado"] as const;
export type StatusAgendamento = (typeof STATUS_AGENDAMENTO)[number];

export class Agendamento {
    static readonly STATUS_INICIAL: StatusAgendamento = "agendado";

    constructor(private readonly status: string) {}

    static validarStatus(valor: unknown): StatusAgendamento {
        if (typeof valor !== "string" || !STATUS_AGENDAMENTO.includes(valor as StatusAgendamento)) {
            throw new DadoInvalidoError(`Status inválido. Use: ${STATUS_AGENDAMENTO.join(", ")}.`);
        }

        return valor as StatusAgendamento;
    }

    static validarData(valor: unknown, agora: Date = new Date()): Date {
        if (typeof valor !== "string" || valor.trim() === "") {
            throw new DadoInvalidoError('O campo "data" é obrigatório e deve estar no formato ISO 8601.');
        }

        const data = new Date(valor);

        if (isNaN(data.getTime())) {
            throw new DadoInvalidoError("Data inválida. Use o formato ISO 8601, ex.: 2026-12-01T14:00:00.000Z.");
        }

        if (data <= agora) {
            throw new DadoInvalidoError("Não é possível agendar em uma data passada.");
        }

        return data;
    }

    estaAtivo(): boolean {
        return this.status === "agendado";
    }

    estaFinalizado(): boolean {
        return !this.estaAtivo();
    }
}
