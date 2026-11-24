import { Pessoa, type DadosPessoa } from "./Pessoa.js";

export type DadosProfissional = DadosPessoa;

export class Profissional extends Pessoa {
    constructor(dados: DadosProfissional) {
        super(dados);
    }

    paraPersistencia() {
        return {
            nome: this.nome,
            email: this.email
        };
    }
}
