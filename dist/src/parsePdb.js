"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var Residue_1 = require("./Residue");
var Model_1 = require("./Model");
var Chain_1 = require("./Chain");
var Molecule_1 = require("./Molecule");

var ParsePDB = function () {
    function ParsePDB(pdb) {
        _classCallCheck(this, ParsePDB);

        this._rsrz = {};
        this._outlDict = {};
        this.pdbID = pdb.toLowerCase();
        this._moleculs = [];
        this._chainsArray = [];
        this._modelArray = [];
    }

    _createClass(ParsePDB, [{
        key: "downloadAndParse",
        value: function downloadAndParse() {
            var _this = this;

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open('GET', 'https://www.ebi.ac.uk/pdbe/api/validation/rama_sidechain_listing/entry/' + this.pdbID, false);
            xmlHttp.send();
            if (xmlHttp.status !== 200) {
                return;
            } else {
                var molecules = JSON.parse(xmlHttp.responseText)[this.pdbID];
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = molecules.molecules[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var mol = _step.value;

                        var chains = [];
                        var _iteratorNormalCompletion3 = true;
                        var _didIteratorError3 = false;
                        var _iteratorError3 = undefined;

                        try {
                            for (var _iterator3 = mol.chains[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                                var chain = _step3.value;

                                var models = [];

                                var _loop = function _loop(mod) {
                                    if (_this.chainsArray.indexOf(chain.chain_id) === -1) {
                                        _this.chainsArray.push(chain.chain_id);
                                    }
                                    if (_this.modelArray.indexOf(mod.model_id) === -1) {
                                        _this._modelArray.push(mod.model_id);
                                    }
                                    var residues = [];
                                    var _iteratorNormalCompletion5 = true;
                                    var _didIteratorError5 = false;
                                    var _iteratorError5 = undefined;

                                    try {
                                        for (var _iterator5 = mod.residues[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                            var resid = _step5.value;

                                            residues.push(new Residue_1.Residue(resid.residue_name, resid.phi, resid.psi, resid.rama, resid.residue_number, resid.cis_peptide, resid.author_residue_number));
                                        }
                                    } catch (err) {
                                        _didIteratorError5 = true;
                                        _iteratorError5 = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                                _iterator5.return();
                                            }
                                        } finally {
                                            if (_didIteratorError5) {
                                                throw _iteratorError5;
                                            }
                                        }
                                    }

                                    residues.sort(function (a, b) {
                                        if (a.num < b.num) return -1;
                                        if (a.num > b.num) return 1;
                                        return 0;
                                    });
                                    residues.forEach(function (value, index) {
                                        if (index + 1 != residues.length && residues[index + 1].aa == 'PRO') {
                                            value.prePro = true;
                                        }
                                    });
                                    models.push(new Model_1.Model(mod.model_id, residues));
                                };

                                var _iteratorNormalCompletion4 = true;
                                var _didIteratorError4 = false;
                                var _iteratorError4 = undefined;

                                try {
                                    for (var _iterator4 = chain.models[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                        var mod = _step4.value;

                                        _loop(mod);
                                    }
                                } catch (err) {
                                    _didIteratorError4 = true;
                                    _iteratorError4 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                            _iterator4.return();
                                        }
                                    } finally {
                                        if (_didIteratorError4) {
                                            throw _iteratorError4;
                                        }
                                    }
                                }

                                models.sort(function (a, b) {
                                    if (a.modelId < b.modelId) return -1;
                                    if (a.modelId > b.modelId) return 1;
                                    return 0;
                                });
                                chains.push(new Chain_1.Chain(chain.chain_id, models));
                            }
                        } catch (err) {
                            _didIteratorError3 = true;
                            _iteratorError3 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                    _iterator3.return();
                                }
                            } finally {
                                if (_didIteratorError3) {
                                    throw _iteratorError3;
                                }
                            }
                        }

                        chains.sort(function (a, b) {
                            if (a.chainId < b.chainId) return -1;
                            if (a.chainId > b.chainId) return 1;
                            return 0;
                        });
                        this._moleculs.push(new Molecule_1.Molecule(mol.entity_id, chains));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                this._moleculs.sort(function (a, b) {
                    if (a.entityId < b.entityId) return -1;
                    if (a.entityId > b.entityId) return 1;
                    return 0;
                });
                xmlHttp.open('GET', 'https://www.ebi.ac.uk/pdbe/api/validation/residuewise_outlier_summary/entry/' + this.pdbID, false);
                xmlHttp.send();
                var mols = JSON.parse(xmlHttp.responseText)[this.pdbID];
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = mols.molecules[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var _mol = _step2.value;
                        var _iteratorNormalCompletion6 = true;
                        var _didIteratorError6 = false;
                        var _iteratorError6 = undefined;

                        try {
                            for (var _iterator6 = _mol.chains[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                                var _chain = _step6.value;
                                var _iteratorNormalCompletion7 = true;
                                var _didIteratorError7 = false;
                                var _iteratorError7 = undefined;

                                try {
                                    for (var _iterator7 = _chain.models[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                                        var _mod = _step7.value;
                                        var _iteratorNormalCompletion8 = true;
                                        var _didIteratorError8 = false;
                                        var _iteratorError8 = undefined;

                                        try {
                                            for (var _iterator8 = _mod.residues[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                                                var res = _step8.value;

                                                if (res.outlier_types[0] === 'RSRZ') {
                                                    this._rsrz[res.residue_number] = { outliersType: res.outlier_types };
                                                } else {
                                                    this._outlDict[res.residue_number] = { outliersType: res.outlier_types };
                                                }
                                            }
                                        } catch (err) {
                                            _didIteratorError8 = true;
                                            _iteratorError8 = err;
                                        } finally {
                                            try {
                                                if (!_iteratorNormalCompletion8 && _iterator8.return) {
                                                    _iterator8.return();
                                                }
                                            } finally {
                                                if (_didIteratorError8) {
                                                    throw _iteratorError8;
                                                }
                                            }
                                        }
                                    }
                                } catch (err) {
                                    _didIteratorError7 = true;
                                    _iteratorError7 = err;
                                } finally {
                                    try {
                                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                                            _iterator7.return();
                                        }
                                    } finally {
                                        if (_didIteratorError7) {
                                            throw _iteratorError7;
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            _didIteratorError6 = true;
                            _iteratorError6 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion6 && _iterator6.return) {
                                    _iterator6.return();
                                }
                            } finally {
                                if (_didIteratorError6) {
                                    throw _iteratorError6;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }
            }
        }
    }, {
        key: "moleculs",
        get: function get() {
            return this._moleculs;
        }
    }, {
        key: "chainsArray",
        get: function get() {
            return this._chainsArray;
        }
    }, {
        key: "modelArray",
        get: function get() {
            return this._modelArray;
        }
    }, {
        key: "rsrz",
        get: function get() {
            return this._rsrz;
        }
    }, {
        key: "outlDict",
        get: function get() {
            return this._outlDict;
        }
    }]);

    return ParsePDB;
}();

exports.ParsePDB = ParsePDB;
exports.default = ParsePDB;
//# sourceMappingURL=parsePdb.js.map