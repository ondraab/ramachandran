export class Residue {
    private _aa: string;
    private _phi: number;
    private _psi: number;
    private _rama: string;
    private _num: number;
    private _cisPeptide: string;
    private _idSelector: string;
    private _prePro: boolean;
    private _authorResNum: number;
    private _modelId: number;
    private _chainId: string;
    private _residueColor: string;


    get residueColor(): string {
        return this._residueColor;
    }

    set residueColor(value: string) {
        this._residueColor = value;
    }
    get modelId(): number {
        return this._modelId;
    }

    set modelId(value: number) {
        this._modelId = value;
    }

    get chainId(): string {
        return this._chainId;
    }

    set chainId(value: string) {
        this._chainId = value;
    }

    set idSelector(value: string) {
        this._idSelector = value;
    }

    set prePro(value: boolean) {
        this._prePro = value;
    }

    set authorResNum(value: number) {
        this._authorResNum = value;
    }

    get aa(): string {
        return this._aa;
    }

    get phi(): number {
        return this._phi;
    }

    get psi(): number {
        return this._psi;
    }

    get rama(): string {
        return this._rama;
    }

    get num(): number {
        return this._num;
    }

    get cisPeptide(): string {
        return this._cisPeptide;
    }

    get idSelector(): string {
        return this._idSelector;
    }

    get prePro(): boolean {
        return this._prePro;
    }

    get authorResNum(): number {
        return this._authorResNum;
    }

    constructor(aa: string, phi: number, psi: number, rama: string, num: number, cisPeptide: string, authorResNum: number) {
        this._aa = aa;
        this._phi = phi;
        this._psi = psi;
        this._rama = rama;
        this._num = num;
        this._cisPeptide = cisPeptide;
        this._authorResNum = authorResNum;
    }
}