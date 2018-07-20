import {Chain} from "./Chain";

export class Molecule {
    private _entityId: number;
    private _chains: Chain[];

    constructor(entityId: number, chains: Chain[]) {
        this._entityId = entityId;
        this._chains = chains;
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