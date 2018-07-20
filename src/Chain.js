"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Chain {
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
    constructor(chainId, models) {
        this._chainId = chainId;
        this._models = models;
    }
}
exports.Chain = Chain;
