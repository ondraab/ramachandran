import {Model} from "./Model";

export class Chain {
    get modelsDict(): { [p: string]: Model } {
        return this._modelsDict;
    }

    set modelsDict(value: { [p: string]: Model }) {
        this._modelsDict = value;
    }
    private _chainId: string;
    private _models: Model[];
    private _modelsDict: {[id: string]: Model} = {};

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