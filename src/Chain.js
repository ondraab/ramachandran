"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Chain {
    constructor(chainId, models) {
        this._modelsDict = {};
        this._chainId = chainId;
        this._models = models;
    }
    get modelsDict() {
        return this._modelsDict;
    }
    set modelsDict(value) {
        this._modelsDict = value;
    }
    get chainId() {
        return this._chainId;
    }
    set chainId(value) {
        this._chainId = value;
    }
    get models() {
        return this._models;
    }
    set models(value) {
        this._models = value;
    }
}
exports.Chain = Chain;
