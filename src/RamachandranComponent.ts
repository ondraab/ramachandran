import * as d3 from 'd3';
import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import {cisPro, generalContour, gly, ileVal, prePro, transPro} from "../contours/HeatMapContours";
import {lineCisPro, lineGeneralContour, lineGly, lineIleVal, linePrePro, lineTransPro} from "../contours/LineContours";
import 'bootstrap/dist/css/bootstrap.css';
import '../public/ramachandran_style.css';
import '../public/hint.min.css'
import ParsePDB, {Dictionary} from "./parsePdb";
import {Residue} from "./Residue";
import {Molecule} from "./Molecule";
import {Chain} from "./Chain";
import {Model} from "./Model";
declare var require: any;

class RamachandranComponent extends PolymerElement {
    // containers
    private svgContainer;
    private static canvasContainer;

    // attributes
    // private pdbId: string;
    private chainsToShow;
    private modelsToShow;
    private ramaContourPlotType;
    private static contourColoringStyle;
    private residueColorStyle;
    private width;

    //helpers
    private modelsToShowNumbers;
    private pdbIds;
    private static parsedPdb;
    private xMap;
    private yMap;
    private dataGroup;
    private outliersTable;
    private lastSelection;

    private tooltip;
    private tooltip2;

    private static rsrz: {[pdbId: string]: {[id: number] : Dictionary}; } = {};
    private static outliersType: {[pdbId: string]: {[id: number] : Dictionary}; } = {};
    private static residuesOnCanvas: {[pdbId: string] : Residue[]} = {};
    private static ramachandranOutliers: {[pdbId: string] : number} = {};
    private static sideChainOutliers: {[pdbId: string] : number} = {};
    private static clashes: {[pdbId: string] : number} = {};
    private static rsrzCount: {[pdbId: string] : number} = {};
    private static selectedNode: Residue;

    private static favored: {[pdbId: string] : number; } = {};
    private static allowed: {[pdbId: string] : number; } = {};
    private static highlightedResidues: any[];

    private static width;
    private static height;
    private static hiddenResidues;
    private static selectedResidues;
    private static outliersList: {[pdbId: string] : Residue[]} = {};

    private static tooltipWidth;
    private static tooltipHeight;
    private static timeoutId;
    private static currentTime;
    private static lastTimeChanged;

    private static symbolTypes;


    static get properties() {
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
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();

        // noinspection JSSuspiciousNameCombination
        RamachandranComponent.height = this.width;
        RamachandranComponent.width = this.width;

        this.createChart = this.createChart.bind(this);
        this.fillColorFunction = this.fillColorFunction.bind(this);
        RamachandranComponent.parsedPdb = [];

        this.pdbIds.forEach((pdbId: string) => {
            const pdb = new ParsePDB(pdbId);
            pdb.downloadAndParse();
            RamachandranComponent.parsedPdb.push(pdb);
            RamachandranComponent.rsrz[pdbId] = pdb.rsrz;
            RamachandranComponent.outliersType[pdbId] = pdb.outlDict;
            RamachandranComponent.outliersList[pdbId] = [];
            RamachandranComponent.residuesOnCanvas[pdbId] = [];
            if (pdbId == '3us0')
            {
                this.pdbIds.push('3us0_redo');
                let pdbRedo = new ParsePDB(`${pdbId}_redo`);
                let json = require('./3us0.json');
                pdbRedo.parse(json[`${pdbId}_redo`]);
                RamachandranComponent.parsedPdb.push(pdbRedo);
                RamachandranComponent.rsrz[`${pdbId}_redo`] = pdb.rsrz;
                RamachandranComponent.outliersType[`${pdbId}_redo`] = pdb.outlDict;
                RamachandranComponent.outliersList[`${pdbId}_redo`] = [];
                RamachandranComponent.residuesOnCanvas[`${pdbId}_redo`] = [];
            }
        });

        RamachandranComponent.hiddenResidues = [];
        RamachandranComponent.selectedResidues = [];

        this.ramaContourPlotType = 1;
        RamachandranComponent.contourColoringStyle = 1;
        this.residueColorStyle = 1;

        this.modelsToShowNumbers = [];
        this.modelsToShow.map((d: any) => {
            this.modelsToShowNumbers.push(parseInt(d));
        });

        let objSize = 40;
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

    _pdbIdsChanged(newValue: string[], oldValue: string[]) {
        if (typeof oldValue == 'undefined' || newValue.length == 0)
            return;

        this.pdbIds.forEach((pdbId: string) => {
            const pdb = new ParsePDB(pdbId);
            pdb.downloadAndParse();
        });
        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);

        // d3.select('#rama-info-pdbid').text(this.pdbId.toUpperCase());
    }

    _chainsChanged(newValue: string[], oldValue: string[]) {
        if (typeof oldValue == 'undefined')
            return;

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);

        d3.select('#rama-info-chains').text(this.chainsToShow);
    }

    _modelsChanged(newValue: string[], oldValue: string[]){
        if (typeof oldValue == 'undefined')
            return;

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);
        d3.select('#rama-info-models').text(this.modelsToShow);
    }


    /**
     * creates basic chart, add axes, creates tooltip
     */
    public createChart() {
        let width = RamachandranComponent.width,
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
        const xScale = d3.scaleLinear()
            .domain([-180, 180])
            .range([0, (width)]);

        let xBottomAxis = d3.axisBottom(xScale);
        let xTopAxis = d3.axisTop(xScale);


        const xValue = (d) => d['phi'];

        this.xMap = (d) => xScale(xValue(d));

        // tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'rama-tooltip')
            .attr('height', 0)
            .style('opacity', 0);

        this.tooltip2 = d3.select('body').append('div')
            .attr('class', 'rama-tooltip')
            .attr('height', 0)
            .style('opacity', 0);

        // setup y
        const yScale = d3.scaleLinear()
            .domain([180, -180])
            .range([0, (height)]);
        let yLeftAxis = d3.axisLeft(yScale);

        let yRightAxis = d3.axisRight(yScale);
        const yValue = (d) => d['psi'];
        this.yMap = (d) => yScale(yValue(d));

        function makeYGridlines() {
            return d3.axisRight(yScale);
        }

        function makeXGridlines() {
            return d3.axisTop(xScale);
        }
        //
        this.svgContainer = d3.select('ramachandran-component').append('div')
            .attr('id', 'rama-svg-container')
            .style('max-width', `${width}px`)
            .style('width', '100%')
            .append('svg')
            .classed('svg-container', true)
            .attr('id', 'rama-svg')
            .style('max-width', `${width}px`)
            .style('width', '100%')
            .style('padding', '30px 30px 30px 50px')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .classed('svg-content-responsive', true)
            .style('overflow', 'visible');

        this.svgContainer.append("svg:defs").append("svg:marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 -5 10 10")
            .attr('refX', 8)
            .attr("markerWidth", 5)
            .attr("markerHeight", 5)
            .attr("orient", "auto")
            .style('fill', '#aa5519')
            .append("svg:path")
            .attr("d", "M0,-5L10,0L0,5");


        RamachandranComponent.canvasContainer = d3.select('#rama-svg-container')
            .append('canvas')
            .classed('img-responsive', true)
            .attr('id', 'rama-canvas')
            .attr('width', width)
            .style('max-width', `${width-90}px`)
            .attr('height', height)
            .classed('svg-content-responsive', true)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('overflow', 'visible');

        // // add axes

        this.svgContainer.append('g')
            .call(xTopAxis)
            .attr('id', 'x-axis');

        this.svgContainer.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(xBottomAxis)
            .attr('id', 'x-axis');

        this.svgContainer.append('g')
            .call(yLeftAxis)
            .attr('id', 'y-axis');

        this.svgContainer.append('g')
            .attr('transform', () => `translate(${width}, 0)`)
            .call(yRightAxis)
            .attr('id', 'y-axis');

        this.svgContainer.append('g')
            .attr('class', 'rama-grid')
            .attr('transform', `translate(0, ${height})`)
            .call(makeXGridlines()
                .tickSize(width));

        this.svgContainer.append('g')
            .attr('class', 'rama-grid')
            .call(makeYGridlines()
                .tickSize(height));

        // axis labels
        // phi label
        this.svgContainer.append('text')
            .attr('x', width / 2)
            .attr('y', height + 35)
            .style('text-anchor', 'middle')
            .style('fill', '#000')
            .text('\u03C6');

        // psi label
        this.svgContainer.append('text')
            // .attr('x',  0 - (height / 2))
            // .attr('y', -0)
            .attr('x', '-35')
            .attr('y', height/2)
            .style('text-anchor', 'middle')
            .style('fill', '#000')
            // .attr('transform', 'rotate(-90)')
            .text('\u03C8');

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

        let colorSelect = d3.select('#rama-settings').append('div').style('display', 'inline-block')
            .attr('class', 'rama-color-div')
            .style('width', '15%').style('margin-right', '8px')
            .classed('hint--right hint--multiline', true)
            .attr('data-hint', 'Select coloring of residues.\u000ADefault: residues are colored by regions.' +
                   '\u000AQuality: residues are colored by number of faults.\u000ARSRZ: Classifies RSRZ outliers, provides a ' +
                   'comparison\u000Ato the typical fit of a particular residue type for PDB\u000Astructures at that resolution.')
            .append('select').attr('id', 'rama-coloring')
            .attr('class', 'custom-select');

        colorSelect.append('option').attr('value', 1).text('Default');
        colorSelect.append('option').attr('value', 2).text('Quality');
        colorSelect.append('option').attr('value', 3).text('RSRZ');

        colorSelect.on('change', () => {
            this.residueColorStyle = parseInt(d3.select('#rama-coloring').property('value'));
            this.changeResiduesColors(this.residueColorStyle);
            this.addSummaryInfo();
        });

        let plotTypeSelect = d3.select('#rama-settings').append('div')
            .classed('hint--right hint--multiline2', true)
            .attr('data-hint', 'Select type of Ramachandran plot. For each plot, there are different ' +
                'contours.\u000AGeneral case: All residues are displayed.')
            .style('margin-right', '30px')
            .style('display', 'inline-block').style('width', '28%')
            .append('select').attr('id', 'rama-plot-type')
            .attr('class', 'custom-select');

        plotTypeSelect.append('option').attr('value', 1).text('General case');
        plotTypeSelect.append('option').attr('value', 2).text('Isoleucine and valine');
        plotTypeSelect.append('option').attr('value', 3).text('Pre-proline');
        plotTypeSelect.append('option').attr('value', 4).text('Glycine');
        plotTypeSelect.append('option').attr('value', 5).text('Trans proline');
        plotTypeSelect.append('option').attr('value', 6).text('Cis proline');

        plotTypeSelect.on('change', () => {
            this.ramaContourPlotType = parseInt(d3.select('#rama-plot-type').property('value'));
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers);
            RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
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

        let ramaForm = d3.select('#rama-settings').append('form')
            .attr('id', 'rama-contour-style')
            .style('position', 'absolute')
            .style('margin', '5px');
        ramaForm.append('input')
            .classed('form-check-input', true)
            .attr('type', 'radio')
            .attr('name', 'contour-style')
            .attr('value', 1)
            .attr('checked', true)
            .classed('rama-contour-radio', true);
        ramaForm.append('label').classed('rama-contour-style', true).text('Contour')
            .attr('class', 'hint--right')
            .attr('data-hint', 'Regions are displayed using lines.')
            .style('margin-bottom', '0');

        ramaForm.append('br');

        ramaForm.append('input')
            .classed('form-check-input', true)
            .attr('type', 'radio')
            .attr('name', 'contour-style')
            .attr('value', 2)
            .classed('rama-contour-radio', true);
        ramaForm.append('label').classed('rama-contour-style', true).text('Heat Map')
            .attr('class', 'hint--right')
            .attr('data-hint', 'Regions are displayed heat map.')
            .style('margin-bottom', '0');


        ramaForm.on('change', () => {
            RamachandranComponent.contourColoringStyle = parseInt(d3.select('input[name="contour-style"]:checked').property('value'));
            RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        });

        let chainsString = '';
        if (this.chainsToShow.length > 2) {
            for (const chain of this.chainsToShow) {
                chainsString += chain.toString() + ', ';
                if (this.chainsToShow.indexOf(chain) == this.chainsToShow.length -1)
                    chainsString.slice(0,-2);
                if (this.chainsToShow.indexOf(chain) == 2)
                {
                    chainsString += '...';
                    break;
                }
            }
        } else
            chainsString = this.chainsToShow.toString();

        let modelsString = '';
        if (this.modelsToShow.length > 2) {
            for (const model of this.modelsToShow) {
                modelsString += model.toString() + ', ';
                if (this.modelsToShow.indexOf(model) == this.modelsToShow.length -1)
                    modelsString.slice(0,-2);
                if (this.modelsToShow.indexOf(model) == 2)
                {
                    modelsString += '...';
                    break;
                }
            }
        } else
            modelsString = this.modelsToShow.toString();

        let entryInfo = d3.select('#rama-settings').append('div').style('display', 'inline-block')
            .style('position', 'absolute')
            .style('width', '25%').style('margin', '5px 5px 5px 95px');

        let chainsInfo = entryInfo.append('div');
        chainsInfo.attr('id', 'rama-info-chains')
            .append('b').text('Chains: ').style('margin-right', '5px');
        chainsInfo.append('text').text(chainsString)
            .attr('class', 'hint--top')
            .attr('data-hint', this.chainsToShow);

        let modelsInfo = entryInfo.append('div');
        modelsInfo.append('b').text('Models: ');
        modelsInfo.append('text').text(modelsString).style('text-align','center')
            .attr('class', 'hint--top').attr('data-hint', this.modelsToShow);

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers);
        RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        this.addEventListeners();
        d3.select('#rama-canvas')
            .style('max-width', `${width}px`)
            .style('width', '100.5%')
            .style('padding', '30px 30px 30px 50px')
    }


    /**
     * change residues in chart
     * @param {String[]} chainsToShow
     * @param {number} ramaContourPlotType
     * @param {number[]} modelsToShow
     */
    public updateChart(chainsToShow: String[], ramaContourPlotType: number, modelsToShow: number[]) {
        this.svgContainer.selectAll('.dataGroup').remove();

        this.pdbIds.forEach((pdbId: string) => {
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
        const { fillColorFunction, tooltip, residueColorStyle, width, svgContainer, tooltip2} = this;

        let { onMouseOutResidue, onMouseOverResidue } = this;


        // scales
        const xScale = d3.scaleLinear()
            .domain([-180, 180])
            .range([0, (width)]);
        // .range([0, (0.985 * width)]);

        const yScale = d3.scaleLinear()
            .domain([180, -180])
            .range([0, (width)]);

        // sort because of svg z-index
        // outliersText
        d3.selectAll('.outliers').remove();
        d3.selectAll('table').remove();


        function filterModels(pdb: ParsePDB) {
            let residues = [];
            pdb.molecules.forEach((molecule: Molecule) => {
                molecule.chains.forEach((chain: Chain) => {
                    if (chainsToShow.indexOf(chain.chainId) != -1) {
                        chain.models.forEach((model: Model) => {
                            if (modelsToShow.indexOf(model.modelId) != -1) {
                                model.residues.forEach((residue: Residue) => {
                                    residue.modelId = model.modelId;
                                    residue.chainId = chain.chainId;
                                    if (switchPlotType(residue) && residue.rama != null) {
                                        RamachandranComponent.residuesOnCanvas[residue.pdbId].push(residue);
                                        residues.push(residue);
                                    }
                                })
                            }
                        });
                    }});
            });
            return residues
        }

        /**
         * determines which residues will be displayed depending on ramaContourPlotType
         * @param residue
         * @returns {Residue}
         */
        function switchPlotType(residue: Residue) {
            switch (ramaContourPlotType) {
                case 1:
                    return residue;
                case 2:
                    if (residue.aa == 'ILE' || residue.aa == 'VAL') {
                        return residue;
                    }
                    break;
                case 3:
                    if (residue.prePro)
                        return residue;
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

        let rsrz = RamachandranComponent.parsedPdb[0].rsrz;
        let outliersType = RamachandranComponent.parsedPdb[0].outlDict;

        let templatePdbResidues = filterModels(RamachandranComponent.parsedPdb[0]).sort((residue1: Residue, residue2: Residue) => {
            if (typeof rsrz[residue1.num] != 'undefined') {
                return 1;
            }else if (typeof rsrz[residue2.num] != 'undefined') {
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
        let templatePdb = this.pdbIds[0];

        function deselectNode(node: Residue) {
            RamachandranComponent.selectedNode = null;
            d3.select(`#${node.idSelector}`)
                .attr('d', (residue: Residue) => RamachandranComponent.changeObjectSize(residue, true))
                .style('fill', node.residueColor)
                .style('opacity', 1);
        }

        function selectNode(node: Residue) {
            RamachandranComponent.selectedNode = node;
            d3.select(`#${node.idSelector}`)
                .attr('d', (residue: Residue) => RamachandranComponent.changeObjectSize(residue, false))
                .style('fill', 'magenta')
                .style('opacity', 1);
        }

        function addResiduesToCanvas(residues: Residue[]) {
            svgContainer.selectAll('.shapes')
                .data(residues)
                .enter()
                .append('g')
                .attr('class', 'dataGroup')
                .append('path')
                .attr('id', (residue: Residue) => {
                    const id = `${residue.aa}-${residue.chainId}-${residue.modelId}-${residue.authorResNum}-${residue.pdbId}`;
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
                })

                .attr('d', (residue: Residue) => {
                    if (residue.aa === 'GLY') {
                        return RamachandranComponent.symbolTypes.triangle();
                    }
                    return RamachandranComponent.symbolTypes.circle();
                })
                .attr('transform', (residue: Residue) => `translate(${xScale(residue.phi)},${yScale(residue.psi)})`)
                .merge(svgContainer)
                // .style('fill', 'transparent')
                .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                // .style('stroke', 'rgb(144, 142, 123)')
                .style('opacity', (residue: Residue) => {
                    return RamachandranComponent.computeOpacity(fillColorFunction(residue, residueColorStyle))
                })
                .on('mouseover', function(node: Residue) {
                    if (d3.select(this).node().style.opacity == 0)
                        return;

                    onMouseOverResidue(node, ramaContourPlotType, residueColorStyle, tooltip, true);

                })
                .on('mouseout', function(node: Residue) {
                        if (d3.select(this).node().style.opacity == 0)
                            return;

                        window.clearTimeout(RamachandranComponent.timeoutId);

                        onMouseOutResidue(node, ramaContourPlotType, residueColorStyle, tooltip, true)
                    }
                )
                .on('click', function (node: Residue) {
                    if(node == RamachandranComponent.selectedNode)
                        deselectNode(node);
                    else
                        selectNode(node);
                })
        }

        addResiduesToCanvas(templatePdbResidues);

        let otherResidues = [];
        RamachandranComponent.parsedPdb.forEach((pdb: ParsePDB, index: number) => {
            if (index < 1)
                return;
            otherResidues = otherResidues.concat(filterModels(pdb));
        });

        addResiduesToCanvas(otherResidues);


        function getDistance(point1: any, point2: any) {
            let xs = xScale(point1.phi) - xScale(point2.phi);
            xs = xs * xs;

            let ys = yScale(point1.psi) - yScale(point2.psi);
            ys = ys * ys;
            return Math.sqrt(xs+ys);
        }

        let distantResidues = [];
        RamachandranComponent.residuesOnCanvas[templatePdb].forEach((residue: Residue) => {
            this.pdbIds.forEach((pdbId: string, index: number) => {
                if (index < 1)
                    return;
                let templateResidue: any = d3.select(`#${residue.idSelector.replace(residue.pdbId, pdbId)}`);
                if (!templateResidue.empty()){
                    let residue2: any = d3.select(`#${residue.idSelector}`).data()[0];
                    if (templateResidue.data()[0].rama != residue2.rama)
                    // let distance = getDistance(templateResidue.data()[0], residue2);
                    // if (distance > 80)
                    {
                        distantResidues.push({templateResidue: residue2, otherResidue: templateResidue.data()[0],
                            id: `rama-line-${residue2.authorResNum}-${residue2.chainId}`});
                    }
                }
            })
        });

        svgContainer.selectAll('line.rama-distance')
            .data(distantResidues)
            .enter()
            .append('g')
            .classed('dataGroup', true)
            .append('line')
            .attr('id', (d: any) => {
                return d.id;
            })
            .attr('class', 'rama-distance')
            .attr('x1', (d: any) => {
                return xScale(d.templateResidue.phi);
            })
            .attr('y1', (d: any) => {
                return yScale(d.templateResidue.psi);
            })
            .attr('y2', (d: any) => {
                return yScale(d.otherResidue.psi);
            })
            .attr('x2', (d: any) => {
                return xScale(d.otherResidue.phi);
            })
            .attr("stroke-width", 2.5)
            .attr("stroke", "#aa5519")
            .attr("marker-end", "url(#arrow)")
            .attr('opacity', '0.1')
            .on('mouseover', function (node: any) {
                onMouseOverResidue(node.templateResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                onMouseOverResidue(node.otherResidue, ramaContourPlotType, residueColorStyle, tooltip2, false);
                tooltip.transition()
                    .style('opacity', .95)
                    .style('left', xScale(node.templateResidue.phi) -50 + 'px')
                    .style('top', yScale(node.templateResidue.psi) +45 + 'px')
                    .style('height', RamachandranComponent.tooltipHeight)
                    .style('width', String(RamachandranComponent.tooltipWidth) + 'px');

                tooltip2.transition()
                    .style('opacity', .95)
                    .style('left', xScale(node.otherResidue.phi) -30 + 'px')
                    .style('top', yScale(node.otherResidue.psi) +30 + 'px')
                    .style('height', RamachandranComponent.tooltipHeight)
                    .style('width', String(RamachandranComponent.tooltipWidth) + 'px');

                d3.select(this).attr("stroke-width", 3)
                    .attr('opacity', '0.8');

            })
            .on('mouseout', function (node: any) {
                window.clearTimeout(RamachandranComponent.timeoutId);
                onMouseOutResidue(node.templateResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                onMouseOutResidue(node.otherResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                tooltip.transition()
                    .style('opacity', 0);
                tooltip2.transition()
                    .style('opacity', 0);

                d3.select(this).attr("stroke-width", 2.5)
                    .attr('opacity', '0.1');
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
        this.pdbIds.forEach((pdbId: string) => {
            RamachandranComponent.outliersList[pdbId].sort((residue1: Residue, residue2: Residue) => residue1.num - residue2.num);
        });


        this.addSummaryInfo();

    }


    /**
     * add baseContours
     * @param {number} ramaContourPlotType
     * @param {number} contourColorStyle
     */
    static baseContours(ramaContourPlotType: number, contourColorStyle: number) {
        RamachandranComponent.clearCanvas();

        let width = RamachandranComponent.width,
            height = RamachandranComponent.height;

        const img = new Image();
        const svgImg = new Image();
        switch (ramaContourPlotType) {
            case 1:
                img.src = generalContour;
                svgImg.src = lineGeneralContour;
                break;
            case 2:
                img.src = ileVal;
                svgImg.src = lineIleVal;
                break;
            case 3:
                img.src = prePro;
                svgImg.src = linePrePro;
                break;
            case 4:
                img.src = gly;
                svgImg.src = lineGly;
                break;
            case 5:
                img.src = transPro;
                svgImg.src = lineTransPro;
                break;
            case 6:
                img.src = cisPro;
                svgImg.src = lineCisPro;
                break;
            default:
                return;
        }

        const context = RamachandranComponent.canvasContainer.node().getContext('2d');
        context.clearRect(0, 0, width + 80, height + 60);
        if (contourColorStyle == 2) {
            context.globalAlpha = 0.6;
            img.onload = () => {
                context.drawImage(img, 0, 0,
                    width, height * img.height / img.width
                );
            };
        } else {
            context.globalAlpha = 1;
            svgImg.onload = () => {
                context.drawImage(svgImg, 0, 0,
                    width, height * svgImg.height / svgImg.width
                );
            };
        }
    }


    /**
     * add listeners from other components
     */
    public addEventListeners() {
        const clickEvents = ['PDB.litemol.click', 'PDB.topologyViewer.click'];
        const mouseOutEvents = ['PDB.topologyViewer.mouseout', 'PDB.litemol.mouseout'];
        let scrollTimer, lastScrollFireTime = 0;

        const {fillColorFunction, residueColorStyle} = this;


        /**
         * unhighlight residue from event
         * @param event
         */
        function unHighlightObject(event: any) {
            if (typeof event.eventData != 'undefined') {
                if (RamachandranComponent.highlightedResidues.indexOf(getResidueNode(event)) == -1) {
                    d3.select('.selected-res')
                        .classed('selected-res', false)
                        .attr('d', (residue: Residue) => RamachandranComponent.changeObjectSize(residue)).transition().duration(50)
                        .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                        .style('display', 'block');
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
        function onClick(event: any) {
            const res = getResidueNode(event);
            if (RamachandranComponent.highlightedResidues.length != 0) {
                RamachandranComponent.highlightedResidues.forEach((node: any) => {
                    node.attr('d', (residue: Residue) => RamachandranComponent.changeObjectSize(residue)).transition().duration(50)
                        .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                        .style('display', 'block');
                    // .style('opacity', (d) => {
                    //     return RamachandranComponent.computeOpacity(fillColorFunction(d, drawingType, outliersType, rsrz))
                    // });
                });
                RamachandranComponent.highlightedResidues.pop();
            }
            RamachandranComponent.highlightedResidues.push(res);
            getResidueNode(event).attr('d', (residue: Residue) => RamachandranComponent.changeObjectSize(residue, false))
                .classed('selected-res', false)
                .style('fill', 'magenta')
                .style('opacity', '1');
        }


        /**
         * return residue node from event
         * @param event
         * @returns {Selection}
         */
        function getResidueNode(event: any) {
            if (typeof event.eventData.chainId == 'undefined')
                return null;
            return d3.select('path#' +
                event.eventData.residueName + '-' +
                event.eventData.chainId + '-' +
                event.eventData.entityId + '-' +
                event.eventData.residueNumber);
        }


        /**
         * highlight residue from event
         * @param event
         */
        function highLightObject(event: any) {
            let res = getResidueNode(event);
            if (res) {
                res.attr('d', (d: any) => RamachandranComponent.changeObjectSize(d, false))
                    .classed('selected-res', true)
                    .style('fill', 'yellow')
                    .style('opacity', '1');
                // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
            }

        }

        window.addEventListener('PDB.topologyViewer.mouseover', (event: any) => {
            const minMouseOverTime = 150;
            let now = new Date().getTime();

            function mouseOver(event: any) {
                if (typeof event.eventData != 'undefined') {
                    let res = getResidueNode(event);
                    if (res) {
                        if (res.attr('style').includes('magenta')) {
                            return;
                        }
                    }
                    unHighlightObject(event);
                    highLightObject(event);
                }
                else {
                    unHighlightObject(event);
                }
            }

            if (!scrollTimer) {
                if (now - lastScrollFireTime > (3 * minMouseOverTime)) {
                    mouseOver(event);   // fire immediately on first scroll
                    lastScrollFireTime = now;
                }
                scrollTimer = setTimeout(function() {
                    scrollTimer = null;
                    lastScrollFireTime = new Date().getTime();
                    mouseOver(event);
                }, minMouseOverTime);
            }
        });
        window.addEventListener('PDB.litemol.mouseover', (event: any) => {
            if (typeof event.eventData != 'undefined') {
                let res = getResidueNode(event);
                if (res) {
                    if (res.attr('style').includes('magenta')) {
                        return;
                    }
                }
                unHighlightObject(event);
                highLightObject(event);
            }
            else {
                unHighlightObject(event);
            }
        });

        window.addEventListener('protvista.click', (d:any) => {
            RamachandranComponent.hiddenResidues.forEach((residue: Residue) => {
                if (residue.idSelector != ''){
                    d3.select(`#${residue.idSelector}`)
                        .style('visibility', 'visible');
                }
            });

            if (this.lastSelection == d.detail){
                RamachandranComponent.hiddenResidues = [];
                RamachandranComponent.selectedResidues = [];
                this.lastSelection = {};
                return;
            }

            this.lastSelection = d.detail;
            this.pdbIds.forEach((pdbId: string) => {
                RamachandranComponent.hiddenResidues = RamachandranComponent.residuesOnCanvas[pdbId].filter((residue: Residue) => {
                    if (!(residue.authorResNum >= this.lastSelection.begin && residue.authorResNum <= this.lastSelection.end))
                        return residue;
                    else RamachandranComponent.selectedResidues.push(residue);
                });
            });

            RamachandranComponent.hiddenResidues.forEach((residue: Residue) => {
                if (residue.idSelector != '') {
                    if (d3.select(`#${residue.idSelector}`).empty()){
                        return
                    }
                    d3.select(`#${residue.idSelector}`).style('visibility', 'hidden');
                }
            });
        });


        /**
         * add event listeners
         */
        clickEvents.forEach((type: string) => {
            window.addEventListener(type, (event: any) => {
                onClick(event);
            });
        });

        mouseOutEvents.forEach((type: string) => {
            window.addEventListener(type, (event: any) => {
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
    public addSummaryInfo() {
        d3.selectAll('.rama-sum-table').remove();
        d3.select('#rama-sum').append('table').classed('rama-sum-table', true).append('tr')
            .classed('rama-sum-table-headline', true).append('th')
            .text('PDB');

        switch (this.residueColorStyle){
            case 1:
                d3.select('.rama-sum-table-headline').append('th').text('Preferred regions')
                    .attr('class', 'hint--top')
                    .attr('data-hint', 'Regions with the most favorable combinations of \u03C6 ' +
                        'and \u03C8 combination.');
                d3.select('.rama-sum-table-headline').append('th').text('Allowed regions')
                    .attr('class', 'hint--top')
                    .attr('data-hint', 'Regions with allowed combinations of \u03C6 and \u03C8 combination.');
                d3.select('.rama-sum-table-headline').append('th').text('Outliers')
                    .attr('class', 'hint--top')
                    .attr('data-hint', 'Regions with disallowed combinations of \u03C6 and \u03C8 combination.');
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

        RamachandranComponent.parsedPdb.forEach((pdb: ParsePDB) => {
            let resArrayLength = RamachandranComponent.residuesOnCanvas[pdb.pdbID].length;
            if (resArrayLength == 0)
                resArrayLength = 1;

            switch (this.residueColorStyle){
                case 1:
                    d3.select('.rama-sum-table').append('tr')
                        .classed(`table-row-${pdb.pdbID}`, true).append('td').text(pdb.pdbID);

                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(RamachandranComponent.favored[pdb.pdbID])} 
                        (${String((RamachandranComponent.favored[pdb.pdbID] /
                            resArrayLength * 100)
                            .toFixed(0))} %)`);

                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(RamachandranComponent.allowed[pdb.pdbID])} 
                        (${String((RamachandranComponent.allowed[pdb.pdbID] /
                            resArrayLength * 100)
                            .toFixed(0))} %)`);

                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(RamachandranComponent.outliersList[pdb.pdbID].length)} 
                        (${String((RamachandranComponent.outliersList[pdb.pdbID].length / 
                            resArrayLength * 100).toFixed(0))} %)`);
                    break;

                case 2:
                    d3.select('.rama-sum-table').append('tr').classed(`table-row-${pdb.pdbID}`, true)
                        .append('td').text(pdb.pdbID);

                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(RamachandranComponent.ramachandranOutliers[pdb.pdbID])} 
                        (${String((RamachandranComponent.ramachandranOutliers[pdb.pdbID] / resArrayLength * 100)
                            .toFixed(0))} %)`);

                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(RamachandranComponent.sideChainOutliers[pdb.pdbID])} 
                        (${String((RamachandranComponent.sideChainOutliers[pdb.pdbID] 
                            / resArrayLength * 100)
                            .toFixed(0))} %)`);

                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(RamachandranComponent.clashes[pdb.pdbID])} 
                        (${String((RamachandranComponent.clashes[pdb.pdbID] / resArrayLength * 100)
                            .toFixed(0))} %)`);
                    break;

                case 3:
                    d3.select('.rama-sum-table').append('tr')
                        .classed(`table-row-${pdb.pdbID}`, true)
                        .append('td').text(pdb.pdbID);
                    d3.select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String((RamachandranComponent.rsrzCount[pdb.pdbID]))} 
                        (${String((RamachandranComponent.rsrzCount[pdb.pdbID]
                            / resArrayLength * 100).toFixed(0))} %)`);
            }
        });
    }


    /**
     * compute summary stats of ramachandran diagram
     * @param residue
     */
    static computeStats(residue: Residue) {
        if (RamachandranComponent.outliersType[residue.pdbId][residue.num] != undefined) {
            let outlTypeHelper: any = RamachandranComponent.outliersType[residue.pdbId][residue.num].outliersType;
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


    /**
     * return fillColor which will be used
     * @param residue - one residue
     * @param {number} drawingType Default - 1/Quality - 2/ RSRZ - 3
     * @returns {string} hex of color
     */
    public fillColorFunction(residue: Residue, drawingType: number) {
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
    public static computeOpacity(fillColor: string) {
            if (fillColor == '#008000')
                return 0.5;
            if (fillColor == 'black' || fillColor == '#000')
                return 0.15;
            if (fillColor == '#ff0')
                return 0.8;
            return 1;
    }


    /**
     * return timeoutid when hovering
     * @param {number} ramaContourPlotType
     * @param {string} aa
     * @returns {number}
     */
    static getTimeout(ramaContourPlotType: number, aa: string = '') {
        return window.setTimeout( () => {
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
    static dispatchCustomEvent(name: string, residue: Residue, pdbId: string) {
        const event = new CustomEvent(name, {detail: {
                chainId: residue.chainId,
                entityId: residue.modelId,
                entry: pdbId,
                residueName: residue.aa,
                residueNumber: residue.authorResNum}});
        window.dispatchEvent(event);
    }

    /**
     * function for change contours after mouseout or mouseover
     * @param residue selected node
     * @param toDefault true if used for return to base state
     * @param ramaContourPlotType
     */
    static changeContours(residue: Residue, toDefault: boolean = true, ramaContourPlotType: number) {
        RamachandranComponent.currentTime = new Date().getTime();
        switch (residue.aa) {
            case 'ILE':
            case 'VAL':
                if (ramaContourPlotType != 2) {
                    if (toDefault){
                        RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                        RamachandranComponent.changeOpacity('VAL,ILE', false);
                    } else {
                        RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(2, 'VAL,ILE');
                    }
                }
                return;
            case 'GLY':
                if (ramaContourPlotType != 4) {
                    if (toDefault){
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
                    }
                    else {
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
    static tooltipText(residue: Residue) {
        // language=HTML
        return  `<b>${residue.pdbId.toUpperCase()}<br>${residue.chainId} ${residue.authorResNum} ${residue.aa}</b><br/>\u03C6: ${residue.phi}<br/>\u03C8: ${residue.psi}`;
    }


    /**
     * change object size on hover
     * @param residue
     * @param {boolean} smaller
     * @returns {string | null}
     */
    static changeObjectSize(residue: Residue, smaller: boolean = true) {
        let objSize = 40;
        if (window.screen.availWidth < 1920) {
            objSize = 30;
        }
        if (window.screen.width < 350) {
            objSize = 5;
        }
        let size = 175;
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


    /**
     *
     * @param residue
     * @param {number} ramaContourPlotType
     * @param {number} residueColorStyle
     * @param tooltip
     * @param changeCont
     */
    public onMouseOverResidue(residue: Residue, ramaContourPlotType: number, residueColorStyle: number,
                              tooltip: any, changeCont: boolean){
        let highlightColor = residue.residueColor;
        if (residue.residueColor == '#000')
            highlightColor = 'yellow';
        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOver', residue, residue.pdbId);
        if (changeCont)
            RamachandranComponent.changeContours(residue, false, ramaContourPlotType);
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
                const outliersType = RamachandranComponent.outliersType[residue.pdbId];
                let tempStr = '';

                if (typeof outliersType[residue.num] === 'undefined') {
                    tooltip.html(RamachandranComponent.tooltipText(residue));
                    break;
                }
                let outlierTypeHelper: any = outliersType[residue.num].outliersType;
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
            tooltip.transition()
                .style('opacity', .95)
                .style('left', (d3.event.pageX + 10) + 'px')
                .style('top', (d3.event.pageY - 48) + 'px')
                .style('height', RamachandranComponent.tooltipHeight)
                .style('width', String(RamachandranComponent.tooltipWidth) + 'px');

        }
        d3.select(`#${residue.idSelector}`)
            .attr('d', (residue: Residue) => RamachandranComponent.changeObjectSize(residue, false))
            .style('fill', highlightColor)
            .style('opacity', 1);
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
    public onMouseOutResidue(residue: Residue, ramaContourPlotType: number, residueColorStyle: number,
                             tooltip: any, changeCount: boolean) {
        let outTime = new Date().getTime();

        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOut', residue, residue.pdbId);
        if (RamachandranComponent.highlightedResidues.indexOf(residue) > -1) {
            return;
        }

        if (residue == RamachandranComponent.selectedNode) {
            d3.select(`#${residue.idSelector}`)
                .transition()
                .style('fill', 'magenta');
        }
        else {
            d3.select(`#${residue.idSelector}`)
                .transition()
                .attr('d', (dat: any) => RamachandranComponent.changeObjectSize(dat))
                .style('opacity', () => {
                    return RamachandranComponent.computeOpacity(residue.residueColor)
                })
                .style('fill', residue.residueColor);

        }

        // d3.select(`#${residue.idSelector}`)
        //     .transition()
        //     .attr('d', (dat: any) => RamachandranComponent.changeObjectSize(dat))
        //     .style('fill', color)
        //     .style('opacity', () => {
        //         return RamachandranComponent.computeOpacity(residue.residueColor)
        //     });


        if (changeCount) {
            tooltip.transition()
                .style('opacity', 0);
            if ((outTime - RamachandranComponent.currentTime) > 600) {
                window.setTimeout(() => {
                    RamachandranComponent.changeContours(residue, true, ramaContourPlotType)
                }, 50);
            }
        }
    }


    /**
     * change residue coloring
     * @param {number} residueColorStyle
     */
    public changeResiduesColors(residueColorStyle: number) {

        let {tooltip, onMouseOverResidue, ramaContourPlotType,
            onMouseOutResidue} = this;

        this.pdbIds.forEach((pdbId: string) => {
            let resArray = RamachandranComponent.residuesOnCanvas[pdbId];
            if (RamachandranComponent.selectedResidues.length != 0) {
                resArray = RamachandranComponent.selectedResidues.slice(0)
            }
            resArray.forEach((residue: Residue) => {
                if (residue.idSelector != '') {
                    const node = d3.select(`#${residue.idSelector}`);
                    node.style('fill', this.fillColorFunction(residue, residueColorStyle));
                    node.style('opacity', (residue: Residue) => {
                        return RamachandranComponent.computeOpacity(this.fillColorFunction(residue, residueColorStyle))
                    });
                    node.on('mouseover', function () {
                        if (d3.select(`#${residue.idSelector}`).style('opacity')== '0')
                            return;
                        onMouseOverResidue(residue, ramaContourPlotType, residueColorStyle, tooltip, true)

                    });

                    node.on('mouseout', function () {
                        if (d3.select(`#${residue.idSelector}`).style('opacity')== '0')
                            return;
                        window.clearTimeout(RamachandranComponent.timeoutId);

                        onMouseOutResidue(residue, ramaContourPlotType, residueColorStyle, tooltip, true)

                    })
                }
            })
        })
    }


    /**
     * sort json object to that it can be better displayed
     * @param jsonObject
     * @param {number} drawingType
     * @param {Dictionary} outliersType
     * @param {Dictionary} rsrz
     */
    public sortJson(jsonObject: any, drawingType: number, outliersType: Dictionary, rsrz: Dictionary){
        jsonObject.sort((a: any, b: any) => {
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
                    }else if (typeof rsrz[b.num] != 'undefined') {
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
    static changeOpacity(residuesString: string, makeInvisible: boolean = true) {
        let residues = residuesString.split(',');
        let nodes;

        /**
         * filter residues and hide unwanted residues and lines
         */
        RamachandranComponent.parsedPdb.forEach((pdb: ParsePDB) => {
            let resArray = RamachandranComponent.residuesOnCanvas[pdb.pdbID].slice(0);

            if (RamachandranComponent.selectedResidues.length != 0) {
                resArray = RamachandranComponent.selectedResidues.slice(0)
            }
            if (residuesString == '')
            {
                nodes = resArray.filter((residue: Residue) => {

                    if (residue.prePro != true)
                        return residue;
                })

            } else if (residues.length > 1) {
                nodes = resArray.filter((residue: Residue) => {
                    return (residues.indexOf(residue.aa) == -1)
                });

            } else {
                nodes = resArray.filter((residue: Residue) => {
                    return (residue.aa != residuesString);
                });
            }
            nodes.forEach((residue: Residue) => {
                if (residue.idSelector == '')
                    return;
                let node = d3.select(`#${residue.idSelector}`);
                let line = d3.select(`#rama-line-${residue.authorResNum}-${residue.chainId}`);
                if (makeInvisible) {
                    node.style('display', 'none');
                    if (!line.empty())
                        line.style('display', 'none')
                } else {
                    node.style('display', 'block');
                    if (!line.empty())
                        line.style('display', 'block')
                }
            })
        });
    }


    /**
     * clearContourCanvas
     */
    public static clearCanvas() {
        d3.select('#rama-canvas').empty();
        d3.selectAll('.contour-line').remove();
    }


    /**
     * add outliers table
     */
    public addTable(){
        this.outliersTable = d3.select('.outliers-container').append('div')
            .attr('class', 'outliers').append('table')
            .attr('class', 'table table-hover table-responsive');

        d3.select('.outliers-container').append('table')
            .attr('class', 'rama-outliers-table').append('thead').append('tr').attr('id', 'tab-headline');
        d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('Chain')
            .style('width', '30%').style('min-width', '50px').style('text-align', 'right');
        d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('ID')
            .style('width', '30%').style('min-width', '50px').style('text-align', 'right');
        d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('AA')
            .style('width', '30%').style('min-width', '50px').style('text-align', 'right');
        d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('Phi')
            .style('width', '30%').style('min-width', '50px').style('text-align', 'right');
        d3.select('#tab-headline').append('th').attr('class', 'rama-table-headline').text('Psi')
            .style('width', '30%').style('min-width', '50px').style('text-align', 'right');
    }


    /**
     * fill outliers table
     * @param {any[]} sortedTable
     * @param {number} drawingType
     */
    public fillTable(sortedTable: any[], drawingType: number) {
        let objSize = 40;
        const { fillColorFunction } = this;
        if (window.screen.availWidth < 1920) {
            objSize = 30;
        }
        if (window.screen.width < 350) {
            objSize = 5;
        }

        const symbolTypes = {
            circle: d3.symbol().type(d3.symbolCircle).size(30),
            triangle: d3.symbol().type(d3.symbolTriangle).size(30)

        };

        const rows = this.outliersTable.selectAll('tbody tr')
            .data(sortedTable, (d) => d.num);

        rows.enter()
            .append('tr')
            .on('mouseover', function(d: any) {
                d3.select(this)
                    .style('background-color', '#b4bed6')
                    .style('cursor', 'pointer');
                d3.select('#' + '-' + d.chainId + '-' + d.modelId + '-' + d.num)
                    .attr('d', (dat: any) => {
                        if (dat.aa === 'GLY') {
                            symbolTypes.triangle.size(175);
                            return symbolTypes.triangle();
                        }
                        symbolTypes.circle.size(175);
                        return symbolTypes.circle();
                    })
                    .style('fill', (residue: Residue) => fillColorFunction(residue, drawingType));
            })
            //
            .on('mouseout', function(residue: Residue) {
                d3.select(this)
                    .style('background-color', 'transparent')
                    .style('cursor', 'default');
                // d3.select('#' +  d.aa + '-' + d.chainId + '-' + d.modelId + '-' + d.num + d.pdbId)
                d3.select(`#${residue.aa}-${residue.chainId}-${residue.modelId}-${residue.num}-${residue.pdbId}`)
                    .transition()
                    // .duration(50)
                    .attr('d', (dat: any) => {
                        if (dat.aa === 'GLY') {
                            symbolTypes.triangle.size(objSize);
                            return symbolTypes.triangle();
                        }
                        symbolTypes.circle.size(objSize);
                        return symbolTypes.circle();
                    })
                    .style('fill', (residue: Residue) => fillColorFunction(residue, drawingType))
                    .style('fillColorFunction-width', '0.5');
            })
            .selectAll('td')
            .data((d) => [d.chainId, d.num, d.aa, d.phi, d.psi])
            .enter()
            .append('td')
            .attr('id', 'rama-td')
            .style('width', '30%')
            .style('min-width', '50px')
            .style('text-align', 'right')
            .text((d) => d);

        rows.exit().remove();
        //
        const cells = rows.selectAll('td')
            .data((d) => [d.chainId, d.num, d.aa, d.phi, d.psi])
            .text((d) => d);
        //
        cells.enter()
            .append('td')
            .text((d) => d);

        cells.exit().remove();
    }
}

window.customElements.define('ramachandran-component', RamachandranComponent);