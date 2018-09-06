"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("d3");
var polymer_element_js_1 = require("@polymer/polymer/polymer-element.js");
var HeatMapContours_1 = require("../contours/HeatMapContours");
var LineContours_1 = require("../contours/LineContours");
require("bootstrap/dist/css/bootstrap.css");
require("../public/index.css");
var parsePdb_1 = require("./parsePdb");

var RamachandranComponent = function (_polymer_element_js_) {
    _inherits(RamachandranComponent, _polymer_element_js_);

    function RamachandranComponent() {
        _classCallCheck(this, RamachandranComponent);

        return _possibleConstructorReturn(this, (RamachandranComponent.__proto__ || Object.getPrototypeOf(RamachandranComponent)).apply(this, arguments));
    }

    _createClass(RamachandranComponent, [{
        key: "connectedCallback",
        value: function connectedCallback() {
            var _this2 = this;

            _get(RamachandranComponent.prototype.__proto__ || Object.getPrototypeOf(RamachandranComponent.prototype), "connectedCallback", this).call(this);
            // noinspection JSSuspiciousNameCombination
            RamachandranComponent.height = this.width;
            RamachandranComponent.width = this.width;
            this.createChart = this.createChart.bind(this);
            this.fillColorFunction = this.fillColorFunction.bind(this);
            RamachandranComponent.parsedPdb = [];
            this.pdbIds.forEach(function (pdbId) {
                var pdb = new parsePdb_1.default(pdbId);
                pdb.downloadAndParse();
                RamachandranComponent.parsedPdb.push(pdb);
                RamachandranComponent.rsrz[pdbId] = pdb.rsrz;
                RamachandranComponent.outliersType[pdbId] = pdb.outlDict;
                RamachandranComponent.outliersList[pdbId] = [];
                RamachandranComponent.residuesOnCanvas[pdbId] = [];
                if (pdbId == '3us0') {
                    _this2.pdbIds.push('3us0_redo');
                    var pdbRedo = new parsePdb_1.default(pdbId + "_redo");
                    var json = require('./3us0.json');
                    pdbRedo.parse(json[pdbId + "_redo"]);
                    RamachandranComponent.parsedPdb.push(pdbRedo);
                    RamachandranComponent.rsrz[pdbId + "_redo"] = pdb.rsrz;
                    RamachandranComponent.outliersType[pdbId + "_redo"] = pdb.outlDict;
                    RamachandranComponent.outliersList[pdbId + "_redo"] = [];
                    RamachandranComponent.residuesOnCanvas[pdbId + "_redo"] = [];
                }
            });
            RamachandranComponent.hiddenResidues = [];
            RamachandranComponent.selectedResidues = [];
            this.ramaContourPlotType = 1;
            RamachandranComponent.contourColoringStyle = 1;
            this.residueColorStyle = 1;
            this.modelsToShowNumbers = [];
            this.modelsToShow.map(function (d) {
                _this2.modelsToShowNumbers.push(parseInt(d));
            });
            var objSize = 40;
            if (window.screen.availWidth < 1920) {
                objSize = 30;
            }
            if (window.screen.width < 350) {
                objSize = 5;
            }
            // symbolTypes
            RamachandranComponent.symbolTypes = {
                circle: d3.symbol().type(d3.symbolCircle).size(objSize),
                triangle: d3.symbol().type(d3.symbolTriangle).size(objSize)
            };
            RamachandranComponent.timeoutId = 0;
            RamachandranComponent.currentTime = 0;
            RamachandranComponent.lastTimeChanged = 0;
            RamachandranComponent.highlightedResidues = [];
            this.createChart();
            this.lastSelection = {};
            RamachandranComponent.tooltipHeight = 58;
            RamachandranComponent.tooltipWidth = 90;
        }
    }, {
        key: "_pdbIdsChanged",
        value: function _pdbIdsChanged(newValue, oldValue) {
            if (typeof oldValue == 'undefined' || newValue.length == 0) return;
            this.pdbIds.forEach(function (pdbId) {
                var pdb = new parsePdb_1.default(pdbId);
                pdb.downloadAndParse();
            });
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);
            // d3.select('#rama-info-pdbid').text(this.pdbId.toUpperCase());
        }
    }, {
        key: "_chainsChanged",
        value: function _chainsChanged(newValue, oldValue) {
            if (typeof oldValue == 'undefined') return;
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);
            d3.select('#rama-info-chains').text(this.chainsToShow);
        }
    }, {
        key: "_modelsChanged",
        value: function _modelsChanged(newValue, oldValue) {
            if (typeof oldValue == 'undefined') return;
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);
            d3.select('#rama-info-models').text(this.modelsToShow);
        }
        /**
         * creates basic chart, add axes, creates tooltip
         */

    }, {
        key: "createChart",
        value: function createChart() {
            var _this3 = this;

            var width = RamachandranComponent.width,
                height = RamachandranComponent.height;
            if (typeof width == 'undefined') {
                RamachandranComponent.width = 500;
                width = 500;
            }
            if (typeof height == 'undefined') {
                RamachandranComponent.height = 500;
                height = 500;
            }
            // setup x
            var xScale = d3.scaleLinear().domain([-180, 180]).range([0, width]);
            var xBottomAxis = d3.axisBottom(xScale);
            var xTopAxis = d3.axisTop(xScale);
            var xValue = function xValue(d) {
                return d['phi'];
            };
            this.xMap = function (d) {
                return xScale(xValue(d));
            };
            // tooltip
            this.tooltip = d3.select('body').append('div').attr('class', 'rama-tooltip').attr('height', 0).style('opacity', 0);
            this.tooltip2 = d3.select('body').append('div').attr('class', 'rama-tooltip').attr('height', 0).style('opacity', 0);
            // setup y
            var yScale = d3.scaleLinear().domain([180, -180]).range([0, height]);
            var yLeftAxis = d3.axisLeft(yScale);
            var yRightAxis = d3.axisRight(yScale);
            var yValue = function yValue(d) {
                return d['psi'];
            };
            this.yMap = function (d) {
                return yScale(yValue(d));
            };
            function makeYGridlines() {
                return d3.axisRight(yScale);
            }
            function makeXGridlines() {
                return d3.axisTop(xScale);
            }
            //
            this.svgContainer = d3.select('ramachandran-component').append('div').attr('id', 'rama-svg-container').style('max-width', width + "px").style('width', '100%').append('svg').classed('svg-container', true).attr('id', 'rama-svg').style('max-width', width + "px").style('width', '100%').style('padding', '30px 30px 30px 50px').attr('preserveAspectRatio', 'xMinYMin meet').attr('viewBox', "0 0 " + width + " " + height).classed('svg-content-responsive', true).style('overflow', 'visible');
            this.svgContainer.append("svg:defs").append("svg:marker").attr("id", "arrow").attr("viewBox", "0 -5 10 10").attr('refX', 8).attr("markerWidth", 5).attr("markerHeight", 5).attr("orient", "auto").style('fill', '#aa5519').append("svg:path").attr("d", "M0,-5L10,0L0,5");
            RamachandranComponent.canvasContainer = d3.select('#rama-svg-container').append('canvas').classed('img-responsive', true).attr('id', 'rama-canvas').attr('width', width).style('max-width', width - 90 + "px").attr('height', height).classed('svg-content-responsive', true).attr('preserveAspectRatio', 'xMinYMin meet').attr('viewBox', "0 0 " + width + " " + height).style('overflow', 'visible');
            // // add axes
            this.svgContainer.append('g').call(xTopAxis).attr('id', 'x-axis');
            this.svgContainer.append('g').attr('transform', "translate(0, " + height + ")").call(xBottomAxis).attr('id', 'x-axis');
            this.svgContainer.append('g').call(yLeftAxis).attr('id', 'y-axis');
            this.svgContainer.append('g').attr('transform', function () {
                return "translate(" + width + ", 0)";
            }).call(yRightAxis).attr('id', 'y-axis');
            this.svgContainer.append('g').attr('class', 'rama-grid').attr('transform', "translate(0, " + height + ")").call(makeXGridlines().tickSize(width));
            this.svgContainer.append('g').attr('class', 'rama-grid').call(makeYGridlines().tickSize(height));
            // axis labels
            // phi label
            this.svgContainer.append('text').attr('x', width / 2).attr('y', height + 35).style('text-anchor', 'middle').style('fill', '#000').text("\u03A6");
            // psi label
            this.svgContainer.append('text').attr('x', 0 - height / 2).attr('y', -35).style('text-anchor', 'middle').style('fill', '#000').attr('transform', 'rotate(-90)').text("\u03A8");
            //
            // // outliers headline
            // d3.select('#rama-root').append('div')
            //     .attr('class', 'rama-outliers-div')
            //     .append('div')
            //     .attr('class', 'rama-outliers-headline')
            //     .append('h4')
            //     .text('OUTLIERS');
            //
            // d3.select('.rama-outliers-div').append('div')
            //     .attr('class', 'outliers-container');
            d3.selectAll('g.rama-grid g.tick text').remove();
            d3.select('#rama-svg-container').append('div').attr('id', 'rama-sum').attr('class', 'rama-set-cl');
            d3.select('#rama-svg-container').append('div').attr('id', 'rama-settings').attr('class', 'rama-set-cl');
            var colorSelect = d3.select('#rama-settings').append('select').attr('id', 'rama-coloring');
            colorSelect.append('option').attr('value', 1).text('Default');
            colorSelect.append('option').attr('value', 2).text('Quality');
            colorSelect.append('option').attr('value', 3).text('RSRZ');
            colorSelect.on('change', function () {
                _this3.residueColorStyle = parseInt(d3.select('#rama-coloring').property('value'));
                _this3.changeResiduesColors(_this3.residueColorStyle);
                _this3.addSummaryInfo();
            });
            var plotTypeSelect = d3.select('#rama-settings').append('select').attr('id', 'rama-plot-type');
            plotTypeSelect.append('option').attr('value', 1).text('General case');
            plotTypeSelect.append('option').attr('value', 2).text('Isoleucine and valine');
            plotTypeSelect.append('option').attr('value', 3).text('Pre-proline');
            plotTypeSelect.append('option').attr('value', 4).text('Glycine');
            plotTypeSelect.append('option').attr('value', 5).text('Trans proline');
            plotTypeSelect.append('option').attr('value', 6).text('Cis proline');
            plotTypeSelect.on('change', function () {
                _this3.ramaContourPlotType = parseInt(d3.select('#rama-plot-type').property('value'));
                _this3.updateChart(_this3.chainsToShow, _this3.ramaContourPlotType, _this3.modelsToShowNumbers);
                RamachandranComponent.baseContours(_this3.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
            });
            // if (this.pdbIds.length > 1) {
            //
            //     let distanceLines = d3.select('#rama-settings').append('select').attr('id', 'rama-distance-select');
            //     distanceLines.append('option').attr('value', 1).text('Region change');
            //     distanceLines.append('option').attr('value', 2).text('All');
            //
            //     distanceLines.on('change', () => {
            //
            //     });
            // }
            var ramaForm = d3.select('#rama-settings').append('form').attr('id', 'rama-contour-style');
            ramaForm.append('label').classed('rama-contour-style', true).text('Contour').append('input').attr('type', 'radio').attr('name', 'contour-style').attr('value', 1).attr('checked', true).classed('rama-contour-radio', true);
            ramaForm.append('label').classed('rama-contour-style', true).text('Heat Map').append('input').attr('type', 'radio').attr('name', 'contour-style').attr('value', 2).classed('rama-contour-radio', true);
            ramaForm.on('change', function () {
                RamachandranComponent.contourColoringStyle = parseInt(d3.select('input[name="contour-style"]:checked').property('value'));
                RamachandranComponent.baseContours(_this3.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
            });
            var chainsString = '';
            if (this.chainsToShow.length > 2) {
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = this.chainsToShow[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var chain = _step.value;

                        chainsString += chain.toString() + ', ';
                        if (this.chainsToShow.indexOf(chain) == this.chainsToShow.length - 1) chainsString.slice(0, -2);
                        if (this.chainsToShow.indexOf(chain) == 2) {
                            chainsString += '...';
                            break;
                        }
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
            } else chainsString = this.chainsToShow.toString();
            var modelsString = '';
            if (this.modelsToShow.length > 2) {
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = this.modelsToShow[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var model = _step2.value;

                        modelsString += model.toString() + ', ';
                        if (this.modelsToShow.indexOf(model) == this.modelsToShow.length - 1) modelsString.slice(0, -2);
                        if (this.modelsToShow.indexOf(model) == 2) {
                            modelsString += '...';
                            break;
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
            } else modelsString = this.modelsToShow.toString();
            var tooltip = d3.select("body").append("div").style("position", "absolute").style("z-index", "10").style("visibility", "hidden");
            var entryInfo = d3.select('#rama-settings').append('div').style('display', 'inline-block').style('width', '25%').style('margin', '5px 5px 5px 10px');
            entryInfo.append('div').style('display', 'inline-block').style('width', '28%').attr('id', 'rama-info-pdbid');
            // .text(this.pdbId.toUpperCase());
            entryInfo.append('div').style('display', 'inline-block').attr('id', 'rama-info-chains').style('width', '36%').style('text-align', 'right').text(chainsString);
            d3.select('#rama-info-chains').on("mouseover", function () {
                d3.select('#rama-info-chains').style('cursor', 'default');
                return tooltip.style("visibility", "visible").style('opacity', .95).text(_this3.chainsToShow).style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 48 + 'px').style('background', 'gray').style('padding', '2px 5px 2px 5px').transition().duration(50);
            }).on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
            });
            entryInfo.append('div').style('display', 'inline-block').attr('id', 'rama-info-models').style('width', '36%').style('text-align', 'right').text(modelsString);
            d3.select('#rama-info-models').on("mouseover", function () {
                d3.select('#rama-info-models').style('cursor', 'default');
                return tooltip.style("visibility", "visible").text(_this3.modelsToShow.toString()).style('opacity', .95).style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 48 + 'px').style('background', 'gray').style('padding', '2px 5px 2px 5px').transition().duration(50);
            }).on("mouseout", function () {
                return tooltip.style("visibility", "hidden");
            });
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers);
            RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
            this.addEventListeners();
            d3.select('#rama-canvas').style('max-width', width + "px").style('width', '100.5%').style('padding', '30px 30px 30px 50px');
        }
        /**
         * change residues in chart
         * @param {String[]} chainsToShow
         * @param {number} ramaContourPlotType
         * @param {number[]} modelsToShow
         */

    }, {
        key: "updateChart",
        value: function updateChart(chainsToShow, ramaContourPlotType, modelsToShow) {
            var _this4 = this;

            this.svgContainer.selectAll('.dataGroup').remove();
            this.pdbIds.forEach(function (pdbId) {
                RamachandranComponent.allowed[pdbId] = 0;
                RamachandranComponent.favored[pdbId] = 0;
                RamachandranComponent.clashes[pdbId] = 0;
                RamachandranComponent.sideChainOutliers[pdbId] = 0;
                RamachandranComponent.ramachandranOutliers[pdbId] = 0;
                RamachandranComponent.rsrzCount[pdbId] = 0;
                RamachandranComponent.residuesOnCanvas[pdbId] = [];
                RamachandranComponent.outliersList[pdbId].length = 0;
            });
            // let width = 500;
            var fillColorFunction = this.fillColorFunction,
                tooltip = this.tooltip,
                residueColorStyle = this.residueColorStyle,
                width = this.width,
                svgContainer = this.svgContainer,
                tooltip2 = this.tooltip2;
            var onMouseOutResidue = this.onMouseOutResidue,
                onMouseOverResidue = this.onMouseOverResidue;
            // scales

            var xScale = d3.scaleLinear().domain([-180, 180]).range([0, width]);
            // .range([0, (0.985 * width)]);
            var yScale = d3.scaleLinear().domain([180, -180]).range([0, width]);
            /**
             * determines which residues will be displayed depending on ramaContourPlotType
             * @param residue
             * @returns {Residue}
             */
            function switchPlotType(residue) {
                switch (ramaContourPlotType) {
                    case 1:
                        return residue;
                    case 2:
                        if (residue.aa == 'ILE' || residue.aa == 'VAL') {
                            return residue;
                        }
                        break;
                    case 3:
                        if (residue.prePro) return residue;
                        break;
                    case 4:
                        if (residue.aa == 'GLY') {
                            return residue;
                        }
                        break;
                    case 5:
                        if (residue.cisPeptide == null && residue.aa == 'PRO') {
                            return residue;
                        }
                        break;
                    case 6:
                        if (residue.cisPeptide == 'Y' && residue.aa == 'PRO') {
                            return residue;
                        }
                        break;
                    default:
                        return residue;
                }
            }
            // sort because of svg z-index
            // outliersText
            d3.selectAll('.outliers').remove();
            d3.selectAll('table').remove();
            function filterModels(pdb) {
                var residues = [];
                pdb.molecules.forEach(function (molecule) {
                    molecule.chains.forEach(function (chain) {
                        if (chainsToShow.indexOf(chain.chainId) != -1) {
                            chain.models.forEach(function (model) {
                                if (modelsToShow.indexOf(model.modelId) != -1) {
                                    model.residues.forEach(function (residue) {
                                        residue.modelId = model.modelId;
                                        residue.chainId = chain.chainId;
                                        if (switchPlotType(residue) && residue.rama != null) {
                                            RamachandranComponent.residuesOnCanvas[residue.pdbId].push(residue);
                                            residues.push(residue);
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
                return residues;
            }
            var rsrz = RamachandranComponent.parsedPdb[0].rsrz;
            var outliersType = RamachandranComponent.parsedPdb[0].outlDict;
            var templatePdbResidues = filterModels(RamachandranComponent.parsedPdb[0]).sort(function (residue1, residue2) {
                if (typeof rsrz[residue1.num] != 'undefined') {
                    return 1;
                } else if (typeof rsrz[residue2.num] != 'undefined') {
                    return -1;
                } else if (typeof outliersType[residue1.num] == 'undefined') {
                    return -1;
                } else if (typeof outliersType[residue2.num] == 'undefined') {
                    return 1;
                } else if (outliersType[residue1.num].outliersType.length > outliersType[residue2.num].outliersType.length) {
                    return 1;
                } else {
                    return -1;
                }
            });
            var templatePdb = this.pdbIds[0];
            function addResiduesToCanvas(residues) {
                svgContainer.selectAll('.shapes').data(residues).enter().append('g').attr('class', 'dataGroup').append('path').attr('id', function (residue) {
                    var id = residue.aa + "-" + residue.chainId + "-" + residue.modelId + "-" + residue.authorResNum + "-" + residue.pdbId;
                    // residue.aa + '-' + residue.chainId + '-' + residue.modelId + '-' + residue.num + residue.pdbId;
                    RamachandranComponent.computeStats(residue);
                    residue.idSelector = id;
                    if (residueColorStyle !== 3) {
                        if (residue.rama === 'OUTLIER') {
                            RamachandranComponent.outliersList[residue.pdbId].push(residue);
                        }
                        if (residue.rama === 'Favored') {
                            RamachandranComponent.favored[residue.pdbId]++;
                        }
                        if (residue.rama === 'Allowed') {
                            RamachandranComponent.allowed[residue.pdbId]++;
                        }
                        return id;
                    }
                    if (residue.rama === 'OUTLIER' && typeof RamachandranComponent.rsrz[residue.pdbId][residue.num] !== 'undefined') {
                        RamachandranComponent.outliersList[residue.pdbId].push(residue);
                        return id;
                    }
                    return id;
                }).attr('d', function (residue) {
                    if (residue.aa === 'GLY') {
                        return RamachandranComponent.symbolTypes.triangle();
                    }
                    return RamachandranComponent.symbolTypes.circle();
                }).attr('transform', function (residue) {
                    return "translate(" + xScale(residue.phi) + "," + yScale(residue.psi) + ")";
                }).merge(svgContainer)
                // .style('fill', 'transparent')
                .style('fill', function (residue) {
                    return fillColorFunction(residue, residueColorStyle);
                })
                // .style('stroke', 'rgb(144, 142, 123)')
                .style('opacity', function (residue) {
                    return RamachandranComponent.computeOpacity(fillColorFunction(residue, residueColorStyle));
                }).on('mouseover', function (node) {
                    if (d3.select(this).node().style.opacity == 0) return;
                    onMouseOverResidue(node, ramaContourPlotType, residueColorStyle, tooltip, true);
                }).on('mouseout', function (node) {
                    if (d3.select(this).node().style.opacity == 0) return;
                    window.clearTimeout(RamachandranComponent.timeoutId);
                    onMouseOutResidue(node, ramaContourPlotType, residueColorStyle, tooltip, true);
                });
            }
            addResiduesToCanvas(templatePdbResidues);
            var otherResidues = [];
            RamachandranComponent.parsedPdb.forEach(function (pdb, index) {
                if (index < 1) return;
                otherResidues = otherResidues.concat(filterModels(pdb));
            });
            addResiduesToCanvas(otherResidues);
            function getDistance(point1, point2) {
                var xs = xScale(point1.phi) - xScale(point2.phi);
                xs = xs * xs;
                var ys = yScale(point1.psi) - yScale(point2.psi);
                ys = ys * ys;
                return Math.sqrt(xs + ys);
            }
            var distantResidues = [];
            RamachandranComponent.residuesOnCanvas[templatePdb].forEach(function (residue) {
                _this4.pdbIds.forEach(function (pdbId, index) {
                    if (index < 1) return;
                    var templateResidue = d3.select("#" + residue.idSelector.replace(residue.pdbId, pdbId));
                    if (!templateResidue.empty()) {
                        var residue2 = d3.select("#" + residue.idSelector).data()[0];
                        if (templateResidue.data()[0].rama != residue2.rama)
                            // let distance = getDistance(templateResidue.data()[0], residue2);
                            // if (distance > 80)
                            {
                                distantResidues.push({ templateResidue: residue2, otherResidue: templateResidue.data()[0], id: "rama-line-" + residue2.authorResNum });
                            }
                    }
                });
            });
            svgContainer.selectAll('line.rama-distance').data(distantResidues).enter().append('g').classed('dataGroup', true).append('line').attr('id', function (d) {
                return d.id;
            }).attr('class', 'rama-distance').attr('x1', function (d) {
                return xScale(d.templateResidue.phi);
            }).attr('y1', function (d) {
                return yScale(d.templateResidue.psi);
            }).attr('y2', function (d) {
                return yScale(d.otherResidue.psi);
            }).attr('x2', function (d) {
                return xScale(d.otherResidue.phi);
            }).attr("stroke-width", 2.5).attr("stroke", "#aa5519").attr("marker-end", "url(#arrow)").attr('opacity', '0.1').on('mouseover', function (node) {
                onMouseOverResidue(node.templateResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                onMouseOverResidue(node.otherResidue, ramaContourPlotType, residueColorStyle, tooltip2, false);
                tooltip.transition().style('opacity', .95).style('left', xScale(node.templateResidue.phi) - 50 + 'px').style('top', yScale(node.templateResidue.psi) + 45 + 'px').style('height', RamachandranComponent.tooltipHeight).style('width', String(RamachandranComponent.tooltipWidth) + 'px');
                tooltip2.transition().style('opacity', .95).style('left', xScale(node.otherResidue.phi) - 30 + 'px').style('top', yScale(node.otherResidue.psi) + 30 + 'px').style('height', RamachandranComponent.tooltipHeight).style('width', String(RamachandranComponent.tooltipWidth) + 'px');
                d3.select(this).attr("stroke-width", 3).attr('opacity', '0.8');
            }).on('mouseout', function (node) {
                window.clearTimeout(RamachandranComponent.timeoutId);
                onMouseOutResidue(node.templateResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                onMouseOutResidue(node.otherResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                tooltip.transition().style('opacity', 0);
                tooltip2.transition().style('opacity', 0);
                d3.select(this).attr("stroke-width", 2.5).attr('opacity', '0.1');
            });
            // .on('click', function(d: any) {
            //     if (highlightedResidues.length != 0) {
            //         highlightedResidues.forEach((d: any) => {
            //             d3.select('#' + d.idSelector)
            //                 .attr('d', (d: any) => changeObjectSize(d)).transition().duration(50)
            //                 .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz))
            //                 .style('opacity', (d) => {
            //                     return RamachandranComponent.computeOpacity(fillColorFunction(d, drawingType, outliersType, rsrz))
            //                 });
            //         });
            //         highlightedResidues.pop();
            //     }
            //     dispatchCustomEvent('PDB.ramaViewer.click', d);
            //     highlightedResidues.push(d);
            //     d3.select(this)
            //         .attr('d', (d: any) => changeObjectSize(d, false))
            //         .style('fill', 'magenta')
            //         .style('opacity', 1);
            //         // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
            // });
            this.pdbIds.forEach(function (pdbId) {
                RamachandranComponent.outliersList[pdbId].sort(function (residue1, residue2) {
                    return residue1.num - residue2.num;
                });
            });
            this.addSummaryInfo();
        }
        /**
         * add baseContours
         * @param {number} ramaContourPlotType
         * @param {number} contourColorStyle
         */

    }, {
        key: "addEventListeners",

        /**
         * add listeners from other components
         */
        value: function addEventListeners() {
            var _this5 = this;

            var clickEvents = ['PDB.litemol.click', 'PDB.topologyViewer.click'];
            var mouseOutEvents = ['PDB.topologyViewer.mouseout', 'PDB.litemol.mouseout'];
            var scrollTimer = void 0,
                lastScrollFireTime = 0;
            var fillColorFunction = this.fillColorFunction,
                residueColorStyle = this.residueColorStyle;
            /**
             * unhighlight residue from event
             * @param event
             */

            function unHighlightObject(event) {
                if (typeof event.eventData != 'undefined') {
                    if (RamachandranComponent.highlightedResidues.indexOf(getResidueNode(event)) == -1) {
                        d3.select('.selected-res').classed('selected-res', false).attr('d', function (residue) {
                            return RamachandranComponent.changeObjectSize(residue);
                        }).transition().duration(50).style('fill', function (residue) {
                            return fillColorFunction(residue, residueColorStyle);
                        }).style('display', 'block');
                        // .style('opacity', (d) => {
                        //     return RamachandranComponent.computeOpacity(fillColorFunction(d, drawingType, outliersType, rsrz))
                        // });
                    }
                }
            }
            /**
             * onClick event
             * @param event
             */
            function onClick(event) {
                var res = getResidueNode(event);
                if (RamachandranComponent.highlightedResidues.length != 0) {
                    RamachandranComponent.highlightedResidues.forEach(function (node) {
                        node.attr('d', function (residue) {
                            return RamachandranComponent.changeObjectSize(residue);
                        }).transition().duration(50).style('fill', function (residue) {
                            return fillColorFunction(residue, residueColorStyle);
                        }).style('display', 'block');
                        // .style('opacity', (d) => {
                        //     return RamachandranComponent.computeOpacity(fillColorFunction(d, drawingType, outliersType, rsrz))
                        // });
                    });
                    RamachandranComponent.highlightedResidues.pop();
                }
                RamachandranComponent.highlightedResidues.push(res);
                getResidueNode(event).attr('d', function (residue) {
                    return RamachandranComponent.changeObjectSize(residue, false);
                }).classed('selected-res', false).style('fill', 'magenta').style('opacity', '1');
            }
            /**
             * return residue node from event
             * @param event
             * @returns {Selection}
             */
            function getResidueNode(event) {
                if (typeof event.eventData.chainId == 'undefined') return null;
                return d3.select('path#' + event.eventData.residueName + '-' + event.eventData.chainId + '-' + event.eventData.entityId + '-' + event.eventData.residueNumber);
            }
            /**
             * highlight residue from event
             * @param event
             */
            function highLightObject(event) {
                var res = getResidueNode(event);
                if (res) {
                    res.attr('d', function (d) {
                        return RamachandranComponent.changeObjectSize(d, false);
                    }).classed('selected-res', true).style('fill', 'yellow').style('opacity', '1');
                    // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
                }
            }
            window.addEventListener('PDB.topologyViewer.mouseover', function (event) {
                var minMouseOverTime = 150;
                var now = new Date().getTime();
                function mouseOver(event) {
                    if (typeof event.eventData != 'undefined') {
                        var res = getResidueNode(event);
                        if (res) {
                            if (res.attr('style').includes('magenta')) {
                                return;
                            }
                        }
                        unHighlightObject(event);
                        highLightObject(event);
                    } else {
                        unHighlightObject(event);
                    }
                }
                if (!scrollTimer) {
                    if (now - lastScrollFireTime > 3 * minMouseOverTime) {
                        mouseOver(event); // fire immediately on first scroll
                        lastScrollFireTime = now;
                    }
                    scrollTimer = setTimeout(function () {
                        scrollTimer = null;
                        lastScrollFireTime = new Date().getTime();
                        mouseOver(event);
                    }, minMouseOverTime);
                }
            });
            window.addEventListener('PDB.litemol.mouseover', function (event) {
                if (typeof event.eventData != 'undefined') {
                    var res = getResidueNode(event);
                    if (res) {
                        if (res.attr('style').includes('magenta')) {
                            return;
                        }
                    }
                    unHighlightObject(event);
                    highLightObject(event);
                } else {
                    unHighlightObject(event);
                }
            });
            window.addEventListener('protvista.click', function (d) {
                RamachandranComponent.hiddenResidues.forEach(function (residue) {
                    if (residue.idSelector != '') {
                        d3.select("#" + residue.idSelector).style('visibility', 'visible');
                    }
                });
                if (_this5.lastSelection == d.detail) {
                    RamachandranComponent.hiddenResidues = [];
                    RamachandranComponent.selectedResidues = [];
                    _this5.lastSelection = {};
                    return;
                }
                _this5.lastSelection = d.detail;
                _this5.pdbIds.forEach(function (pdbId) {
                    RamachandranComponent.hiddenResidues = RamachandranComponent.residuesOnCanvas[pdbId].filter(function (residue) {
                        if (!(residue.authorResNum >= _this5.lastSelection.begin && residue.authorResNum <= _this5.lastSelection.end)) return residue;else RamachandranComponent.selectedResidues.push(residue);
                    });
                });
                RamachandranComponent.hiddenResidues.forEach(function (residue) {
                    if (residue.idSelector != '') {
                        if (d3.select("#" + residue.idSelector).empty()) {
                            return;
                        }
                        d3.select("#" + residue.idSelector).style('visibility', 'hidden');
                    }
                });
            });
            /**
             * add event listeners
             */
            clickEvents.forEach(function (type) {
                window.addEventListener(type, function (event) {
                    onClick(event);
                });
            });
            mouseOutEvents.forEach(function (type) {
                window.addEventListener(type, function (event) {
                    if (RamachandranComponent.highlightedResidues.indexOf(event) > -1) {
                        return;
                    }
                    unHighlightObject(event);
                });
            });
        }
        /**
         * add summary infobelow the plot
         */

    }, {
        key: "addSummaryInfo",
        value: function addSummaryInfo() {
            var _this6 = this;

            d3.selectAll('.rama-sum-table').remove();
            d3.select('#rama-sum').append('table').classed('rama-sum-table', true).append('tr').classed('rama-sum-table-headline', true).append('th').text('PDB');
            switch (this.residueColorStyle) {
                case 1:
                    d3.select('.rama-sum-table-headline').append('th').text('Preferred regions');
                    d3.select('.rama-sum-table-headline').append('th').text('Allowed regions');
                    d3.select('.rama-sum-table-headline').append('th').text('Outliers');
                    break;
                case 2:
                    d3.select('.rama-sum-table-headline').append('th').text('Ramachandran outliers');
                    d3.select('.rama-sum-table-headline').append('th').text('Sidechain outliers');
                    d3.select('.rama-sum-table-headline').append('th').text('Clashes');
                    break;
                case 3:
                    d3.select('.rama-sum-table-headline').append('th').text('RSRZ');
                    break;
            }
            RamachandranComponent.parsedPdb.forEach(function (pdb) {
                var resArrayLength = RamachandranComponent.residuesOnCanvas[pdb.pdbID].length;
                if (resArrayLength == 0) resArrayLength = 1;
                switch (_this6.residueColorStyle) {
                    case 1:
                        d3.select('.rama-sum-table').append('tr').classed("table-row-" + pdb.pdbID, true).append('td').text(pdb.pdbID);
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.favored[pdb.pdbID]) + " \n                        (" + String((RamachandranComponent.favored[pdb.pdbID] / resArrayLength * 100).toFixed(0)) + " %)");
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.allowed[pdb.pdbID]) + " \n                        (" + String((RamachandranComponent.allowed[pdb.pdbID] / resArrayLength * 100).toFixed(0)) + " %)");
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.outliersList[pdb.pdbID].length) + " \n                        (" + String((RamachandranComponent.outliersList[pdb.pdbID].length / resArrayLength * 100).toFixed(0)) + " %)");
                        break;
                    case 2:
                        d3.select('.rama-sum-table').append('tr').classed("table-row-" + pdb.pdbID, true).append('td').text(pdb.pdbID);
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.ramachandranOutliers[pdb.pdbID]) + " \n                        (" + String((RamachandranComponent.ramachandranOutliers[pdb.pdbID] / resArrayLength * 100).toFixed(0)) + " %)");
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.sideChainOutliers[pdb.pdbID]) + " \n                        (" + String((RamachandranComponent.sideChainOutliers[pdb.pdbID] / resArrayLength * 100).toFixed(0)) + " %)");
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.clashes[pdb.pdbID]) + " \n                        (" + String((RamachandranComponent.clashes[pdb.pdbID] / resArrayLength * 100).toFixed(0)) + " %)");
                        break;
                    case 3:
                        d3.select('.rama-sum-table').append('tr').classed("table-row-" + pdb.pdbID, true).append('td').text(pdb.pdbID);
                        d3.select(".table-row-" + pdb.pdbID).append('td').text(String(RamachandranComponent.rsrzCount[pdb.pdbID]) + " \n                        (" + String((RamachandranComponent.rsrzCount[pdb.pdbID] / resArrayLength * 100).toFixed(0)) + " %)");
                }
            });
            // switch (this.residueColorStyle){
            //     case 1:
            //         d3.selectAll('.rama-sum-table').remove();
            //         d3.select('#rama-sum').append('table').classed('rama-sum-table', true).append('tr')
            //             .classed('rama-sum-table-headline', true).append('th')
            //             .text('PDB');
            //         d3.select('.rama-sum-table-headline').append('th').text('Preferred regions');
            //         d3.select('.rama-sum-table-headline').append('th').text('Allowed regions');
            //         d3.select('.rama-sum-table-headline').append('th').text('Outliers');
            //
            //         RamachandranComponent.parsedPdb.forEach((pdb: ParsePDB) => {
            //
            //
            //             d3.select('.rama-sum-table').append('tr')
            //                 .classed(`table-row-${pdb.pdbID}`, true).append('td').text(pdb.pdbID);
            //
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(pdb.favored)} (${String((pdb.favored / resArrayLength * 100)
            //                     .toFixed(0))} %)`);
            //
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(pdb.allowed)} (${String((pdb.allowed / resArrayLength * 100)
            //                     .toFixed(0))} %)`);
            //
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(pdb.outliersList.length)} (${String((pdb.outliersList
            //                     .length / resArrayLength * 100).toFixed(0))} %)`);
            //         });
            //         break;
            //     case 2:
            //         d3.selectAll('.rama-sum-table').remove();
            //         d3.select('#rama-sum').append('table').classed('rama-sum-table', true)
            //             .append('tr').classed('rama-sum-table-headline', true).append('th')
            //             .text('PDB');
            //         d3.select('.rama-sum-table-headline').append('th').text('Ramachandran outliers');
            //         d3.select('.rama-sum-table-headline').append('th').text('Sidechain outliers');
            //         d3.select('.rama-sum-table-headline').append('th').text('Clashes');
            //
            //         RamachandranComponent.parsedPdb.forEach((pdb: ParsePDB) => {
            //             let resArrayLength = RamachandranComponent.residuesOnCanvas[pdb.pdbID].length;
            //             if (resArrayLength == 0)
            //                 resArrayLength = 1;
            //
            //             d3.select('.rama-sum-table').append('tr').classed(`table-row-${pdb.pdbID}`, true)
            //                 .append('td').text(pdb.pdbID);
            //
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(pdb.ramaOutl)} (${String((pdb.ramaOutl / resArrayLength * 100)
            //                     .toFixed(0))} %)`);
            //
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(pdb.sidechainOutl)} (${String((pdb.sidechainOutl / resArrayLength * 100)
            //                     .toFixed(0))} %)`);
            //
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(pdb.clashes)} (${String((pdb.clashes / resArrayLength * 100)
            //                     .toFixed(0))} %)`);
            //         });
            //         break;
            //
            //     case 3:
            //         d3.selectAll('.rama-sum-table').remove();
            //         d3.select('#rama-sum').append('table').classed('rama-sum-table', true).append('tr')
            //             .classed('rama-sum-table-headline', true).append('th')
            //             .text('PDB');
            //         d3.select('.rama-sum-table-headline').append('th').text('RSRZ');
            //
            //         RamachandranComponent.parsedPdb.forEach((pdb: ParsePDB) => {
            //             let resArrayLength = RamachandranComponent.residuesOnCanvas[pdb.pdbID].length;
            //             if (resArrayLength == 0)
            //                 resArrayLength = 1;
            //
            //             d3.select('.rama-sum-table').append('tr')
            //                 .classed(`table-row-${pdb.pdbID}`, true)
            //                 .append('td').text(pdb.pdbID);
            //             d3.select(`.table-row-${pdb.pdbID}`).append('td')
            //                 .text(`${String(Object.keys(pdb.rsrz).length)} (${String((Object.keys(pdb.rsrz).length
            //                     / resArrayLength * 100).toFixed(0))} %)`);
            //         });
            // }
            // switch (this.residueColorStyle) {
            //     case 1:
            //         d3.selectAll('#rama-sum-div').remove();
            //         d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
            //             .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
            //             .text('Preferred regions: ' + String(RamachandranComponent.favored)
            //                 + ' (' + String((RamachandranComponent.favored / resArrayLength * 100).toFixed(0))
            //                 + '%)').enter();
            //         d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
            //             .attr('id', 'rama-sum-middle')
            //             .text('Allowed regions: ' + String(RamachandranComponent.allowed)
            //                 + ' (' + String((RamachandranComponent.allowed / resArrayLength * 100).toFixed(0))
            //                 + '%)').enter();
            //         d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
            //             .attr('id', 'rama-sum-thinnest')
            //             .text('Outliers: ' + String(RamachandranComponent.outliersList.length)
            //                 + ' (' + String((RamachandranComponent.outliersList.length / resArrayLength * 100).toFixed(0)) + '%)').enter();
            //
            //         break;
            //     case 2:
            //         d3.selectAll('#rama-sum-div').remove();
            //         d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
            //             .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
            //             .text('Ramachandran outliers: ' + String(this.ramachandranOutliers)
            //                 + ' (' + String((this.ramachandranOutliers / resArrayLength * 100).toFixed(0)) +
            //                 '%)').enter();
            //         d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
            //             .attr('id', 'rama-sum-middle')
            //             .text('Sidechain outliers: ' + String(this.sidechainOutliers)
            //                 + ' (' + String((this.sidechainOutliers / resArrayLength * 100).toFixed(0)) + '%)').enter();
            //         d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
            //             .attr('id', 'rama-sum-thinnest')
            //             .text('Clashes: ' + String(this.clashes)
            //                 + ' (' + String((this.clashes / resArrayLength * 100).toFixed(0)) + '%)').enter();
            //         break;
            //     case 3:
            //         d3.selectAll('#rama-sum-div').remove();
            //         d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
            //             .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
            //             .text('RSRZ: ' + String(this.rsrzCount)
            //                 + ' (' + String((this.rsrzCount / resArrayLength * 100).toFixed(0)) + '%) ').enter();
            //         break;
            //     default:
            //         return;
            // }
        }
        /**
         * compute summary stats of ramachandran diagram
         * @param residue
         */

    }, {
        key: "fillColorFunction",

        /**
         * return fillColor which will be used
         * @param residue - one residue
         * @param {number} drawingType Default - 1/Quality - 2/ RSRZ - 3
         * @returns {string} hex of color
         */
        value: function fillColorFunction(residue, drawingType) {
            // if (compute)
            //     this.computeStats(residue);
            switch (drawingType) {
                case 1:
                    if (residue.rama === 'OUTLIER') {
                        residue.residueColor = '#f00';
                        return residue.residueColor;
                    }
                    residue.residueColor = '#000';
                    return residue.residueColor;
                case 2:
                    if (typeof RamachandranComponent.outliersType[residue.pdbId][residue.num] === 'undefined') {
                        residue.residueColor = '#008000';
                        return residue.residueColor;
                    } else {
                        switch (RamachandranComponent.outliersType[residue.pdbId][residue.num].outliersType.length) {
                            case 0:
                                residue.residueColor = '#008000';
                                return residue.residueColor;
                            case 1:
                                residue.residueColor = '#ff0';
                                return residue.residueColor;
                            case 2:
                                residue.residueColor = '#f80';
                                return residue.residueColor;
                            default:
                                residue.residueColor = '#850013';
                                return residue.residueColor;
                        }
                    }
                case 3:
                    if (typeof RamachandranComponent.rsrz[residue.pdbId][residue.num] === 'undefined') {
                        residue.residueColor = '#000';
                        return residue.residueColor;
                    } else {
                        residue.residueColor = '#f00';
                        return residue.residueColor;
                    }
                default:
                    break;
            }
        }
        /**
         * how opaque node will be
         * @param fillColor
         * @returns {number}
         */

    }, {
        key: "onMouseOverResidue",

        /**
         *
         * @param residue
         * @param {number} ramaContourPlotType
         * @param {number} residueColorStyle
         * @param tooltip
         * @param changeCont
         */
        value: function onMouseOverResidue(residue, ramaContourPlotType, residueColorStyle, tooltip, changeCont) {
            var highlightColor = residue.residueColor;
            if (residue.residueColor == '#000') highlightColor = 'yellow';
            RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOver', residue, residue.pdbId);
            if (changeCont) RamachandranComponent.changeContours(residue, false, ramaContourPlotType);
            switch (residueColorStyle) {
                case 1:
                    if (residue.rama === 'Favored') {
                        tooltip.html(RamachandranComponent.tooltipText(residue) + '<br/> Favored');
                    }
                    if (residue.rama === 'Allowed') {
                        tooltip.html(RamachandranComponent.tooltipText(residue) + '<br/> Allowed');
                    }
                    if (residue.rama === 'OUTLIER') {
                        tooltip.html(RamachandranComponent.tooltipText(residue) + '<br/><b>OUTLIER</b>');
                    }
                    break;
                case 2:
                    var outliersType = RamachandranComponent.outliersType[residue.pdbId];
                    var tempStr = '';
                    if (typeof outliersType[residue.num] === 'undefined') {
                        tooltip.html(RamachandranComponent.tooltipText(residue));
                        break;
                    }
                    var outlierTypeHelper = outliersType[residue.num].outliersType;
                    if (outlierTypeHelper.includes('clashes')) {
                        tempStr += '<br/>Clash';
                    }
                    if (outlierTypeHelper.includes('ramachandran_outliers')) {
                        tempStr += '<br/>Ramachandran outlier';
                        RamachandranComponent.tooltipWidth = 130;
                    }
                    if (outlierTypeHelper.includes('sidechain_outliers')) {
                        tempStr += '<br/>Sidechain outlier';
                        RamachandranComponent.tooltipWidth = 100;
                    }
                    if (outlierTypeHelper.includes('bond_angles')) {
                        tempStr += '<br/>Bond angles';
                    } else {
                        tooltip.html(RamachandranComponent.tooltipText(residue));
                    }
                    switch (RamachandranComponent.outliersType[residue.pdbId][residue.num].outliersType.length) {
                        case 2:
                            RamachandranComponent.tooltipHeight = 68;
                            break;
                        case 3:
                            RamachandranComponent.tooltipHeight = 78;
                            break;
                        default:
                            break;
                    }
                    tooltip.html(RamachandranComponent.tooltipText(residue) + tempStr);
                    break;
                case 3:
                    if (typeof RamachandranComponent.rsrz[residue.pdbId][residue.num] === 'undefined') {
                        tooltip.html(RamachandranComponent.tooltipText(residue));
                    } else {
                        tooltip.html(RamachandranComponent.tooltipText(residue) + '<br/><b>RSRZ outlier</b>');
                    }
                    break;
                default:
                    break;
            }
            if (changeCont) {
                tooltip.transition().style('opacity', .95).style('left', d3.event.pageX + 10 + 'px').style('top', d3.event.pageY - 48 + 'px').style('height', RamachandranComponent.tooltipHeight).style('width', String(RamachandranComponent.tooltipWidth) + 'px');
            }
            d3.select("#" + residue.idSelector).attr('d', function (residue) {
                return RamachandranComponent.changeObjectSize(residue, false);
            }).style('fill', highlightColor).style('opacity', 1);
            // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
        }
        /**
         *
         * @param residue
         * @param {number} ramaContourPlotType
         * @param {number} residueColorStyle
         * @param tooltip
         * @param changeCount
         */

    }, {
        key: "onMouseOutResidue",
        value: function onMouseOutResidue(residue, ramaContourPlotType, residueColorStyle, tooltip, changeCount) {
            var outTime = new Date().getTime();
            RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOut', residue, residue.pdbId);
            if (RamachandranComponent.highlightedResidues.indexOf(residue) > -1) {
                return;
            }
            d3.select("#" + residue.idSelector).transition().attr('d', function (dat) {
                return RamachandranComponent.changeObjectSize(dat);
            }).style('fill', residue.residueColor).style('opacity', function () {
                return RamachandranComponent.computeOpacity(residue.residueColor);
            });
            if (changeCount) {
                tooltip.transition().style('opacity', 0);
                if (outTime - RamachandranComponent.currentTime > 600) {
                    window.setTimeout(function () {
                        RamachandranComponent.changeContours(residue, true, ramaContourPlotType);
                    }, 50);
                }
            }
        }
        /**
         * change residue coloring
         * @param {number} residueColorStyle
         */

    }, {
        key: "changeResiduesColors",
        value: function changeResiduesColors(residueColorStyle) {
            var _this7 = this;

            var tooltip = this.tooltip,
                onMouseOverResidue = this.onMouseOverResidue,
                ramaContourPlotType = this.ramaContourPlotType,
                onMouseOutResidue = this.onMouseOutResidue;

            this.pdbIds.forEach(function (pdbId) {
                var resArray = RamachandranComponent.residuesOnCanvas[pdbId];
                if (RamachandranComponent.selectedResidues.length != 0) {
                    resArray = RamachandranComponent.selectedResidues.slice(0);
                }
                resArray.forEach(function (residue) {
                    if (residue.idSelector != '') {
                        var node = d3.select("#" + residue.idSelector);
                        node.style('fill', _this7.fillColorFunction(residue, residueColorStyle));
                        node.style('opacity', function (residue) {
                            return RamachandranComponent.computeOpacity(_this7.fillColorFunction(residue, residueColorStyle));
                        });
                        node.on('mouseover', function () {
                            if (d3.select("#" + residue.idSelector).style('opacity') == '0') return;
                            onMouseOverResidue(residue, ramaContourPlotType, residueColorStyle, tooltip, true);
                        });
                        node.on('mouseout', function () {
                            if (d3.select("#" + residue.idSelector).style('opacity') == '0') return;
                            window.clearTimeout(RamachandranComponent.timeoutId);
                            onMouseOutResidue(residue, ramaContourPlotType, residueColorStyle, tooltip, true);
                        });
                    }
                });
            });
        }
        /**
         * sort json object to that it can be better displayed
         * @param jsonObject
         * @param {number} drawingType
         * @param {Dictionary} outliersType
         * @param {Dictionary} rsrz
         */

    }, {
        key: "sortJson",
        value: function sortJson(jsonObject, drawingType, outliersType, rsrz) {
            jsonObject.sort(function (a, b) {
                // switch (drawingType) {
                //     case 1:
                //         if (a.rama === 'OUTLIER') {
                //             if (b.rama === 'Allowed') {
                //                 return 1;
                //             }
                //             if (b.rama === 'Favored') {
                //                 return 1;
                //             }
                //             if (b.rama === 'OUTLIER') {
                //                 return 0;
                //             }
                //         }
                //         if (a.rama === 'Allowed') {
                //             if (b.rama === 'Allowed') {
                //                 return 0;
                //             }
                //             if (b.rama === 'Favored') {
                //                 return 1;
                //             }
                //             if (b.rama === 'OUTLIER') {
                //                 return -1;
                //             }
                //         }
                //         if (a.rama === 'Favored') {
                //             if (b.rama === 'Allowed') {
                //                 return -1;
                //             }
                //             if (b.rama === 'Favored') {
                //                 return 0;
                //             }
                //             if (b.rama === 'OUTLIER') {
                //                 return -1;
                //             }
                //         }
                //         break;
                //     case 2:
                if (typeof rsrz[a.num] != 'undefined') {
                    return 1;
                } else if (typeof rsrz[b.num] != 'undefined') {
                    return -1;
                } else if (typeof outliersType[a.num] == 'undefined') {
                    return -1;
                } else if (typeof outliersType[b.num] == 'undefined') {
                    return 1;
                } else if (outliersType[a.num].outliersType.length > outliersType[b.num].outliersType.length) {
                    return 1;
                } else {
                    return -1;
                }
                //     case 3:
                //         if (typeof rsrz[a.num] === 'undefined') {
                //             return -1;
                //         } else if (typeof  rsrz[b.num] === 'undefined') {
                //             return 1;
                //         } else {
                //             return 1;
                //         }
                //     default:
                //         break;
                // }
            });
        }
        /**
         * function to change opacity while hovering
         * @param {string} residuesString
         * @param {boolean} makeInvisible
         */

    }, {
        key: "addTable",

        /**
         * add outliers table
         */
        value: function addTable() {
            this.outliersTable = d3.select('.outliers-container').append('div').attr('class', 'outliers').append('table').attr('class', 'table table-hover table-responsive');
            d3.select('.outliers-container').append('table').attr('class', 'rama-outliers-table').append('thead').append('tr').attr('id', 'tab-headline');
            d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('Chain').style('width', '30%').style('min-width', '50px').style('text-align', 'right');
            d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('ID').style('width', '30%').style('min-width', '50px').style('text-align', 'right');
            d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('AA').style('width', '30%').style('min-width', '50px').style('text-align', 'right');
            d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('Phi').style('width', '30%').style('min-width', '50px').style('text-align', 'right');
            d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('Psi').style('width', '30%').style('min-width', '50px').style('text-align', 'right');
        }
        /**
         * fill outliers table
         * @param {any[]} sortedTable
         * @param {number} drawingType
         */

    }, {
        key: "fillTable",
        value: function fillTable(sortedTable, drawingType) {
            var objSize = 40;
            var fillColorFunction = this.fillColorFunction;

            if (window.screen.availWidth < 1920) {
                objSize = 30;
            }
            if (window.screen.width < 350) {
                objSize = 5;
            }
            var symbolTypes = {
                circle: d3.symbol().type(d3.symbolCircle).size(30),
                triangle: d3.symbol().type(d3.symbolTriangle).size(30)
            };
            var rows = this.outliersTable.selectAll('tbody tr').data(sortedTable, function (d) {
                return d.num;
            });
            rows.enter().append('tr').on('mouseover', function (d) {
                d3.select(this).style('background-color', '#b4bed6').style('cursor', 'pointer');
                d3.select('#' + '-' + d.chainId + '-' + d.modelId + '-' + d.num).attr('d', function (dat) {
                    if (dat.aa === 'GLY') {
                        symbolTypes.triangle.size(175);
                        return symbolTypes.triangle();
                    }
                    symbolTypes.circle.size(175);
                    return symbolTypes.circle();
                }).style('fill', function (residue) {
                    return fillColorFunction(residue, drawingType);
                });
            })
            //
            .on('mouseout', function (residue) {
                d3.select(this).style('background-color', 'transparent').style('cursor', 'default');
                // d3.select('#' +  d.aa + '-' + d.chainId + '-' + d.modelId + '-' + d.num + d.pdbId)
                d3.select("#" + residue.aa + "-" + residue.chainId + "-" + residue.modelId + "-" + residue.num + "-" + residue.pdbId).transition()
                // .duration(50)
                .attr('d', function (dat) {
                    if (dat.aa === 'GLY') {
                        symbolTypes.triangle.size(objSize);
                        return symbolTypes.triangle();
                    }
                    symbolTypes.circle.size(objSize);
                    return symbolTypes.circle();
                }).style('fill', function (residue) {
                    return fillColorFunction(residue, drawingType);
                }).style('fillColorFunction-width', '0.5');
            }).selectAll('td').data(function (d) {
                return [d.chainId, d.num, d.aa, d.phi, d.psi];
            }).enter().append('td').attr('id', 'rama-td').style('width', '30%').style('min-width', '50px').style('text-align', 'right').text(function (d) {
                return d;
            });
            rows.exit().remove();
            //
            var cells = rows.selectAll('td').data(function (d) {
                return [d.chainId, d.num, d.aa, d.phi, d.psi];
            }).text(function (d) {
                return d;
            });
            //
            cells.enter().append('td').text(function (d) {
                return d;
            });
            cells.exit().remove();
        }
    }], [{
        key: "baseContours",
        value: function baseContours(ramaContourPlotType, contourColorStyle) {
            RamachandranComponent.clearCanvas();
            var width = RamachandranComponent.width,
                height = RamachandranComponent.height;
            var img = new Image();
            var svgImg = new Image();
            switch (ramaContourPlotType) {
                case 1:
                    img.src = HeatMapContours_1.generalContour;
                    svgImg.src = LineContours_1.lineGeneralContour;
                    break;
                case 2:
                    img.src = HeatMapContours_1.ileVal;
                    svgImg.src = LineContours_1.lineIleVal;
                    break;
                case 3:
                    img.src = HeatMapContours_1.prePro;
                    svgImg.src = LineContours_1.linePrePro;
                    break;
                case 4:
                    img.src = HeatMapContours_1.gly;
                    svgImg.src = LineContours_1.lineGly;
                    break;
                case 5:
                    img.src = HeatMapContours_1.transPro;
                    svgImg.src = LineContours_1.lineTransPro;
                    break;
                case 6:
                    img.src = HeatMapContours_1.cisPro;
                    svgImg.src = LineContours_1.lineCisPro;
                    break;
                default:
                    return;
            }
            var context = RamachandranComponent.canvasContainer.node().getContext('2d');
            context.clearRect(0, 0, width + 80, height + 60);
            if (contourColorStyle == 2) {
                context.globalAlpha = 0.6;
                img.onload = function () {
                    context.drawImage(img, 0, 0, width, height * img.height / img.width);
                };
            } else {
                context.globalAlpha = 1;
                svgImg.onload = function () {
                    context.drawImage(svgImg, 0, 0, width, height * svgImg.height / svgImg.width);
                };
            }
        }
    }, {
        key: "computeStats",
        value: function computeStats(residue) {
            if (RamachandranComponent.outliersType[residue.pdbId][residue.num] != undefined) {
                var outlTypeHelper = RamachandranComponent.outliersType[residue.pdbId][residue.num].outliersType;
                if (outlTypeHelper.includes('clashes')) {
                    RamachandranComponent.clashes[residue.pdbId]++;
                }
                if (outlTypeHelper.includes('ramachandran_outliers')) {
                    RamachandranComponent.ramachandranOutliers[residue.pdbId]++;
                }
                if (outlTypeHelper.includes('sidechain_outliers')) {
                    RamachandranComponent.sideChainOutliers[residue.pdbId]++;
                }
            }
            if (typeof RamachandranComponent.rsrz[residue.pdbId][residue.num] != 'undefined') {
                RamachandranComponent.rsrzCount[residue.pdbId]++;
            }
        }
    }, {
        key: "computeOpacity",
        value: function computeOpacity(fillColor) {
            if (fillColor == '#008000') return 0.5;
            if (fillColor == 'black' || fillColor == '#000') return 0.15;
            if (fillColor == '#ff0') return 0.8;
            return 1;
        }
        /**
         * return timeoutid when hovering
         * @param {number} ramaContourPlotType
         * @param {string} aa
         * @returns {number}
         */

    }, {
        key: "getTimeout",
        value: function getTimeout(ramaContourPlotType) {
            var aa = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

            return window.setTimeout(function () {
                RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                RamachandranComponent.changeOpacity(aa);
            }, 600);
        }
        /**
         * throw new event with defined data
         * @param {string} name name of event
         * @param {string} pdbId
         * @param residue node
         */

    }, {
        key: "dispatchCustomEvent",
        value: function dispatchCustomEvent(name, residue, pdbId) {
            var event = new CustomEvent(name, { detail: {
                    chainId: residue.chainId,
                    entityId: residue.modelId,
                    entry: pdbId,
                    residueName: residue.aa,
                    residueNumber: residue.authorResNum
                } });
            window.dispatchEvent(event);
        }
        /**
         * function for change contours after mouseout or mouseover
         * @param residue selected node
         * @param toDefault true if used for return to base state
         * @param ramaContourPlotType
         */

    }, {
        key: "changeContours",
        value: function changeContours(residue) {
            var toDefault = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            var ramaContourPlotType = arguments[2];

            RamachandranComponent.currentTime = new Date().getTime();
            switch (residue.aa) {
                case 'ILE':
                case 'VAL':
                    if (ramaContourPlotType != 2) {
                        if (toDefault) {
                            RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            RamachandranComponent.changeOpacity('VAL,ILE', false);
                        } else {
                            RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(2, 'VAL,ILE');
                        }
                    }
                    return;
                case 'GLY':
                    if (ramaContourPlotType != 4) {
                        if (toDefault) {
                            RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            RamachandranComponent.changeOpacity('GLY', false);
                        } else {
                            RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(4, 'GLY');
                        }
                    }
                    return;
                case 'PRO':
                    if (ramaContourPlotType < 5) {
                        if (toDefault) {
                            RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            RamachandranComponent.changeOpacity('PRO', false);
                        } else {
                            if (residue.cisPeptide === null && residue.aa === 'PRO') {
                                RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(5, 'PRO');
                                break;
                            }
                            if (residue.cisPeptide === 'Y' && residue.aa === 'PRO') {
                                RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(6, 'PRO');
                                break;
                            }
                        }
                    }
                    return;
                default:
                    break;
            }
            if (residue.prePro) {
                if (ramaContourPlotType != 3) {
                    if (toDefault) {
                        RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                        RamachandranComponent.changeOpacity('', false);
                    } else {
                        RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(3, '');
                    }
                }
            }
        }
        /**
         * text for tooltip
         * @param residue
         * @returns {string}
         */

    }, {
        key: "tooltipText",
        value: function tooltipText(residue) {
            // language=HTML
            return "<b>" + residue.pdbId.toUpperCase() + "<br>" + residue.chainId + " " + residue.authorResNum + " " + residue.aa + "</b><br/>\u03A6: " + residue.phi + "<br/>\u03A8: " + residue.psi;
        }
        /**
         * change object size on hover
         * @param residue
         * @param {boolean} smaller
         * @returns {string | null}
         */

    }, {
        key: "changeObjectSize",
        value: function changeObjectSize(residue) {
            var smaller = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var objSize = 40;
            if (window.screen.availWidth < 1920) {
                objSize = 30;
            }
            if (window.screen.width < 350) {
                objSize = 5;
            }
            var size = 175;
            if (smaller) {
                size = objSize;
            }
            if (residue.aa === 'GLY') {
                RamachandranComponent.symbolTypes.triangle.size(size);
                return RamachandranComponent.symbolTypes.triangle();
            }
            RamachandranComponent.symbolTypes.circle.size(size);
            return RamachandranComponent.symbolTypes.circle();
        }
    }, {
        key: "changeOpacity",
        value: function changeOpacity(residuesString) {
            var makeInvisible = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

            var residues = residuesString.split(',');
            var nodes = void 0;
            var firstRun = true;
            RamachandranComponent.parsedPdb.forEach(function (pdb) {
                var resArray = RamachandranComponent.residuesOnCanvas[pdb.pdbID].slice(0);
                if (RamachandranComponent.selectedResidues.length != 0) {
                    resArray = RamachandranComponent.selectedResidues.slice(0);
                }
                if (residuesString == '') {
                    nodes = resArray.filter(function (residue) {
                        if (residue.prePro != true) return residue;
                    });
                } else if (residues.length > 1) {
                    nodes = resArray.filter(function (residue) {
                        return residues.indexOf(residue.aa) == -1;
                    });
                } else {
                    nodes = resArray.filter(function (residue) {
                        return residue.aa != residuesString;
                    });
                }
                nodes.forEach(function (residue) {
                    if (residue.idSelector == '') return;
                    var node = d3.select("#" + residue.idSelector);
                    if (makeInvisible) node.style('display', 'none');else node.style('display', 'block');
                    if (firstRun) {
                        d3.selectAll('line.rama-distance').each(function (line) {
                            if (line.templateResidue.authorResNum == residue.authorResNum) {
                                if (makeInvisible) d3.select("#" + line.id).style('display', 'none');else d3.select("#" + line.id).style('display', 'block');
                            }
                            // console.log(line);
                            // if (line.templateResidue.authorResNum == node.data()[0].authorResNum) {
                            //
                            // }
                        });
                        // console.log();
                    }
                });
            });
        }
        /**
         * clearContourCanvas
         */

    }, {
        key: "clearCanvas",
        value: function clearCanvas() {
            d3.select('#rama-canvas').empty();
            d3.selectAll('.contour-line').remove();
        }
    }, {
        key: "properties",
        get: function get() {
            return {
                pdbIds: {
                    type: Array,
                    reflectToAttribute: true,
                    notify: true,
                    observer: '_pdbIdsChanged'
                },
                chainsToShow: {
                    type: Array,
                    observer: '_chainsChanged',
                    reflectToAttribute: true,
                    notify: true
                },
                modelsToShow: {
                    type: Array,
                    observer: '_modelsChanged',
                    reflectToAttribute: true,
                    notify: true
                },
                width: {
                    type: Number,
                    reflectToAttribute: true
                }
            };
        }
    }]);

    return RamachandranComponent;
}(polymer_element_js_1.PolymerElement);

RamachandranComponent.rsrz = {};
RamachandranComponent.outliersType = {};
RamachandranComponent.residuesOnCanvas = {};
RamachandranComponent.ramachandranOutliers = {};
RamachandranComponent.sideChainOutliers = {};
RamachandranComponent.clashes = {};
RamachandranComponent.rsrzCount = {};
RamachandranComponent.favored = {};
RamachandranComponent.allowed = {};
RamachandranComponent.outliersList = {};
window.customElements.define('ramachandran-component', RamachandranComponent);
//# sourceMappingURL=RamachandranComponent.js.map