import {Residue} from "./Residue";
import {Chain} from "./Chain";

export class Model {
    get residuesDict(): { [p: string]: Residue } {
        return this._residuesDict;
    }

    set residuesDict(value: { [p: string]: Residue }) {
        this._residuesDict = value;
    }
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
    private _residuesDict: {[id: string]: Residue;};

    constructor(modelId: number, residues: Residue[]) {
        this._modelId = modelId;
        this._residues = residues;
    }
}