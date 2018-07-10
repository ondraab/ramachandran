import * as d3 from 'd3';
import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import {cisPro, generalContour, gly, ileVal, prePro, transPro} from "../contours/HeatMapContours";
import {lineCisPro, lineGeneralContour, lineGly, lineIleVal, linePrePro, lineTransPro} from "../contours/LineContours";
import 'bootstrap/dist/css/bootstrap.css';
import '../public/index.css';
import ParsePDB from "./parsePdb";

class RamachandranComponent extends PolymerElement {
    // containers
    private svgContainer;
    private static canvasContainer;

    // attributes
    private pdbId: string;
    private chainsToShow;
    private modelsToShow: number[];
    private ramaContourPlotType;
    private static contourColoringStyle;
    private residueColorStyle;

    //helpers
    private modelsToShowNumbers;
    private highlightedResidues: any[];
    private jsonObject;
    private xMap;
    private yMap;
    private xTopAxis;
    private xBottomAxis;
    private yLeftAxis;
    private yRightAxis;
    private dataGroup;
    private outliersTable;

    private tooltip;
    private outliersType;
    private rsrz;
    private clashes;
    private ramachandranOutliers;
    private sidechainOutliers;
    private rsrzCount;



     connectedCallback() {
        this.createChart = this.createChart.bind(this);
        this.fillColorFunction = this.fillColorFunction.bind(this);

        const pdb = new ParsePDB(this.pdbId);
        pdb.downloadAndParse();

        this.jsonObject = pdb.residueArray;
        this.outliersType = pdb.outlDict;
        this.rsrz = pdb.rsrz;

        this.ramachandranOutliers = 0;
        this.sidechainOutliers = 0;

        this.ramaContourPlotType = 1;
        RamachandranComponent.contourColoringStyle = 1;
        this.residueColorStyle = 1;

        this.modelsToShowNumbers = [];
        this.modelsToShow.map((d: any) => {
            this.modelsToShowNumbers.push(parseInt(d));
        });

        this.rsrzCount = 0;
        this.clashes = 0;
        this.highlightedResidues = [];
        this.createChart();
    }

    static get properties() {
        return {
            pdbId: {
                type: String,
                reflectToAttribute: true
            },
            chainsToShow: {
                type: Array,
                reflectToAttribute: true
            },
            modelsToShow: {
                type: Array,
                reflectToAttribute: true
            },
            residueColorStyle: {
                type: Number,
                reflectToAttribute: true
            },
            contourColoringStyle: {
                type: Number,
                reflectToAttribute: true
            },
            ramaContourPlotType: {
                type: Number,
                reflectToAttribute: true
            },
            element: {
                type: HTMLElement,
                reflectToAttribute: true
            },
        };
    }

    static get template () {
        return null;
    }

    /**
     * return fillColor which will be used
     * @param d - one residue
     * @param {number} drawingType Default - 1/Quality - 2/ RSRZ - 3
     * @param outliersType
     * @param rsrz
     * @param {boolean} compute
     * @returns {string} hex of color
     */
    private fillColorFunction(d: any, drawingType: number, outliersType: any, rsrz: any, compute: boolean = false) {
        switch (drawingType) {
            case 1:
                if (d.rama === 'OUTLIER') {
                    return '#f00';
                }
                return 'black';
            case 2:
                if (typeof outliersType[d.num] === 'undefined') {
                    return '#008000';
                } else {
                    if (compute === true) {
                        if (outliersType[d.num].outliersType.includes('clashes')) {
                            this.clashes++;
                        }
                        if (outliersType[d.num].outliersType.includes('ramachandran_outliers')) {
                            this.ramachandranOutliers++;
                        }
                        if (outliersType[d.num].outliersType.includes('sidechain_outliers')) {
                            this.sidechainOutliers++;
                        }
                    }
                    switch (outliersType[d.num].outliersType.length) {
                        case 0:
                            return '#008000';
                        case 1:
                            return '#ff0';
                        case 2:
                            return '#f80';
                        default:
                            return '#850013';
                    }
                }
            case 3:
                if (typeof rsrz[d.num] === 'undefined') {
                    return 'black';
                } else {
                    if (compute === true) {
                        this.rsrzCount++;
                    }
                    return '#f00';
                }
            default:
                break;
        }
    }

    /**
     * how opaque node will be
     * @param fillTmp
     * @returns {number}
     */
    private static opacityFunction(fillTmp: any) {
            if (fillTmp === '#008000' || fillTmp === 'black') {
                return 0.15;
            }
            if (fillTmp === '#ff0') {
                return 0.8;
            }
            return 1;
    }

    /**
     * creates basic chart, add axes, creates tooltip
     */
    private createChart() {
        let width = 500, height = 500;

        if (width > 768) {
            width = 580;
        }
        if (height > 768) {
            height = 580;
        }

        // setup x
        const xScale = d3.scaleLinear()
            .domain([-180, 180])
            .range([0, (width)]);

        this.xBottomAxis = d3.axisBottom(xScale);

        this.xTopAxis = d3.axisTop(xScale);

        this.xTopAxis = d3.axisTop(xScale);

        const xValue = (d) => d['phi'];

        this.xMap = (d) => xScale(xValue(d));

        // tooltip
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'rama-tooltip')
            .attr('height', 0)
            .style('opacity', 0);

        // setup y
        const yScale = d3.scaleLinear()
            .domain([180, -180])
            .range([0, (height)]);
        this.yLeftAxis = d3.axisLeft(yScale);

        this.yRightAxis = d3.axisRight(yScale);
        const yValue = (d) => d['psi'];
        this.yMap = (d) => yScale(yValue(d));

        function makeYGridlines() {
            return d3.axisRight(yScale);
        }

        function makeXGridlines() {
            return d3.axisTop(xScale);
        }

        this.svgContainer = d3.select('ramachandran-component').append('div')
            .attr('id', 'rama-svg-container')
            .attr('height', height)
            .attr('border', '1px solid black')
            .append('svg')
            .attr('max-width', width)
            .classed('svg-container', true)
            .attr('id', 'rama-svg')
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .classed('svg-content-responsive', true)
            .style('overflow', 'visible');

        RamachandranComponent.canvasContainer = d3.select('#rama-svg-container')
            .append('canvas')
            .classed('img-responsive', true)
            .attr('id', 'rama-canvas')
            .attr('width', width)
            .attr('height', height)
            .classed('svg-content-responsive', true)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('viewBox', '0 0 ' + width + ' ' + height)
            .style('padding', '30px 30px 30px 50px')
            .style('overflow', 'visible');

        // console.log(this.canvasContainer);
        // // add axes

        this.svgContainer.append('g')
            .call(this.xTopAxis)
            .attr('id', 'x-axis');

        this.svgContainer.append('g')
            .attr('transform', 'translate(0,' + (height) + ')')
            .call(this.xBottomAxis)
            .attr('id', 'x-axis');

        this.svgContainer.append('g')
            .call(this.yLeftAxis)
            .attr('id', 'y-axis');

        this.svgContainer.append('g')
            .attr('transform', () => 'translate(' + (width) + ', 0)')
            .call(this.yRightAxis)
            .attr('id', 'y-axis');

        this.svgContainer.append('g')
            .attr('class', 'rama-grid')
            .attr('transform', 'translate(0,' + height + ')')
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
            .text('\u03A6');

        // psi label
        this.svgContainer.append('text')
            .attr('x',  0 - (height / 2))
            .attr('y', -35)
            .style('text-anchor', 'middle')
            .style('fill', '#000')
            .attr('transform', 'rotate(-90)')
            .text('\u03A8');
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

        let colorSelect = d3.select('#rama-settings').append('select').attr('id', 'rama-coloring');

        colorSelect.append('option').attr('value', 1).text('Default');
        colorSelect.append('option').attr('value', 2).text('Quality');
        colorSelect.append('option').attr('value', 3).text('RSRZ');

        colorSelect.on('change', () => {
            this.residueColorStyle = parseInt(d3.select('#rama-coloring').property('value'));
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers,
                this.residueColorStyle);
        });

        let plotTypeSelect = d3.select('#rama-settings').append('select').attr('id', 'rama-plot-type');
        plotTypeSelect.append('option').attr('value', 1).text('General case');
        plotTypeSelect.append('option').attr('value', 2).text('Isoleucine and valine');
        plotTypeSelect.append('option').attr('value', 3).text('Pre-proline');
        plotTypeSelect.append('option').attr('value', 4).text('Glycine');
        plotTypeSelect.append('option').attr('value', 5).text('Trans proline');
        plotTypeSelect.append('option').attr('value', 6).text('Cis proline');

        plotTypeSelect.on('change', () => {
            this.ramaContourPlotType = parseInt(d3.select('#rama-plot-type').property('value'));
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers,
                this.residueColorStyle);
            this.basicContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        });

        let ramaForm = d3.select('#rama-settings').append('form').attr('id', 'rama-contour-style');
        ramaForm.append('label').classed('rama-contour-style', true).text('Contour').append('input')
            .attr('type', 'radio')
            .attr('name', 'contour-style')
            .attr('value', 1)
            .attr('checked', true)
            .classed('rama-contour-radio', true);

        ramaForm.append('label').classed('rama-contour-style', true).text('Heat Map').append('input')
            .attr('type', 'radio')
            .attr('name', 'contour-style')
            .attr('value', 2)
            .classed('rama-contour-radio', true);

        ramaForm.on('change', () => {
            RamachandranComponent.contourColoringStyle = parseInt(d3.select('input[name="contour-style"]:checked').property('value'));
            this.basicContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        });

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers,
            this.residueColorStyle);
        this.basicContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
    }

    /**
     * sort json object to that it can be better displayed
     * @param jsonObject
     * @param {number} drawingType
     * @param {any[]} outliersType
     * @param {any[]} rsrz
     */
    public sortJson(jsonObject: any, drawingType: number, outliersType: any[], rsrz: any[]){
        jsonObject.sort((a: any, b: any) => {
            switch (drawingType) {
                case 1:
                    if (a.rama === 'OUTLIER') {
                        if (b.rama === 'Allowed') {
                            return 1;
                        }
                        if (b.rama === 'Favored') {
                            return 1;
                        }
                        if (b.rama === 'OUTLIER') {
                            return 0;
                        }
                    }
                    if (a.rama === 'Allowed') {
                        if (b.rama === 'Allowed') {
                            return 0;
                        }
                        if (b.rama === 'Favored') {
                            return 1;
                        }
                        if (b.rama === 'OUTLIER') {
                            return -1;
                        }
                    }
                    if (a.rama === 'Favored') {
                        if (b.rama === 'Allowed') {
                            return -1;
                        }
                        if (b.rama === 'Favored') {
                            return 0;
                        }
                        if (b.rama === 'OUTLIER') {
                            return -1;
                        }
                    }
                    break;
                case 2:
                    if (typeof outliersType[a.num] === 'undefined') {
                        return -1;
                    } else if (typeof outliersType[b.num] === 'undefined') {
                        return 1;
                    } else if (outliersType[a.num].outliersType.length > outliersType[b.num].outliersType.length) {
                        return 1;
                    } else {
                        return -1;
                    }
                case 3:
                    if (typeof rsrz[a.num] === 'undefined') {
                        return -1;
                    } else if (typeof  rsrz[b.num] === 'undefined') {
                        return 1;
                    } else {
                        return 1;
                    }
                default:
                    break;
            }
        });
    }

    /**
     * change residues in chart
     * @param {any[]} chainsToShow
     * @param {number} ramaContourPlotType
     * @param {number[]} entityToShow
     * @param {number} drawingType
     */
    private updateChart(chainsToShow: any[], ramaContourPlotType: number, entityToShow: number[], drawingType: number) {
        this.svgContainer.selectAll('g.dataGroup').remove();

        let width = 500;
        const { jsonObject, fillColorFunction, outliersType, rsrz, basicContours, tooltip} = this;
        const clickEvents = ['PDB.litemol.click', 'PDB.topologyViewer.click'];
        const mouseOutEvents = ['PDB.topologyViewer.mouseout', 'PDB.litemol.mouseout'];
        let { highlightedResidues } = this;

        let favored = 0;
        let allowed = 0;
        let timeoutId = null;
        let scrollTimer, lastScrollFireTime = 0;
        let now;

        if (width > 768) {
            width = 580;
        }
        // if (height > 768) {
        //     height = 580;
        // }
        let objSize = 40;
        if (window.screen.availWidth < 1920) {
            objSize = 30;
        }
        if (window.screen.width < 350) {
            objSize = 5;
        }

        const pdbId = this.pdbId;
        const outliersList = [];

        // scales
        const xScale = d3.scaleLinear()
            .domain([-180, 180])
            .range([0, (width)]);
        // .range([0, (0.985 * width)]);

        const yScale = d3.scaleLinear()
            .domain([180, -180])
            .range([0, (width)]);

        // symbolTypes
        const symbolTypes = {
            circle: d3.symbol().type(d3.symbolCircle).size(objSize),
            triangle: d3.symbol().type(d3.symbolTriangle).size(objSize)

        };


        /**
         * determines which residues will be displayed depending on ramaContourPlotType
         * @param d
         * @param {number} i
         * @returns {any}
         */
        function switchPlotType(d: any, i: number) {
            let prePro = false;
            if (i + 1 != jsonObject.length && jsonObject[i + 1].aa == 'PRO') {
                d.prePro = true;
                prePro = true;
            }
            switch (ramaContourPlotType) {
                case 1:
                    return d;
                case 2:
                    if (d.aa == 'ILE' || d.aa == 'VAL') {
                        return d;
                    }
                    break;
                case 3:
                    if (prePro)
                        return d;
                    break;
                case 4:
                    if (d.aa == 'GLY') {
                        return d;
                    }
                    break;
                case 5:
                    if (d.cisPeptide == null && d.aa == 'PRO') {
                        return d;
                    }
                    break;
                case 6:
                    if (d.cisPeptide == 'Y' && d.aa == 'PRO') {
                        return d;
                    }
                    break;
                default:
                    return d;
            }
        }


        /**
         * text for tooltip
         * @param d
         * @returns {string}
         */
        function tooltipText(d: any) {
            // language=HTML
            return  `<b>${d.chain} ${d.num} ${d.aa}</b><br/>\u03A6: ${d.phi}<br/>\u03A8: ${d.psi}`;
        }


        /**
         * return timeoutid when hovering
         * @param {number} ramaContourPlotType
         * @param {string} aa
         * @returns {number}
         */
        function getTimeout(ramaContourPlotType: number, aa: string = '') {
            return window.setTimeout( () => {
                basicContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                changeOpacity(aa);
            }, 800);
        }


        /**
         * throw new event with defined data
         * @param {string} name name of event
         * @param d node
         */
        function dispatchCustomEvent(name: string, d: any) {
            const event = new CustomEvent(name, {detail: {
                    chainId: d.chain,
                    entityId: d.modelId,
                    entry: pdbId,
                    residueName: d.aa,
                    residueNumber: d.num}});
            window.dispatchEvent(event);
        }

        /**
         * function for change contours after mouseout or mouseover
         * @param data selected node
         * @param toDefault true if used for return to base state
         */
        function changeContours(data: any, toDefault: boolean = true) {
            switch (data.aa) {
                case 'ILE':
                case 'VAL':
                    if (ramaContourPlotType != 2) {
                        if (toDefault){
                            basicContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            changeOpacity('VAL,ILE', false);
                        } else {
                            timeoutId = getTimeout(2, 'VAL,ILE');
                        }
                    }
                    return;
                case 'GLY':
                    if (ramaContourPlotType != 4) {
                        if (toDefault){
                            basicContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            changeOpacity('GLY', false);
                        } else {
                            timeoutId = getTimeout(4, 'GLY');
                        }
                    }
                    return;
                case 'PRO':
                    if (ramaContourPlotType < 5) {
                        if (toDefault) {
                            basicContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            changeOpacity('PRO', false);
                        }
                        else {
                            if (data.cisPeptide === null && data.aa === 'PRO') {
                                timeoutId = getTimeout(5, 'PRO');
                                break;
                            }
                            if (data.cisPeptide === 'Y' && data.aa === 'PRO') {
                                timeoutId = getTimeout(6, 'PRO');
                                break;
                            }
                        }
                    }
                    return;
                default:
                    break;
            }
            switch (data.prePro) {
                case true:
                    if (ramaContourPlotType != 3) {
                        if (toDefault) {
                            basicContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                            changeOpacity('', false);
                        } else
                            timeoutId = getTimeout(3, '');
                    }
                    break;
                default:
                    break;
            }
        }


        /**
         * function to change opacity while hovering
         * @param {string} aa
         * @param {boolean} makeInvisible
         */
        function changeOpacity(aa: string, makeInvisible: boolean = true) {
            let residues = aa.split(',');
            let nodes;
            if (aa == '')
            {
                nodes = document.querySelectorAll('g.dataGroup path');
                nodes = Array.from(nodes).filter((d: any) => {
                    return (d.__data__.prePro == false)
                });
            } else if (residues.length > 1) {
                nodes = document.querySelectorAll(
                    'g.dataGroup :not([id^=' + residues[0] + '])');
                nodes = Array.from(nodes).filter((d: any) => {
                    return !d.id.includes(residues[1]);
                });
            } else {
                nodes = document.querySelectorAll('g.dataGroup :not([id^=' + aa + '])');
            }
            [].forEach.call(nodes, (d: any) => {
                if (makeInvisible)
                    d.style.opacity = 0;
                else {
                    if (d.style.fill == 'rgb(0, 128, 0)' || d.style.fill == 'black' || d.style.fill == 'rgb(0, 0, 0)') {
                        d.style.opacity = 0.15;
                    } else if (d.style.fill == 'rgb(255, 255, 0)') {
                        d.style.opacity = 0.8;
                    }else {
                        d.style.opacity = 1;
                    }
                }
            })
        }

        /**
         * change object size on hover
         * @param d
         * @param {boolean} smaller
         * @returns {string | null}
         */
        function changeObjectSize(d: any, smaller: boolean = true) {
            let size = 175;
            if (smaller) {
                size = objSize;
            }
            if (d.aa === 'GLY') {
                symbolTypes.triangle.size(size);
                return symbolTypes.triangle();
            }
            symbolTypes.circle.size(size);
            return symbolTypes.circle();

        }


        /**
         * unhighlight residue from event
         * @param event
         */
        function unHighlightObject(event: any) {
            if (typeof event.eventData != 'undefined') {
                if (highlightedResidues.indexOf(getResidueNode(event)) == -1) {
                    d3.select('.selected-res')
                        .classed('selected-res', false)
                        .attr('d', (d: any) => changeObjectSize(d)).transition().duration(50)
                        .style('fill', (d) => fillColorFunction(d, drawingType, outliersType, rsrz, true))
                        .style('opacity', (d) => {
                            return RamachandranComponent.opacityFunction(fillColorFunction(d, drawingType, outliersType, rsrz))
                        });
                }
            }
        }

        /**
         * onClick event
         * @param event
         */
        function onClick(event: any) {
            const res = getResidueNode(event);
            if (highlightedResidues.length != 0) {
                highlightedResidues.forEach((d: any) => {
                    d.attr('d', (d: any) => changeObjectSize(d)).transition().duration(50)
                        .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz))
                        .style('opacity', (d) => {
                            return RamachandranComponent.opacityFunction(fillColorFunction(d, drawingType, outliersType, rsrz))
                        });
                });
                highlightedResidues.pop();
            }
            highlightedResidues.push(res);
            getResidueNode(event).attr('d', (d: any) => changeObjectSize(d, false))
                .classed('selected-res', false)
                .style('fill', 'magenta')
                .style('opacity', '1');
        }


        /**
         * return residue node from event
         * @param event
         * @returns {any}
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
                res.attr('d', (d: any) => changeObjectSize(d, false))
                    .classed('selected-res', true)
                    .style('fill', 'yellow')
                    .style('opacity', '1');
                // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
            }

        }


        // sort because of svg z-index
        this.sortJson(this.jsonObject, drawingType, outliersType, rsrz);

        // outliersText
        d3.selectAll('.outliers').remove();
        d3.selectAll('table').remove();

        this.svgContainer.selectAll('.shapes')
            .data(jsonObject.filter((d: any, i: number) => {
                if (chainsToShow.indexOf(d.chain) !== -1 && entityToShow.indexOf(d.modelId) !== -1) {
                    if (d.phi !== null || d.psi !== null) {
                        return switchPlotType(d, i);
                    }
                }
            }))
            .enter()
            .append('g')
            .attr('class', 'dataGroup')
            .append('path')
            .attr('id', (d) => {
                const id = d.aa + '-' + d.chain + '-' + d.modelId + '-' + d.num;
                d.idSlector = id;
                if (drawingType !== 3) {
                    if (d.rama === 'OUTLIER') {
                        outliersList.push(d);
                    }
                    if (d.rama === 'Favored') {
                        favored++;
                    }
                    if (d.rama === 'Allowed') {
                        allowed++;
                    }
                    return id;
                }
                if (d.rama === 'OUTLIER' && typeof rsrz[d.num] !== 'undefined') {
                    outliersList.push(d);
                    return id;
                }
                return id;
            })

            .attr('d', (d) => {
                if (d.aa === 'GLY') {
                    return symbolTypes.triangle();
                }
                return symbolTypes.circle();
            })
            .attr('transform', (d) => 'translate(' + xScale(d.phi) + ',' + yScale(d.psi) + ')')
            .merge(this.svgContainer)
            // .style('fill', 'transparent')
            .style('fill', (d) => fillColorFunction(d, drawingType, outliersType, rsrz, true))
            .style('opacity', (d) => {
                return RamachandranComponent.opacityFunction(fillColorFunction(d, drawingType, outliersType, rsrz))
            })
            .on('mouseover', function(d: any) {
                let height = 58;
                let width = 90;
                let highlightColor = 'yellow';
                dispatchCustomEvent('PDB.ramaViewer.mouseOver', d);
                now = new Date().getTime();
                changeContours(d, false);
                switch (drawingType) {
                    case 1:
                        if (d.rama === 'Favored') {
                            tooltip.html(tooltipText(d) + '<br/> Favored');
                        }
                        if (d.rama === 'Allowed') {
                            tooltip.html(tooltipText(d) + '<br/> Allowed');
                        }
                        if (d.rama === 'OUTLIER') {
                            tooltip.html(tooltipText(d) + '<br/><b>OUTLIER</b>');
                        }
                        break;
                    case 2:
                        let tempStr = '';
                        highlightColor = 'magenta';
                        if (typeof outliersType[d.num] === 'undefined') {
                            tooltip.html(tooltipText(d));
                            break;
                        }
                        if (outliersType[d.num].outliersType.includes('clashes')) {
                            tempStr += '<br/>Clash';
                        }
                        if (outliersType[d.num].outliersType.includes('ramachandran_outliers')) {
                            tempStr += '<br/>Ramachandran outlier';
                            width += 40;
                        }
                        if (outliersType[d.num].outliersType.includes('sidechain_outliers')) {
                            tempStr += '<br/>Sidechain outlier';
                            width += 10;
                        }
                        if (outliersType[d.num].outliersType.includes('bond_angles')) {
                            tempStr += '<br/>Bond angles';
                        } else {
                            tooltip.html(tooltipText(d));
                        }
                        switch (outliersType[d.num].outliersType.length) {
                            case 2:
                                height += 10;
                                break;
                            case 3:
                                height += 20;
                                break;
                            default:
                                break;
                        }
                        tooltip.html(tooltipText(d) + tempStr);
                        break;
                    case 3:
                        if (typeof rsrz[d.num] === 'undefined') {
                            tooltip.html(tooltipText(d));
                        } else {
                            tooltip.html(tooltipText(d) + '<br/><b>RSRZ outlier</b>');
                        }
                        break;
                    default:
                        break;
                }
                tooltip.transition()
                    .style('opacity', .95)
                    .style('left', (d3.event.pageX + 10) + 'px')
                    .style('top', (d3.event.pageY - 48) + 'px')
                    .style('height', height)
                    .style('width', String(width) + 'px');

                d3.select(this)
                    .attr('d', (d: any) => changeObjectSize(d, false))
                    .style('fill', highlightColor)
                    .style('opacity', 1);
                    // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));

            })
            .on('mouseout', function(d: any) {
                window.clearTimeout(timeoutId);
                let outTime = new Date().getTime();
                dispatchCustomEvent('PDB.ramaViewer.mouseOut', d);
                if (highlightedResidues.indexOf(d) > -1) {
                    return;
                }

                d3.select(this)
                    .transition()
                    // .duration(50)
                    .attr('d', (dat: any) => changeObjectSize(dat))
                    // .style('fill', 'transparent')
                    .style('fill', (d) => fillColorFunction(d, drawingType, outliersType, rsrz))
                    .style('opacity', (d) => {
                        return RamachandranComponent.opacityFunction(fillColorFunction(d, drawingType, outliersType, rsrz))
                    });
                    // .style('fillColorFunction-width', '0.5');
                    tooltip.transition()
                    // .duration(50)
                        .style('opacity', 0);
                    if ((outTime - now) > 800) {
                        changeContours(d);
                    }
                }
            );
            // .on('click', function(d: any) {
            //     if (highlightedResidues.length != 0) {
            //         highlightedResidues.forEach((d: any) => {
            //             d3.select('#' + d.idSlector)
            //                 .attr('d', (d: any) => changeObjectSize(d)).transition().duration(50)
            //                 .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz))
            //                 .style('opacity', (d) => {
            //                     return RamachandranComponent.opacityFunction(fillColorFunction(d, drawingType, outliersType, rsrz))
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
        outliersList.sort((a: any, b: any) => a.num - b.num);

        /**
         * switch for summary info
         */
        switch (drawingType) {
            case 1:
                d3.selectAll('#rama-sum-div').remove();
                d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
                    .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
                    .text('Preferred regions: ' + String(favored)
                        + ' (' + String((favored / jsonObject.length * 100).toFixed(0))
                        + '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-middle')
                    .text('Allowed regions: ' + String(allowed)
                        + ' (' + String((allowed / jsonObject.length * 100).toFixed(0))
                        + '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-thinnest')
                    .text('Outliers: ' + String(outliersList.length)
                        + ' (' + String((outliersList.length / jsonObject.length * 100).toFixed(0)) + '%)').enter();

                break;
            case 2:
                d3.selectAll('#rama-sum-div').remove();
                d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
                    .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
                    .text('Ramachandran outliers: ' + String(this.ramachandranOutliers)
                        + ' (' + String((this.ramachandranOutliers / jsonObject.length * 100).toFixed(0)) +
                        '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-middle')
                    .text('Sidechain outliers: ' + String(this.sidechainOutliers)
                        + ' (' + String((this.sidechainOutliers / jsonObject.length * 100).toFixed(0)) + '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-thinnest')
                    .text('Clashes: ' + String(this.clashes)
                        + ' (' + String((this.clashes / jsonObject.length * 100).toFixed(0)) + '%)').enter();
                break;
            case 3:
                d3.selectAll('#rama-sum-div').remove();
                d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
                    .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
                    .text('RSRZ: ' + String(this.rsrzCount)
                        + ' (' + String((this.rsrzCount / jsonObject.length * 100).toFixed(0)) + '%) ').enter();

                break;
            default:
                return;
        }


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
                if (highlightedResidues.indexOf(event) > -1) {
                    return;
                }
                unHighlightObject(event);
            });
        });


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


        // reset counters
        this.sidechainOutliers = 0;
        this.rsrzCount = 0;
        this.clashes = 0;
        this.ramachandranOutliers = 0;
        // this.addTable(outliersList, drawingType);
    }

    private static clearCanvas() {
        d3.select('#rama-canvas').empty();
        d3.selectAll('.contour-line').remove();
    }

    private basicContours(ramaContourPlotType: number, contourColorStyle: number) {
        RamachandranComponent.clearCanvas();
        let width = 500, height = 500;

        if (width > 768) {
            width = 580;
        }
        if (height > 768) {
            height = 580;
        }
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

    public fillTable(sortedTable: any[], drawingType: number) {
        let objSize = 40;
        const { fillColorFunction, outliersType, rsrz } = this;
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
                d3.select('#' + '-' + d.chain + '-' + d.modelId + '-' + d.num)
                    .attr('d', (dat: any) => {
                        if (dat.aa === 'GLY') {
                            symbolTypes.triangle.size(175);
                            return symbolTypes.triangle();
                        }
                        symbolTypes.circle.size(175);
                        return symbolTypes.circle();
                    })
                    .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
            })
            //
            .on('mouseout', function(d: any) {
                d3.select(this)
                    .style('background-color', 'transparent')
                    .style('cursor', 'default');
                d3.select('#' +  d.aa + '-' + d.chain + '-' + d.modelId + '-' + d.num)
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
                    .style('fill', (d) => fillColorFunction(d, drawingType, outliersType, rsrz))
                    .style('fillColorFunction-width', '0.5');
            })
            .selectAll('td')
            .data((d) => [d.chain, d.num, d.aa, d.phi, d.psi])
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
            .data((d) => [d.chain, d.num, d.aa, d.phi, d.psi])
            .text((d) => d);
        //
        cells.enter()
            .append('td')
            .text((d) => d);

        cells.exit().remove();
    }
}

window.customElements.define('ramachandran-component', RamachandranComponent);