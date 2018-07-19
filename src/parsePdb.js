"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Res {
    get residueColor() {
        return this._residueColor;
    }
    set residueColor(value) {
        this._residueColor = value;
    }
    get prePro() {
        return this._prePro;
    }
    get num() {
        return this._num;
    }
    set num(value) {
        this._num = value;
    }
    get aa() {
        return this._aa;
    }
    set aa(value) {
        this._aa = value;
    }
    set prePro(value) {
        this._prePro = value;
    }
    constructor(aa, phi, psi, rama, chain, num, cisPeptide, modelId, authorResNum) {
        this._aa = aa;
        this.phi = phi;
        this.psi = psi;
        this.rama = rama;
        this.chain = chain;
        this._num = num;
        this.cisPeptide = cisPeptide;
        this.modelId = modelId;
        this._residueColor = '';
        this.idSelector = '';
        this._prePro = false;
        this.authorResNum = authorResNum;
    }
}
class ParsePDB {
    constructor(pdb) {
        this._rsrz = {};
        this._outlDict = {};
        this.pdbID = pdb.toLowerCase();
        this._moleculs = [];
        this._chainsArray = [];
        this._modelArray = [];
        this._residueArray = [];
    }
    get moleculs() {
        return this._moleculs;
    }
    downloadAndParse() {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', 'https://www.ebi.ac.uk/pdbe/api/validation/rama_sidechain_listing/entry/' + this.pdbID, false);
        xmlHttp.send();
        if (xmlHttp.status !== 200) {
            return;
        }
        else {
            const molecules = JSON.parse(xmlHttp.responseText)[this.pdbID];
            for (const mol of molecules.molecules) {
                for (const chain of mol.chains) {
                    for (const mod of chain.models) {
                        if (this.chainsArray.indexOf(chain.chain_id) === -1) {
                            this.chainsArray.push(chain.chain_id);
                        }
                        if (this.modelArray.indexOf(mod.model_id) === -1) {
                            this._modelArray.push(mod.model_id);
                        }
                        for (const resid of mod.residues) {
                            this._residueArray.push(new Res(resid.residue_name, resid.phi, resid.psi, resid.rama, chain.chain_id, resid.residue_number, resid.cis_peptide, mod.model_id, resid.author_residue_number));
                        }
                    }
                }
            }
            this.residueArray.sort((a, b) => {
                if (a.num < b.num)
                    return -1;
                if (a.num > b.num)
                    return 1;
                return 0;
            });
            this.residueArray.forEach((value, index) => {
                if (index + 1 != this.residueArray.length) {
                    if (this.residueArray[index + 1].num - value.num == 1) {
                        if (this.residueArray[index + 1].aa == 'PRO') {
                            value.prePro = true;
                        }
                    }
                }
            });
            xmlHttp.open('GET', 'https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/' + this.pdbID, false);
            xmlHttp.send();
            const mols = JSON.parse(xmlHttp.responseText)[this.pdbID];
            for (const mol of mols.molecules) {
                for (const chain of mol.chains) {
                    for (const mod of chain.models) {
                        for (const res of mod.residues) {
                            if (res.outlier_types[0] === 'RSRZ') {
                                this._rsrz[res.residue_number] = { outliersType: res.outlier_types };
                            }
                            else {
                                this._outlDict[res.residue_number] = { outliersType: res.outlier_types };
                            }
                        }
                    }
                }
            }
        }
    }
    get chainsArray() {
        return this._chainsArray;
    }
    get modelArray() {
        return this._modelArray;
    }
    get residueArray() {
        return this._residueArray;
    }
    get rsrz() {
        return this._rsrz;
    }
    get outlDict() {
        return this._outlDict;
    }
}
exports.ParsePDB = ParsePDB;
exports.default = ParsePDB;
