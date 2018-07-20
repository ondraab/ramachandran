import {Residue} from './Residue';
import {Model} from "./Model";
import {Chain} from "./Chain";
import {Molecule} from "./Molecule";

interface Dictionary {
    outliersType: string[];
}

export class ParsePDB {

    private pdbID: string;
    private _chainsArray: string[];
    private _modelArray: number[];
    private _rsrz: {[id: number]: Dictionary; } = {};
    private _outlDict: {[id: number]: Dictionary; } = {};
    private _moleculs;

    constructor(pdb: string) {
        this.pdbID = pdb.toLowerCase();
        this._moleculs = [];
        this._chainsArray = [];
        this._modelArray = [];
    }

    get moleculs() {
        return this._moleculs;
    }

    public downloadAndParse() {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET',
            'https://www.ebi.ac.uk/pdbe/api/validation/rama_sidechain_listing/entry/' + this.pdbID, false);
        xmlHttp.send();
        if (xmlHttp.status !== 200) {
            return;
        } else {
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
                            residues.push(new Residue(resid.residue_name, resid.phi,
                                resid.psi, resid.rama, resid.residue_number, resid.cis_peptide, resid.author_residue_number));
                        }
                        residues.sort((a: Residue, b: Residue) => {
                            if (a.num < b.num)
                                return -1;
                            if (a.num > b.num)
                                return 1;
                            return 0;
                        });
                        residues.forEach((value: Residue, index: number) => {
                            if (index + 1 != residues.length && residues[index + 1].aa == 'PRO') {
                                value.prePro = true;
                            }
                        });
                        models.push(new Model(mod.model_id, residues))
                    }
                    models.sort((a: Model, b: Model) => {
                       if (a.modelId < b.modelId)
                           return -1;
                       if (a.modelId > b.modelId)
                           return 1;
                       return 0;
                    });
                    chains.push(new Chain(chain.chain_id, models));
                }
                chains.sort((a: Chain, b: Chain) => {
                    if (a.chainId < b.chainId)
                        return -1;
                    if (a.chainId > b.chainId)
                        return 1;
                    return 0;
                });
                this._moleculs.push(new Molecule(mol.entity_id, chains))
            }
            this._moleculs.sort((a: Molecule, b: Molecule) => {
                if (a.entityId < b.entityId)
                    return -1;
                if (a.entityId > b.entityId)
                    return 1;
                return 0;
            });
            xmlHttp.open('GET',
                'https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/' + this.pdbID,
                false);
            xmlHttp.send();
            const mols = JSON.parse(xmlHttp.responseText)[this.pdbID];
            for (const mol of mols.molecules) {
                for (const chain of mol.chains) {
                    for (const mod of chain.models) {
                        for (const res of mod.residues) {
                            if (res.outlier_types[0] === 'RSRZ') {
                                this._rsrz[res.residue_number] = {outliersType: res.outlier_types};
                            } else {
                                this._outlDict[res.residue_number] = {outliersType: res.outlier_types};
                            }

                        }
                    }

                }
            }
        }
    }
    get chainsArray(): string[] {
        return this._chainsArray;
    }

    get modelArray(): number[] {
        return this._modelArray;
    }

    get rsrz(): { [p: number]: Dictionary } {
        return this._rsrz;
    }

    get outlDict(): { [p: number]: Dictionary } {
        return this._outlDict;
    }

}
export default ParsePDB;