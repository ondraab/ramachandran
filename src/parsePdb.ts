import {Residue} from './Residue';
import {Model} from "./Model";
import {Chain} from "./Chain";
import {Molecule} from "./Molecule";

export interface Dictionary {
    outliersType: string[];
}

export class ParsePDB {
    private _pdbID: string;
    private _chainsArray: string[];
    private _modelArray: number[];
    private _rsrz: {[id: number]: Dictionary; } = {};
    private _outlDict: {[id: number]: Dictionary; } = {};
    private _molecules: Molecule[];
    private _allowed: number;
    private _favored: number;
    private _clashes: number;
    private _sidechainOutl: number;
    private _ramaOutl: number;
    private _outliersList: Residue[];
    private _residueOnCanvas;
    private _moleculesDict: {[id: number]: Molecule;} = {};


    constructor(pdb: string) {
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

    get moleculesDict(): { [p: number]: Molecule } {
        return this._moleculesDict;
    }

    set moleculesDict(value: { [p: number]: Molecule }) {
        this._moleculesDict = value;
    }
    get residueOnCanvas() {
        return this._residueOnCanvas;
    }

    set residueOnCanvas(value) {
        this._residueOnCanvas = value;
    }

    get pdbID(): string {
        return this._pdbID;
    }

    set pdbID(value: string) {
        this._pdbID = value;
    }

    get molecules() {
        return this._molecules;
    }

    get outliersList(): Residue[] {
        return this._outliersList;
    }

    set outliersList(value: Residue[]) {
        this._outliersList = value;
    }
    get favored(): number {
        return this._favored;
    }

    set favored(value: number) {
        this._favored = value;
    }
    get allowed(): number {
        return this._allowed;
    }

    set allowed(value: number) {
        this._allowed = value;
    }

    get ramaOutl(): number {
        return this._ramaOutl;
    }

    set ramaOutl(value: number) {
        this._ramaOutl = value;
    }
    get sidechainOutl(): number {
        return this._sidechainOutl;
    }

    set sidechainOutl(value: number) {
        this._sidechainOutl = value;
    }
    get clashes(): number {
        return this._clashes;
    }

    set clashes(value: number) {
        this._clashes = value;
    }

    public downloadAndParse(link = 'https://www.ebi.ac.uk/pdbe/api/validation/rama_sidechain_listing/entry/') {
        const xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET',
             `${link}${this.pdbID}`, false);
        xmlHttp.send();
        if (xmlHttp.status !== 200) {
            return;
        } else {
            const molecules = JSON.parse(xmlHttp.responseText)[this._pdbID];
            this.parse(molecules);
            xmlHttp.open('GET',
                'https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/' + this._pdbID,
                false);
            xmlHttp.send();
            const mols = JSON.parse(xmlHttp.responseText)[this._pdbID];
            for (const mol of mols.molecules) {
                for (const chain of mol.chains) {
                    for (const mod of chain.models) {
                        for (const res of mod.residues) {
                            if (res.outlier_types[0] == 'RSRZ') {
                                this._rsrz[res.residue_number] = {outliersType: res.outlier_types};
                            } else {
                                if (res.outlier_types.indexOf('clashes') != -1)
                                    this._clashes++;
                                if (res.outlier_types.indexOf('ramachandran_outliers') != -1)
                                    this._ramaOutl++;
                                if (res.outlier_types.indexOf('sidechain_outliers') != -1)
                                    this._sidechainOutl++;
                                this._outlDict[res.residue_number] = {outliersType: res.outlier_types};
                            }

                        }
                    }

                }
            }
        }
    }

    public parse(molecules){
        let chainsDict: {[id: string]: Chain;} = {};
        let residuesDict: {[id: number]: Residue;} = {};
        let modelsDict: {[id: number]: Model;} = {};
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
                        const residue = new Residue(resid.residue_name, resid.phi,
                            resid.psi, resid.rama, resid.residue_number, resid.cis_peptide,
                            resid.author_residue_number, this._pdbID);
                        switch (resid.rama){
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
                    mod.residuesDict = residuesDict;
                    modelsDict[mod.model_id] = mod;
                    models.push(new Model(mod.model_id, residues))
                }
                models.sort((a: Model, b: Model) => {
                    if (a.modelId < b.modelId)
                        return -1;
                    if (a.modelId > b.modelId)
                        return 1;
                    return 0;
                });
                chain.modelsDict = modelsDict;
                chainsDict[chain.chain_id] = chain;
                chains.push(new Chain(chain.chain_id, models));
            }
            chains.sort((a: Chain, b: Chain) => {
                if (a.chainId < b.chainId)
                    return -1;
                if (a.chainId > b.chainId)
                    return 1;
                return 0;
            });
            mol.chainsDict = chainsDict;
            this.moleculesDict[mol.entity_id] = mol;
            this._molecules.push(new Molecule(mol.entity_id, chains, this._pdbID))
        }
        this._molecules.sort((a: Molecule, b: Molecule) => {
            if (a.entityId < b.entityId)
                return -1;
            if (a.entityId > b.entityId)
                return 1;
            return 0;
        });
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