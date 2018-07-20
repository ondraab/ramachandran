"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Model {
    get modelId() {
        return this._modelId;
    }
    set modelId(value) {
        this._modelId = value;
    }
    get residues() {
        return this._residues;
    }
    set residues(value) {
        this._residues = value;
    }
    constructor(modelId, residues) {
        this._modelId = modelId;
        this._residues = residues;
    }
}
exports.Model = Model;
