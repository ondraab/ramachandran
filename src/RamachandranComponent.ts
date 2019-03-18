import * as d3 from 'd3';
import {PolymerElement} from '@polymer/polymer/polymer-element.js'
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
import {html} from "d3";
declare var require: any;

class RamachandranComponent extends PolymerElement {
    // containers
    private svgContainer;
    private canvasContainer;

    // attributes
    // private pdbId: string;
    private chainsToShow;
    private modelsToShow;
    private ramaContourPlotType;
    private contourColoringStyle;
    private residueColorStyle;
    private width;

    //helpers
    private modelsToShowNumbers;
    private pdbIds;
    private parsedPdb;
    private xMap;
    private yMap;
    private dataGroup;
    private outliersTable;
    private lastSelection;

    private tooltip;
    private tooltip2;

    private rsrz: {[pdbId: string]: {[id: number] : Dictionary}; } = {};
    private outliersType: {[pdbId: string]: {[id: number] : Dictionary}; } = {};
    private residuesOnCanvas: {[pdbId: string] : Residue[]} = {};
    private ramachandranOutliers: {[pdbId: string] : number} = {};
    private sideChainOutliers: {[pdbId: string] : number} = {};
    private clashes: {[pdbId: string] : number} = {};
    private rsrzCount: {[pdbId: string] : number} = {};
    private selectedNode: Residue;

    private favored: {[pdbId: string] : number; } = {};
    private allowed: {[pdbId: string] : number; } = {};
    private highlightedResidues: any[];

    private static width;
    private static height;
    private hiddenResidues;
    private selectedResidues;
    private outliersList: {[pdbId: string] : Residue[]} = {};

    private tooltipWidth;
    private tooltipHeight;
    private timeoutId;
    private currentTime;
    private lastTimeChanged;

    private symbolTypes;

    private resNumDifference;


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
        this.parsedPdb = [];

        this.pdbIds.forEach((pdbId: string) => {
            const pdb = new ParsePDB(pdbId);
            pdb.downloadAndParse();
            this.parsedPdb.push(pdb);
            this.rsrz[pdbId] = pdb.rsrz;
            this.outliersType[pdbId] = pdb.outlDict;
            this.outliersList[pdbId] = [];
            this.residuesOnCanvas[pdbId] = [];
            if (pdbId == '3us0')
            {
                this.pdbIds.push('3us0_redo');
                let pdbRedo = new ParsePDB(`${pdbId}_redo`);
                let json = require('./3us0.json');
                pdbRedo.parse(json[`${pdbId}_redo`]);
                this.parsedPdb.push(pdbRedo);
                this.rsrz[`${pdbId}_redo`] = pdb.rsrz;
                this.outliersType[`${pdbId}_redo`] = pdb.outlDict;
                this.outliersList[`${pdbId}_redo`] = [];
                this.residuesOnCanvas[`${pdbId}_redo`] = [];
            }
        });

        this.hiddenResidues = [];
        this.selectedResidues = [];

        this.ramaContourPlotType = 1;
        this.contourColoringStyle = 1;
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
        this.symbolTypes = {
            circle: d3.symbol().type(d3.symbolCircle).size(objSize),
            triangle: d3.symbol().type(d3.symbolTriangle).size(objSize)
        };

        this.timeoutId = 0;
        this.currentTime = 0;
        this.lastTimeChanged = 0;


        this.highlightedResidues = [];
        this.createChart();

        this.lastSelection = {};

        this.tooltipHeight = 58;
        this.tooltipWidth = 90;
    }

    _pdbIdsChanged(newValue: string[], oldValue: string[]) {
        if (typeof oldValue == 'undefined' || typeof newValue == 'undefined')
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
        // @ts-ignore
        d3.select(this).select('#rama-info-chains').text(this.chainsToShow);
    }

    _modelsChanged(newValue: string[], oldValue: string[]){
        if (typeof oldValue == 'undefined')
            return;

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);
        // @ts-ignore
        d3.select(this).select('#rama-info-models').text(this.modelsToShow);
    }


    /**
     * creates basic chart, add axes, creates tooltip
     */
    public createChart() {
        let self = this;
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

        // @ts-ignore
        this.svgContainer = d3.select(this).append('div')
            .attr('id', 'rama-svg-container')
            .style('max-width', `${width}px`)
            .style('background', 'white')
            .style('width', '100%')
            .append('svg')
            .classed('svg-container', true)
            .attr('id', 'rama-svg')
            .style('max-width', `${width}px`)
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

        // @ts-ignore
        const overlayHelp = d3.select(this).select('#rama-svg-container').append('div').attr('id', 'rama-overlay-help')
            .style('width', `${width}px`).style('height', `${height}px`)
            .append('div').style('color', '#DCECD7').style('padding', '5px').html(`
                <h1>Ramachandran component</h1>
                <p>This component can be used for analysing proteis. It is interactiver Ramachandran plot</p>
                <h4>Coloring of residues</h4>
                <p>Default: residues are colored by regions. There are 3 types of regions: Favored, Allowed and <b>Outlier</b>.
                The most interesting are outliers. It says, that the combination of \u03C6 and \u03C8 angles has got low probability.
                Outlier residues are colored red, other grey.
                </p>
                <p>Quality: residues are colored according to number of problems detected on residue. 
                The problems may be classified as clashes, sidechain outliers and RSRZ outliers.
                If there is not any problem the residues are colored green, residues with one problem are colored yellow, 
                residues with two problems are colored orange and residue with all three types of problems are colored red. </p>
                <p>RSRZ: Residues are colored red, if they are classified as RSRZ outlier. The RSRZ is a normalisation 
                of real-space R-value (RSR) specific to a residue type and a resolution bin. 
                A residue is considered an RSRZ outlier if its RSRZ value is greater than 2.</p>
                <h4>Type of contours:</h4>
                <p>Contours are computed from database Top8000. It shows the probability of dihedral angles for different types of aminoacids.</p>
            `);

        // @ts-ignore
        d3.select(this).select('#rama-svg-container').append('a').attr('id', 'rama-a-help').text('?').style('margin', '5px')
            .style('position', 'absolute').attr('href', '#');

        // @ts-ignore
        d3.select(this).select('#rama-a-help').on('click', () => {
            // @ts-ignore
            d3.select(this).select('#rama-overlay-help').transition().duration(300).style('display', 'block');
        });
        // @ts-ignore
        d3.select(this).select('#rama-overlay-help').on('click', () => {
            // @ts-ignore
            d3.select(this).select('#rama-overlay-help').transition().duration(300).style('display', 'none');
        });

        // @ts-ignore
        this.canvasContainer = d3.select(this).select('#rama-svg-container')
            .append('canvas')
            .classed('img-responsive', true)
            .attr('id', 'rama-canvas')
            .attr('width', width)
            .style('max-width', `${width-90}px`)
            .attr('height', height)
            .classed('svg-content-responsive', true)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', `0 0 ${width} ${height}`);

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

        // @ts-ignore
        d3.select(this).select('#rama-svg-container').append('div').attr('id', `rama-sum`).attr('class', 'rama-set-cl');
        // @ts-ignore
        d3.select(this).select('#rama-svg-container').append('div').attr('id', 'rama-settings').attr('class', 'rama-set-cl');

        // @ts-ignore
        let colorSelect = d3.select(this).select('#rama-settings').append('div').style('display', 'inline-block')
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
            // @ts-ignore
            this.residueColorStyle = parseInt(d3.select(this).select('#rama-coloring').property('value'));
            this.changeResiduesColors(this.residueColorStyle);
            this.addSummaryInfo();
        });

        // @ts-ignore
        let plotTypeSelect = d3.select(this).select('#rama-settings').append('div')
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
            // @ts-ignore
            this.ramaContourPlotType = parseInt(d3.select(this).select('#rama-plot-type').property('value'));
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers);
            this.baseContours(this.ramaContourPlotType, self.contourColoringStyle);
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

        // let ramaForm = d3.select('#rama-settings').append('form')
        //     .attr('id', 'rama-contour-style')
        //     .style('position', 'absolute')
        //     .style('margin', '5px');
        // ramaForm.append('input')
        //     .classed('form-check-input', true)
        //     .attr('type', 'radio')
        //     .attr('name', 'contour-style')
        //     .attr('value', 1)
        //     .attr('checked', true)
        //     .classed('rama-contour-radio', true);
        // ramaForm.append('label').classed('rama-contour-style', true).text('Contour')
        //     .attr('class', 'hint--right')
        //     .attr('data-hint', 'Regions are displayed using lines.')
        //     .style('margin-bottom', '0');

        // ramaForm.append('br');
        //
        // ramaForm.append('input')
        //     .classed('form-check-input', true)
        //     .attr('type', 'radio')
        //     .attr('name', 'contour-style')
        //     .attr('value', 2)
        //     .classed('rama-contour-radio', true);
        // ramaForm.append('label').classed('rama-contour-style', true).text('Heat Map')
        //     .attr('class', 'hint--right')
        //     .attr('data-hint', 'Regions are displayed heat map.')
        //     .style('margin-bottom', '0');
        //
        //
        // ramaForm.on('change', () => {
        //     RamachandranComponent.contourColoringStyle = parseInt(d3.select('input[name="contour-style"]:checked').property('value'));
        //     RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        // });
        // @ts-ignore
        let ramaForm = d3.select(this).select('#rama-settings').append('div').style('display', 'inline-block')
            .style('vertical-align', 'middle')
            .html(`
            <label class="switch" style="margin-top: 5px; margin-bottom: 0" id="contour-changer-label">
                <input type="checkbox" checked id="rama-contour-changer">
                <span class="slider contour round"></span>
                <span class="absolute-no">Heat Map</span>
            </label>
            <br>
             <label class="switch" style="margin-bottom: 1px">
                <input type="checkbox" checked id="rama-outlier-changer">
                <span class="slider outlier round"></span>
                <span class="absolute-no">Outliers</span>
            </label>`);

        // @ts-ignore
        d3.select(this).select('#rama-contour-changer').on('change', () => {
            const node: any = document.getElementById("rama-contour-changer");
            if (node.checked)
                self.contourColoringStyle = 1;
            else
                self.contourColoringStyle = 2;
            self.baseContours(self.ramaContourPlotType, self.contourColoringStyle);
        });

        // @ts-ignore
        d3.select(this).select('#rama-outlier-changer').on('change', () => {
            const node: any = document.getElementById("rama-outlier-changer");
            if (node.checked) {
                // @ts-ignore
                d3.select(self).selectAll('path.nonOutlier').style('display', 'block');
                return;
            }
            // @ts-ignore
            d3.select(self).selectAll('path.nonOutlier').style('display', 'none');
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

        // @ts-ignore
        let entryInfo = d3.select(this).select('#rama-settings').append('div').style('display', 'inline-block')
            .style('vertical-align', 'middle').style('margin-left', '50px');

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
        this.baseContours(this.ramaContourPlotType, this.contourColoringStyle);
        this.addEventListeners();
        // @ts-ignore
        d3.select(this).select('#rama-canvas')
            .style('max-width', `${width}px`)
            .style('width', '100%')
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
            this.allowed[pdbId] = 0;
            this.favored[pdbId] = 0;
            this.clashes[pdbId] = 0;
            this.sideChainOutliers[pdbId] = 0;
            this.ramachandranOutliers[pdbId] = 0;
            this.rsrzCount[pdbId] = 0;
            this.residuesOnCanvas[pdbId] = [];
            this.outliersList[pdbId].length = 0;
        });

        // let width = 500;
        const { fillColorFunction, tooltip, residueColorStyle, width, svgContainer, tooltip2} = this;

        let { onMouseOutResidue, onMouseOverResidue } = this;
        let self = this;


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
        // @ts-ignore
        d3.select(this).selectAll('.outliers').remove();
        // @ts-ignore
        d3.select(this).selectAll('table').remove();


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
                                        self.residuesOnCanvas[residue.pdbId].push(residue);
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

        let rsrz = this.parsedPdb[0].rsrz;
        let outliersType = this.parsedPdb[0].outlDict;

        let templatePdbResidues = filterModels(this.parsedPdb[0]).sort((residue1: Residue, residue2: Residue) => {
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
            self.selectedNode = null;
            d3.select(`#${node.idSelector}`)
                .attr('d', (residue: Residue) => self.changeObjectSize(residue, true))
                .style('fill', node.residueColor)
                .style('opacity', RamachandranComponent.computeOpacity(node.residueColor));
        }

        function selectNode(node: Residue) {
            if (self.selectedNode)
                deselectNode(self.selectedNode);
            self.selectedNode = node;
            d3.select(`#${node.idSelector}`)
                .attr('d', (residue: Residue) => self.changeObjectSize(residue, false))
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
                .classed('nonOutlier', (residue: Residue) => {
                    return residue.rama != 'OUTLIER';
                })
                .attr('id', (residue: Residue) => {
                    const id = `${residue.aa}-${residue.chainId}-${residue.modelId}-${residue.authorResNum}-${residue.pdbId}`;
                    // residue.aa + '-' + residue.chainId + '-' + residue.modelId + '-' + residue.num + residue.pdbId;
                    self.computeStats(residue);
                    residue.idSelector = id;
                    if (residueColorStyle !== 3) {
                        if (residue.rama === 'OUTLIER') {
                            self.outliersList[residue.pdbId].push(residue);
                        }
                        if (residue.rama === 'Favored') {
                            self.favored[residue.pdbId]++;
                        }
                        if (residue.rama === 'Allowed') {
                            self.allowed[residue.pdbId]++;
                        }
                        return id;
                    }
                    if (residue.rama === 'OUTLIER' && typeof self.rsrz[residue.pdbId][residue.num] !== 'undefined') {
                        self.outliersList[residue.pdbId].push(residue);
                        return id;
                    }
                    return id;
                })

                .attr('d', (residue: Residue) => {
                    if (residue.aa === 'GLY') {
                        return self.symbolTypes.triangle();
                    }
                    return self.symbolTypes.circle();
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

                    onMouseOverResidue(self, node, ramaContourPlotType, residueColorStyle, tooltip, true);

                })
                .on('mouseout', function(node: Residue) {
                        if (d3.select(this).node().style.opacity == 0)
                            return;

                        window.clearTimeout(self.timeoutId);

                        onMouseOutResidue(self, node, ramaContourPlotType, residueColorStyle, tooltip, true)
                    }
                )
                .on('click', function (node: Residue) {
                    if(node == self.selectedNode)
                        deselectNode(node);
                    else {
                        selectNode(node);
                        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.click', node, node.pdbId);
                    }
                })
        }
        if (templatePdbResidues.length > 0) {
            templatePdbResidues[0].authorResNum > templatePdbResidues[0].num ?
                self.resNumDifference = templatePdbResidues[0].authorResNum - templatePdbResidues[0].num :
                self.resNumDifference = templatePdbResidues[0].num - templatePdbResidues[0].authorResNum;

            addResiduesToCanvas(templatePdbResidues);

            let otherResidues = [];
            self.parsedPdb.forEach((pdb: ParsePDB, index: number) => {
                if (index < 1)
                    return;
                otherResidues = otherResidues.concat(filterModels(pdb));
            });

            addResiduesToCanvas(otherResidues);
        }


        function getDistance(point1: any, point2: any) {
            let xs = xScale(point1.phi) - xScale(point2.phi);
            xs = xs * xs;

            let ys = yScale(point1.psi) - yScale(point2.psi);
            ys = ys * ys;
            return Math.sqrt(xs+ys);
        }

        let distantResidues = [];
        self.residuesOnCanvas[templatePdb].forEach((residue: Residue) => {
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
                onMouseOverResidue(self, node.templateResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                onMouseOverResidue(self, node.otherResidue, ramaContourPlotType, residueColorStyle, tooltip2, false);
                tooltip.transition()
                    .style('opacity', .95)
                    .style('left', xScale(node.templateResidue.phi) -50 + 'px')
                    .style('top', yScale(node.templateResidue.psi) +45 + 'px')
                    .style('height', self.tooltipHeight)
                    .style('width', String(self.tooltipWidth) + 'px');

                tooltip2.transition()
                    .style('opacity', .95)
                    .style('left', xScale(node.otherResidue.phi) -30 + 'px')
                    .style('top', yScale(node.otherResidue.psi) +30 + 'px')
                    .style('height', self.tooltipHeight)
                    .style('width', String(self.tooltipWidth) + 'px');

                d3.select(this).attr("stroke-width", 3)
                    .attr('opacity', '0.8');

            })
            .on('mouseout', function (node: any) {
                window.clearTimeout(self.timeoutId);
                onMouseOutResidue(self, node.templateResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
                onMouseOutResidue(self, node.otherResidue, ramaContourPlotType, residueColorStyle, tooltip, false);
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
            self.outliersList[pdbId].sort((residue1: Residue, residue2: Residue) => residue1.num - residue2.num);
        });


        this.addSummaryInfo();

    }


    /**
     * add baseContours
     * @param {number} ramaContourPlotType
     * @param {number} contourColorStyle
     */
    public baseContours(ramaContourPlotType: number, contourColorStyle: number) {
        this.clearCanvas();

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

        const context = this.canvasContainer.node().getContext('2d');
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
        let self = this;

        const {fillColorFunction, residueColorStyle} = this;


        /**
         * unhighlight residue from event
         * @param event
         */
        function unHighlightObject(event: any) {
            let node = d3.select('.selected-res');
            if (node)
                node.classed('selected-res', false)
                    .attr('d', (residue: Residue) => self.changeObjectSize(residue)).transition().duration(50)
                    .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                    .style('display', 'block')
                    .style('opacity', (residue: Residue) => {
                        return RamachandranComponent.computeOpacity(residue.residueColor)
                    });
            if (typeof event.eventData != 'undefined') {
                let onMouseNode = getResidueNode(event);
                if (self.highlightedResidues.indexOf(onMouseNode) == -1) {
                    if (onMouseNode && onMouseNode.classed('clicked-res')) {
                        onMouseNode.style('fill', 'magenta');
                        return;
                    }
                }
            }
        }

        /**
         * onClick event
         * @param event
         */
        function onClick(event: any) {
            const res = getResidueNode(event);
            if (event.type =='PDB.litemol.click') {
                const node = getResidueNode(event);
                const highlightedNode = d3.select('.clicked-res');
                if (node == highlightedNode) {
                    node.classed('clicked-res', false)
                        .attr('d', (residue: Residue) => self.changeObjectSize(residue))
                        .transition()
                        .duration(50)
                        .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                        .style('display', 'block')
                        .style('opacity', (residue: Residue) => {
                            return RamachandranComponent.computeOpacity(residue.residueColor)
                        });
                } else if (node) {
                    node.attr('d', (residue: Residue) => self.changeObjectSize(residue, false))
                        .classed('clicked-res', true)
                        .style('fill', 'magenta')
                        .style('opacity', '1');
                } if (highlightedNode) {
                    highlightedNode.classed('clicked-res', false)
                        .attr('d', (residue: Residue) => self.changeObjectSize(residue))
                        .transition()
                        .duration(50)
                        .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                        .style('display', 'block')
                        .style('opacity', (residue: Residue) => {
                            return RamachandranComponent.computeOpacity(residue.residueColor)
                        });
                }
            }
            if (self.highlightedResidues.length != 0) {
                self.highlightedResidues.forEach((node: any) => {
                    node.attr('d', (residue: Residue) => self.changeObjectSize(residue)).transition().duration(50)
                        .style('fill', (residue: Residue) => fillColorFunction(residue, residueColorStyle))
                        .style('display', 'block')
                        .style('opacity', (residue: Residue) => {
                            return RamachandranComponent.computeOpacity(residue.residueColor)
                        });
                });
                self.highlightedResidues.pop();
            }
            self.highlightedResidues.push(res);

        }


        /**
         * return residue node from event
         * @param event
         * @returns {Selection}
         */
        function getResidueNode(event: any) {
            if (event.eventData.residueNumber == 0 || typeof event.eventData.chainId == 'undefined')
                return null;
            const selectedNode = d3.select(`path#${self.parsedPdb[0]._moleculesDict[1].chainsDict[event.eventData.chainId].modelsDict[event.eventData.entityId].residuesDict[event.eventData.residueNumber].idSelector}`)
            // const selectedNode = d3.select(`path#${event.eventData.residuesName}-${event.eventData.chainId}-${event.eventData.entityId}-${event.eventData.residueNumber+RamachandranComponent.resNumDifference}-${event.eventData.entryId.toLowerCase()}`);
            if (selectedNode)
                return selectedNode;
        }


        /**
         * highlight residue from event
         * @param event
         */
        function highLightObject(event: any) {
            let res = getResidueNode(event);
            if (res) {
                if (res.classed('clicked-res'))
                    return;
                res.classed('selected-res', true)
                    .attr('d', (d: any) => self.changeObjectSize(d, false))
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
                        res.style('fill', 'yellow');
                        return;
                    }
                }
                unHighlightObject(event);
                highLightObject(event);
            } if (Object.keys(event.eventData).length === 0 && event.eventData.constructor === Object) {
                const node = d3.select('.clicked-res');
                if (node) {
                    node.style('fill', 'magenta');
                    return;
                }
                unHighlightObject(event);
            }
        });

        window.addEventListener('protvista.click', (d:any) => {
            console.log(d);
            self.hiddenResidues.forEach((residue: Residue) => {
                if (residue.idSelector != ''){
                    d3.select(`#${residue.idSelector}`)
                        .style('visibility', 'visible');
                }
            });

            if (this.lastSelection == d.detail){
                self.hiddenResidues = [];
                self.selectedResidues = [];
                this.lastSelection = {};
                return;
            }

            this.lastSelection = d.detail;
            this.pdbIds.forEach((pdbId: string) => {
                self.hiddenResidues = self.residuesOnCanvas[pdbId].filter((residue: Residue) => {
                    if (!(residue.authorResNum >= this.lastSelection.begin && residue.authorResNum <= this.lastSelection.end))
                        return residue;
                    else self.selectedResidues.push(residue);
                });
            });

            self.hiddenResidues.forEach((residue: Residue) => {
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
                if (self.highlightedResidues.indexOf(event) > -1) {
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
        let self = this;
        // @ts-ignore
        d3.select(this).select('.rama-sum-table').remove();
        // @ts-ignore
        d3.select(this).select('#rama-sum').append('table').classed('rama-sum-table', true).append('tr')
            .classed('rama-sum-table-headline', true).append('th')
            .text('PDB');

        switch (this.residueColorStyle){
            case 1:
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('Preferred regions')
                    .attr('class', 'hint--top')
                    .attr('data-hint', 'Regions with the most favorable combinations of \u03C6 ' +
                        'and \u03C8 combination.');
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('Allowed regions')
                    .attr('class', 'hint--top')
                    .attr('data-hint', 'Regions with allowed combinations of \u03C6 and \u03C8 combination.');
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('Outliers')
                    .attr('class', 'hint--top')
                    .attr('data-hint', 'Regions with disallowed combinations of \u03C6 and \u03C8 combination.');
                break;
            case 2:
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('Ramachandran outliers');
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('Sidechain outliers');
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('Clashes');
                break;
            case 3:
                // @ts-ignore
                d3.select(this).select('.rama-sum-table-headline').append('th').text('RSRZ');
                break;
        }

        self.parsedPdb.forEach((pdb: ParsePDB) => {
            let resArrayLength = self.residuesOnCanvas[pdb.pdbID].length;
            if (resArrayLength == 0)
                resArrayLength = 1;


            switch (this.residueColorStyle){
                case 1:
                    // @ts-ignore
                    d3.select(this).select('.rama-sum-table').append('tr')
                        .classed(`table-row-${pdb.pdbID}`, true).append('td').text(pdb.pdbID);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(self.favored[pdb.pdbID])} 
                        (${String((self.favored[pdb.pdbID] /
                            resArrayLength * 100)
                            .toFixed(0))} %)`);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(self.allowed[pdb.pdbID])} 
                        (${String((self.allowed[pdb.pdbID] /
                            resArrayLength * 100)
                            .toFixed(0))} %)`);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(self.outliersList[pdb.pdbID].length)} 
                        (${String((self.outliersList[pdb.pdbID].length / 
                            resArrayLength * 100).toFixed(0))} %)`);
                    break;

                case 2:
                    // @ts-ignore
                    d3.select(this).select('.rama-sum-table').append('tr').classed(`table-row-${pdb.pdbID}`, true)
                        .append('td').text(pdb.pdbID);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(self.ramachandranOutliers[pdb.pdbID])} 
                        (${String((self.ramachandranOutliers[pdb.pdbID] / resArrayLength * 100)
                            .toFixed(0))} %)`);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(self.sideChainOutliers[pdb.pdbID])} 
                        (${String((self.sideChainOutliers[pdb.pdbID] 
                            / resArrayLength * 100)
                            .toFixed(0))} %)`);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String(self.clashes[pdb.pdbID])} 
                        (${String((self.clashes[pdb.pdbID] / resArrayLength * 100)
                            .toFixed(0))} %)`);
                    break;

                case 3:
                    // @ts-ignore
                    d3.select(this).select('.rama-sum-table').append('tr')
                        .classed(`table-row-${pdb.pdbID}`, true)
                        .append('td').text(pdb.pdbID);
                    // @ts-ignore
                    d3.select(this).select(`.table-row-${pdb.pdbID}`).append('td')
                        .text(`${String((self.rsrzCount[pdb.pdbID]))} 
                        (${String((self.rsrzCount[pdb.pdbID]
                            / resArrayLength * 100).toFixed(0))} %)`);
            }
        });
    }


    /**
     * compute summary stats of ramachandran diagram
     * @param residue
     */
    public computeStats(residue: Residue) {
        let self = this;
        if (self.outliersType[residue.pdbId][residue.num] != undefined) {
            let outlTypeHelper: any = self.outliersType[residue.pdbId][residue.num].outliersType;
             if (outlTypeHelper.includes('clashes')) {
                 self.clashes[residue.pdbId]++;
             }
             if (outlTypeHelper.includes('ramachandran_outliers')) {
                 self.ramachandranOutliers[residue.pdbId]++;
             }
             if (outlTypeHelper.includes('sidechain_outliers')) {
                 self.sideChainOutliers[residue.pdbId]++;
             }
         }
        if (typeof self.rsrz[residue.pdbId][residue.num] != 'undefined') {
            self.rsrzCount[residue.pdbId]++;
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
                if (typeof this.outliersType[residue.pdbId][residue.num] === 'undefined') {
                    residue.residueColor = '#008000';
                    return residue.residueColor;
                } else {
                    switch (this.outliersType[residue.pdbId][residue.num].outliersType.length) {
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
                if (typeof this.rsrz[residue.pdbId][residue.num] === 'undefined') {
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
    public getTimeout(ramaContourPlotType: number, aa: string = '') {
        let self = this;
        return window.setTimeout( () => {
            this.baseContours(ramaContourPlotType, this.contourColoringStyle);
            self.changeOpacity(aa);
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
                entryId: pdbId,
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
    public changeContours(residue: Residue, toDefault: boolean = true, ramaContourPlotType: number) {
        this.currentTime = new Date().getTime();
        switch (residue.aa) {
            case 'ILE':
            case 'VAL':
                if (ramaContourPlotType != 2) {
                    if (toDefault){
                        this.baseContours(ramaContourPlotType, this.contourColoringStyle);
                        this.changeOpacity('VAL,ILE', false);
                    } else {
                        this.timeoutId = this.getTimeout(2, 'VAL,ILE');
                    }
                }
                return;
            case 'GLY':
                if (ramaContourPlotType != 4) {
                    if (toDefault){
                        this.baseContours(ramaContourPlotType, this.contourColoringStyle);
                        this.changeOpacity('GLY', false);
                    } else {
                        this.timeoutId = this.getTimeout(4, 'GLY');
                    }
                }
                return;
            case 'PRO':
                if (ramaContourPlotType < 5) {
                    if (toDefault) {
                        this.baseContours(ramaContourPlotType, this.contourColoringStyle);
                        this.changeOpacity('PRO', false);
                    }
                    else {
                        if (residue.cisPeptide === null && residue.aa === 'PRO') {
                            this.timeoutId = this.getTimeout(5, 'PRO');
                            break;
                        }
                        if (residue.cisPeptide === 'Y' && residue.aa === 'PRO') {
                            this.timeoutId = this.getTimeout(6, 'PRO');
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
                    this.baseContours(ramaContourPlotType, this.contourColoringStyle);
                    this.changeOpacity('', false);
                } else {
                    this.timeoutId = this.getTimeout(3, '');
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
    public changeObjectSize(residue: Residue, smaller: boolean = true) {
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
            this.symbolTypes.triangle.size(size);
            return this.symbolTypes.triangle();
        }
        this.symbolTypes.circle.size(size);
        return this.symbolTypes.circle();

    }


    /**
     *
     * @param self
     * @param residue
     * @param {number} ramaContourPlotType
     * @param {number} residueColorStyle
     * @param tooltip
     * @param changeCont
     */
    public onMouseOverResidue(self: any, residue: Residue, ramaContourPlotType: number, residueColorStyle: number,
                              tooltip: any, changeCont: boolean){
        let highlightColor = residue.residueColor;
        if (residue.residueColor == '#000')
            highlightColor = 'yellow';
        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOver', residue, residue.pdbId);
        if (changeCont)
            self.changeContours(residue, false, ramaContourPlotType);
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
                const outliersType = this.outliersType[residue.pdbId];
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
                    this.tooltipWidth = 130;
                }
                if (outlierTypeHelper.includes('sidechain_outliers')) {
                    tempStr += '<br/>Sidechain outlier';
                    this.tooltipWidth = 100;
                }
                if (outlierTypeHelper.includes('bond_angles')) {
                    tempStr += '<br/>Bond angles';
                } else {
                    tooltip.html(RamachandranComponent.tooltipText(residue));
                }
                switch (this.outliersType[residue.pdbId][residue.num].outliersType.length) {
                    case 2:
                        this.tooltipHeight = 68;
                        break;
                    case 3:
                        this.tooltipHeight = 78;
                        break;
                    default:
                        break;
                }
                tooltip.html(RamachandranComponent.tooltipText(residue) + tempStr);
                break;
            case 3:
                if (typeof this.rsrz[residue.pdbId][residue.num] === 'undefined') {
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
                .style('height', self.tooltipHeight)
                .style('width', String(self.tooltipWidth) + 'px');

        }
        const node = d3.select(`#${residue.idSelector}`);
        if (!node.classed('clicked-res')) {
            node.attr('d', (residue: Residue) => self.changeObjectSize(residue, false))
        }
        node.style('fill', highlightColor)
            .style('opacity', 1);
        // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));

    }


    /**
     *
     * @param self
     * @param residue
     * @param {number} ramaContourPlotType
     * @param {number} residueColorStyle
     * @param tooltip
     * @param changeCount
     */
    public onMouseOutResidue(self: any, residue: Residue, ramaContourPlotType: number, residueColorStyle: number,
                             tooltip: any, changeCount: boolean) {
        let outTime = new Date().getTime();

        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOut', residue, residue.pdbId);
        if (self.highlightedResidues.indexOf(residue) > -1) {
            return;
        }

        const node = d3.select(`#${residue.idSelector}`);
        if (residue == self.selectedNode || node.classed('clicked-res')) {
            node.transition()
                .style('fill', 'magenta');
        }
        else {
            node.transition()
                .attr('d', (dat: any) => self.changeObjectSize(dat))
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
            if ((outTime - self.currentTime) > 600) {
                window.setTimeout(() => {
                    self.changeContours(residue, true, ramaContourPlotType)
                }, 50);
            }
        }
    }


    /**
     * change residue coloring
     * @param {number} residueColorStyle
     */
    public changeResiduesColors(residueColorStyle: number) {
        let self = this;

        let {tooltip, onMouseOverResidue, ramaContourPlotType,
            onMouseOutResidue} = this;

        this.pdbIds.forEach((pdbId: string) => {
            let resArray = this.residuesOnCanvas[pdbId];
            if (this.selectedResidues.length != 0) {
                resArray = this.selectedResidues.slice(0)
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
                        onMouseOverResidue(self, residue, ramaContourPlotType, residueColorStyle, tooltip, true)

                    });

                    node.on('mouseout', function () {
                        if (d3.select(`#${residue.idSelector}`).style('opacity')== '0')
                            return;
                        window.clearTimeout(self.timeoutId);

                        onMouseOutResidue(self, residue, ramaContourPlotType, residueColorStyle, tooltip, true)

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
    public changeOpacity(residuesString: string, makeInvisible: boolean = true) {
        let residues = residuesString.split(',');
        let nodes;

        /**
         * filter residues and hide unwanted residues and lines
         */
        this.parsedPdb.forEach((pdb: ParsePDB) => {
            let resArray = this.residuesOnCanvas[pdb.pdbID].slice(0);

            if (this.selectedResidues.length != 0) {
                resArray = this.selectedResidues.slice(0)
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
    public clearCanvas() {
        // @ts-ignore
        d3.select(this).select('#rama-canvas').empty();
        // @ts-ignore
        d3.selectAll(this).select('.contour-line').remove();
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