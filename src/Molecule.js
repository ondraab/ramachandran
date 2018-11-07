"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Molecule {
    constructor(entityId, chains, pdbId) {
        this._chainsDict = {};
        this._entityId = entityId;
        this._chains = chains;
        this._pdbId = pdbId;
    }
    get chainsDict() {
        return this._chainsDict;
    }
    set chainsDict(value) {
        this._chainsDict = value;
    }
    get pdbId() {
        return this._pdbId;
    }
    set pdbId(value) {
        this._pdbId = value;
    }
    get entityId() {
        return this._entityId;
    }
    set entityId(value) {
        this._entityId = value;
    }
    get chains() {
        return this._chains;
    }
    set chains(value) {
        this._chains = value;
    }
}
exports.Molecule = Molecule;
