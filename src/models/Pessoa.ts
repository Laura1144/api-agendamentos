import { Validacao } from "./Validacao.js";

export interface DadosPessoa {
    nome: unknown;
    email: unknown;
}

export abstract class Pessoa {
    readonly nome: string;
    readonly email: string;

    protected constructor(dados: DadosPessoa) {
        this.nome = Validacao.texto(dados.nome, "nome", 100);
        this.email = Validacao.email(dados.email);
    }
}
