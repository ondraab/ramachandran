import {Residue} from "./Residue";

export class Model {
    get modelId(): number {
        return this._modelId;
    }

    set modelId(value: number) {
        this._modelId = value;
    }

    get residues(): Residue[] {
        return this._residues;
    }

    set residues(value: Residue[]) {
        this._residues = value;
    }
    private _modelId: number;
    private _residues: Residue[];


    constructor(modelId: number, residues: Residue[]) {
        this._modelId = modelId;
        this._residues = residues;
    }
}