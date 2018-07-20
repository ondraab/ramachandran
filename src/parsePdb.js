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
        this.pdbID = pdb.toLowerCase();
        this._moleculs = [];
        this._chainsArray = [];
        this._modelArray = [];
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
                            residues.push(new Residue_1.Residue(resid.residue_name, resid.phi, resid.psi, resid.rama, resid.residue_number, resid.cis_peptide, resid.author_residue_number));
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
                        models.push(new Model_1.Model(mod.model_id, residues));
                    }
                    models.sort((a, b) => {
                        if (a.modelId < b.modelId)
                            return -1;
                        if (a.modelId > b.modelId)
                            return 1;
                        return 0;
                    });
                    chains.push(new Chain_1.Chain(chain.chain_id, models));
                }
                chains.sort((a, b) => {
                    if (a.chainId < b.chainId)
                        return -1;
                    if (a.chainId > b.chainId)
                        return 1;
                    return 0;
                });
                this._moleculs.push(new Molecule_1.Molecule(mol.entity_id, chains));
            }
            this._moleculs.sort((a, b) => {
                if (a.entityId < b.entityId)
                    return -1;
                if (a.entityId > b.entityId)
                    return 1;
                return 0;
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
    get rsrz() {
        return this._rsrz;
    }
    get outlDict() {
        return this._outlDict;
    }
}
exports.ParsePDB = ParsePDB;
exports.default = ParsePDB;
