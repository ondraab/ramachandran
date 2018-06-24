"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Res = function () {
    function Res(aa, phi, psi, rama, chain, num, cisPeptide, modelId) {
        this.aa = aa;
        this.phi = phi;
        this.psi = psi;
        this.rama = rama;
        this.chain = chain;
        this.num = num;
        this.cisPeptide = cisPeptide;
        this.modelId = modelId;
        this.spProp = false;
        this.idSlector = '';
    }
    return Res;
}();
var ParsePDB = function () {
    function ParsePDB(pdb) {
        this._rsrz = {};
        this._outlDict = {};
        this.pdbID = pdb.toLowerCase();
        this._chainsArray = [];
        this._modelArray = [];
        this._residueArray = [];
    }
    ParsePDB.prototype.downloadAndParse = function () {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open('GET', 'http://www.ebi.ac.uk/pdbe/api/validation/rama_sidechain_listing/entry/' + this.pdbID, false);
        xmlHttp.send();
        if (xmlHttp.status !== 200) {
            return;
        } else {
            var molecules = JSON.parse(xmlHttp.responseText)[this.pdbID];
            for (var _i = 0, _a = molecules.molecules; _i < _a.length; _i++) {
                var mol = _a[_i];
                for (var _b = 0, _c = mol.chains; _b < _c.length; _b++) {
                    var chain = _c[_b];
                    for (var _d = 0, _e = chain.models; _d < _e.length; _d++) {
                        var mod = _e[_d];
                        if (this.chainsArray.indexOf(chain.chain_id) === -1) {
                            this.chainsArray.push(chain.chain_id);
                        }
                        if (this.modelArray.indexOf(mod.model_id) === -1) {
                            this._modelArray.push(mod.model_id);
                        }
                        for (var _f = 0, _g = mod.residues; _f < _g.length; _f++) {
                            var resid = _g[_f];
                            this._residueArray.push(new Res(resid.residue_name, resid.phi, resid.psi, resid.rama, chain.chain_id, resid.residue_number, resid.cis_peptide, mod.model_id));
                        }
                    }
                }
            }
            xmlHttp.open('GET', 'https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/' + this.pdbID, false);
            xmlHttp.send();
            var mols = JSON.parse(xmlHttp.responseText)[this.pdbID];
            for (var _h = 0, _j = mols.molecules; _h < _j.length; _h++) {
                var mol = _j[_h];
                for (var _k = 0, _l = mol.chains; _k < _l.length; _k++) {
                    var chain = _l[_k];
                    for (var _m = 0, _o = chain.models; _m < _o.length; _m++) {
                        var mod = _o[_m];
                        for (var _p = 0, _q = mod.residues; _p < _q.length; _p++) {
                            var res = _q[_p];
                            if (res.outlier_types[0] === 'RSRZ') {
                                this._rsrz[res.residue_number] = { outliersType: res.outlier_types };
                            } else {
                                this._outlDict[res.residue_number] = { outliersType: res.outlier_types };
                            }
                        }
                    }
                }
            }
        }
    };
    Object.defineProperty(ParsePDB.prototype, "chainsArray", {
        get: function get() {
            return this._chainsArray;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParsePDB.prototype, "modelArray", {
        get: function get() {
            return this._modelArray;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParsePDB.prototype, "residueArray", {
        get: function get() {
            return this._residueArray;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParsePDB.prototype, "rsrz", {
        get: function get() {
            return this._rsrz;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ParsePDB.prototype, "outlDict", {
        get: function get() {
            return this._outlDict;
        },
        enumerable: true,
        configurable: true
    });
    return ParsePDB;
}();
exports.ParsePDB = ParsePDB;
exports.default = ParsePDB;
//# sourceMappingURL=parsePdb.ts.js.map