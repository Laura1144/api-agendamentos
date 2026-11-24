import { DadoInvalidoError } from "../errors/DadoInvalido.js";
import { Validacao } from "./Validacao.js";

export interface DadosServico {
    nome: unknown;
    descricao: unknown;
    valor: unknown;
}

export class Servico {
    static readonly VALOR_MAXIMO = 99999999.99;

    readonly nome: string;
    readonly descricao: string;
    readonly valor: number;

    constructor(dados: DadosServico) {
        this.nome = Validacao.texto(dados.nome, "nome", 100);
        this.descricao = Validacao.texto(dados.descricao, "descricao", 255);
        this.valor = Servico.validarValor(dados.valor);
    }

    private static validarValor(valor: unknown): number {
        const numero = typeof valor === "string" && valor.trim() !== "" ? Number(valor) : valor;

        if (typeof numero !== "number" || !Number.isFinite(numero)) {
            throw new DadoInvalidoError('O campo "valor" deve ser um número.');
        }

        if (numero <= 0) {
            throw new DadoInvalidoError("O valor do serviço deve ser maior que zero.");
        }

        if (numero > Servico.VALOR_MAXIMO) {
            throw new DadoInvalidoError("O valor do serviço é maior que o permitido.");
        }

        return Math.round(numero * 100) / 100;
    }

    paraPersistencia() {
        return {
            nome: this.nome,
            descricao: this.descricao,
            valor: this.valor
        };
    }
}
