"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Residue {
    get residueColor() {
        return this._residueColor;
    }
    set residueColor(value) {
        this._residueColor = value;
    }
    get pdbId() {
        return this._pdbId;
    }
    set pdbId(value) {
        this._pdbId = value;
    }
    get modelId() {
        return this._modelId;
    }
    set modelId(value) {
        this._modelId = value;
    }
    get chainId() {
        return this._chainId;
    }
    set chainId(value) {
        this._chainId = value;
    }
    set idSelector(value) {
        this._idSelector = value;
    }
    set prePro(value) {
        this._prePro = value;
    }
    set authorResNum(value) {
        this._authorResNum = value;
    }
    get aa() {
        return this._aa;
    }
    get phi() {
        return this._phi;
    }
    get psi() {
        return this._psi;
    }
    get rama() {
        return this._rama;
    }
    get num() {
        return this._num;
    }
    get cisPeptide() {
        return this._cisPeptide;
    }
    get idSelector() {
        return this._idSelector;
    }
    get prePro() {
        return this._prePro;
    }
    get authorResNum() {
        return this._authorResNum;
    }
    constructor(aa, phi, psi, rama, num, cisPeptide, authorResNum, pdbId) {
        this._aa = aa;
        if (phi)
            this._phi = Math.round(phi * 1e1) / 1e1;
        else
            this._phi = phi;
        if (psi)
            this._psi = Math.round(psi * 1e1) / 1e1;
        else
            this._psi = psi;
        this._rama = rama;
        this._num = num;
        this._cisPeptide = cisPeptide;
        this._authorResNum = authorResNum;
        this._pdbId = pdbId;
    }
}
exports.Residue = Residue;
