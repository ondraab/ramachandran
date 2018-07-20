import {Model} from "./Model";

export class Chain {
    private _chainId: string;
    private _models: Model[];


    get chainId(): string {
        return this._chainId;
    }

    set chainId(value: string) {
        this._chainId = value;
    }

    get models(): Model[] {
        return this._models;
    }

    set models(value: Model[]) {
        this._models = value;
    }

    constructor(chainId: string, models: Model[]) {
        this._chainId = chainId;
        this._models = models;
    }
}