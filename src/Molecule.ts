import {Chain} from "./Chain";

export class Molecule {
    get chainsDict(): { [p: string]: Chain } {
        return this._chainsDict;
    }

    set chainsDict(value: { [p: string]: Chain }) {
        this._chainsDict = value;
    }
    private _entityId: number;
    private _chains: Chain[];
    private _pdbId: string;
    private _chainsDict: {[id: string]: Chain} = {};

    constructor(entityId: number, chains: Chain[], pdbId: string) {
        this._entityId = entityId;
        this._chains = chains;
        this._pdbId = pdbId;
    }

    get pdbId(): string {
        return this._pdbId;
    }

    set pdbId(value: string) {
        this._pdbId = value;
    }

    get entityId(): number {
        return this._entityId;
    }

    set entityId(value: number) {
        this._entityId = value;
    }

    get chains(): Chain[] {
        return this._chains;
    }

    set chains(value: Chain[]) {
        this._chains = value;
    }
}