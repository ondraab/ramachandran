interface Dictionary {
    outliersType: string[];
}

class Res {
    private aa: string;
    private phi: number;
    private psi: number;
    private rama: string;
    private chain: string;
    private num: number;
    private cisPeptide: string;
    private modelId: number;
    private spProp: boolean;
    private idSelector: string;
    private prePro: boolean;

    constructor(aa: string, phi: number, psi: number, rama: string, chain: string, num: number, cisPeptide: string,
                modelId: number) {
        this.aa = aa;
        this.phi = phi;
        this.psi = psi;
        this.rama = rama;
        this.chain = chain;
        this.num = num;
        this.cisPeptide = cisPeptide;
        this.modelId = modelId;
        this.spProp = false;
        this.idSelector = '';
        this.prePro = false;
    }
}

export class ParsePDB {
    private pdbID: string;
    private _chainsArray: string[];
    private _modelArray: number[];
    private _residueArray: object[];
    private _rsrz: {[id: number]: Dictionary; } = {};
    private _outlDict: {[id: number]: Dictionary; } = {};

    constructor(pdb: string) {
        this.pdbID = pdb.toLowerCase();
        this._chainsArray = [];
        this._modelArray = [];
        this._residueArray = [];
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
                for (const chain of mol.chains) {
                    for (const mod of chain.models) {
                        if (this.chainsArray.indexOf(chain.chain_id) === -1) {
                            this.chainsArray.push(chain.chain_id);
                        }
                        if (this.modelArray.indexOf(mod.model_id) === -1) {
                            this._modelArray.push(mod.model_id);
                        }
                        for (const resid of mod.residues) {
                            this._residueArray.push(new Res(resid.residue_name,
                                resid.phi,
                                resid.psi,
                                resid.rama,
                                chain.chain_id,
                                resid.residue_number,
                                resid.cis_peptide,
                                mod.model_id
                            ));
                        }
                    }
                }
            }
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

    get residueArray(): object[] {
        return this._residueArray;
    }
    get rsrz(): { [p: number]: Dictionary } {
        return this._rsrz;
    }

    get outlDict(): { [p: number]: Dictionary } {
        return this._outlDict;
    }

}
export default ParsePDB;