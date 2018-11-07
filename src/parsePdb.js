"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Residue_1 = require("./Residue");
const Model_1 = require("./Model");
const Chain_1 = require("./Chain");
const Molecule_1 = require("./Molecule");
class ParsePDB {
    constructor(pdb) {
        this._rsrz = {};
        this._outlDict = {};
        this._moleculesDict = {};
        this._pdbID = pdb.toLowerCase();
        this._molecules = [];
        this._chainsArray = [];
        this._modelArray = [];
        this._allowed = 0;
        this._favored = 0;
        this._ramaOutl = 0;
        this._sidechainOutl = 0;
        this._clashes = 0;
        this._outliersList = [];
        this._residueOnCanvas = 0;
    }
    get moleculesDict() {
        return this._moleculesDict;
    }
    set moleculesDict(value) {
        this._moleculesDict = value;
    }
    get residueOnCanvas() {
        return this._residueOnCanvas;
    }
    set residueOnCanvas(value) {
        this._residueOnCanvas = value;
    }
    get pdbID() {
        return this._pdbID;
    }
    set pdbID(value) {
        this._pdbID = value;
    }
    get molecules() {
        return this._molecules;
    }
    get outliersList() {
        return this._outliersList;
    }
    set outliersList(value) {
        this._outliersList = value;
    }
    get favored() {
        return this._favored;
    }
    set favored(value) {
        this._favored = value;
    }
    get allowed() {
        return this._allowed;
    }
    set allowed(value) {
        this._allowed = value;
    }
    get ramaOutl() {
        return this._ramaOutl;
    }
    set ramaOutl(value) {
        this._ramaOutl = value;
    }
    get sidechainOutl() {
        return this._sidechainOutl;
    }
    set sidechainOutl(value) {
        this._sidechainOutl = value;
    }
    get clashes() {
        return this._clashes;
    }
    set clashes(value) {
        this._clashes = value;
    }
    downloadAndParse(link = 'https://www.ebi.ac.uk/pdbe/api/validation/rama_sidechain_listing/entry/') {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', `${link}${this.pdbID}`, false);
        xmlHttp.send();
        if (xmlHttp.status !== 200) {
            return;
        }
        else {
            const molecules = JSON.parse(xmlHttp.responseText)[this._pdbID];
            this.parse(molecules);
            xmlHttp.open('GET', 'https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/' + this._pdbID, false);
            xmlHttp.send();
            const mols = JSON.parse(xmlHttp.responseText)[this._pdbID];
            for (const mol of mols.molecules) {
                for (const chain of mol.chains) {
                    for (const mod of chain.models) {
                        for (const res of mod.residues) {
                            if (res.outlier_types[0] == 'RSRZ') {
                                this._rsrz[res.residue_number] = { outliersType: res.outlier_types };
                            }
                            else {
                                if (res.outlier_types.indexOf('clashes') != -1)
                                    this._clashes++;
                                if (res.outlier_types.indexOf('ramachandran_outliers') != -1)
                                    this._ramaOutl++;
                                if (res.outlier_types.indexOf('sidechain_outliers') != -1)
                                    this._sidechainOutl++;
                                this._outlDict[res.residue_number] = { outliersType: res.outlier_types };
                            }
                        }
                    }
                }
            }
        }
    }
    parse(molecules) {
        let chainsDict = {};
        let residuesDict = {};
        let modelsDict = {};
        for (const mol of molecules.molecules) {
            let chains = [];
            for (const chain of mol.chains) {
                let models = [];
                for (const mod of chain.models) {
                    if (this.chainsArray.indexOf(chain.chain_id) === -1) {
                        this.chainsArray.push(chain.chain_id);
                    }
                    if (this.modelArray.indexOf(mod.model_id) === -1) {
                        this._modelArray.push(mod.model_id);
                    }
                    let residues = [];
                    for (const resid of mod.residues) {
                        const residue = new Residue_1.Residue(resid.residue_name, resid.phi, resid.psi, resid.rama, resid.residue_number, resid.cis_peptide, resid.author_residue_number, this._pdbID);
                        switch (resid.rama) {
                            case 'OUTLIER':
                                this.outliersList.push(residue);
                                break;
                            case 'Favored':
                                this.favored++;
                                break;
                            case 'Allowed':
                                this.allowed++;
                                break;
                            default:
                                break;
                        }
                        residue.idSelector = `${residue.aa}-${residue.chainId}-${residue.modelId}-${residue.authorResNum}-${residue.pdbId}`;
                        residuesDict[residue.authorResNum] = residue;
                        residues.push(residue);
                    }
                    residues.sort((a, b) => {
                        if (a.num < b.num)
                            return -1;
                        if (a.num > b.num)
                            return 1;
                        return 0;
                    });
                    residues.forEach((value, index) => {
                        if (index + 1 != residues.length && residues[index + 1].aa == 'PRO') {
                            value.prePro = true;
                        }
                    });
                    mod.residuesDict = residuesDict;
                    modelsDict[mod.model_id] = mod;
                    models.push(new Model_1.Model(mod.model_id, residues));
                }
                models.sort((a, b) => {
                    if (a.modelId < b.modelId)
                        return -1;
                    if (a.modelId > b.modelId)
                        return 1;
                    return 0;
                });
                chain.modelsDict = modelsDict;
                chainsDict[chain.chain_id] = chain;
                chains.push(new Chain_1.Chain(chain.chain_id, models));
            }
            chains.sort((a, b) => {
                if (a.chainId < b.chainId)
                    return -1;
                if (a.chainId > b.chainId)
                    return 1;
                return 0;
            });
            mol.chainsDict = chainsDict;
            this.moleculesDict[mol.entity_id] = mol;
            this._molecules.push(new Molecule_1.Molecule(mol.entity_id, chains, this._pdbID));
        }
        this._molecules.sort((a, b) => {
            if (a.entityId < b.entityId)
                return -1;
            if (a.entityId > b.entityId)
                return 1;
            return 0;
        });
    }
    get chainsArray() {
        return this._chainsArray;
    }
    get modelArray() {
        return this._modelArray;
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
