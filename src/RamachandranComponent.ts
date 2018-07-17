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
    private modelsToShow;
    private ramaContourPlotType;
    private static contourColoringStyle;
    private residueColorStyle;

    //helpers
    private modelsToShowNumbers;
    private static jsonObject;
    private xMap;
    private yMap;
    private dataGroup;
    private outliersTable;
    private lastSelection;

    private tooltip;
    private outliersType;
    private rsrz;
    private clashes;
    private ramachandranOutliers;
    private sidechainOutliers;
    private rsrzCount;

    private static favored;
    private static allowed;
    private static highlightedResidues: any[];

    private static hiddenResidues;
    private static selectedResidues;
    private static outliersList;

    private static tooltipWidth;
    private static tooltipHeight;
    private static timeoutId;
    private static currentTime;
    private static lastTimeChanged;

    private static symbolTypes;
    private static residuesOnCanvas;



    static get properties() {
        return {
            pdbId: {
                type: String,
                reflectToAttribute: true,
                notify: true,
                observer: '_pdbIdChanged'
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

    connectedCallback() {
        super.connectedCallback();

        this.createChart = this.createChart.bind(this);
        this.fillColorFunction = this.fillColorFunction.bind(this);

        const pdb = new ParsePDB(this.pdbId);
        pdb.downloadAndParse();

        RamachandranComponent.jsonObject = pdb.residueArray;
        this.outliersType = pdb.outlDict;
        this.rsrz = pdb.rsrz;

        RamachandranComponent.hiddenResidues = [];
        RamachandranComponent.selectedResidues = [];

        this.ramachandranOutliers = 0;
        this.sidechainOutliers = 0;

        RamachandranComponent.favored = 0;
        RamachandranComponent.allowed = 0;
        RamachandranComponent.outliersList = [];

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
        this.rsrzCount = 0;
        this.clashes = 0;
        RamachandranComponent.highlightedResidues = [];
        RamachandranComponent.residuesOnCanvas = [];
        this.createChart();

        this.lastSelection = {};

        RamachandranComponent.tooltipHeight = 58;
        RamachandranComponent.tooltipWidth = 90;
    }

    _pdbIdChanged(newValue: string, oldValue: string) {
        if (typeof oldValue == 'undefined')
            return;

        const pdb = new ParsePDB(this.pdbId);
        pdb.downloadAndParse();

        RamachandranComponent.jsonObject = pdb.residueArray;

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShow);

        d3.select('#rama-info-pdbid').text(this.pdbId.toUpperCase());
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

        let xBottomAxis = d3.axisBottom(xScale);
        let xTopAxis = d3.axisTop(xScale);


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

        // // add axes

        this.svgContainer.append('g')
            .call(xTopAxis)
            .attr('id', 'x-axis');

        this.svgContainer.append('g')
            .attr('transform', 'translate(0,' + (height) + ')')
            .call(xBottomAxis)
            .attr('id', 'x-axis');

        this.svgContainer.append('g')
            .call(yLeftAxis)
            .attr('id', 'y-axis');

        this.svgContainer.append('g')
            .attr('transform', () => 'translate(' + (width) + ', 0)')
            .call(yRightAxis)
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
            this.changeResiduesColors(this.residueColorStyle);
            this.addSummaryInfo();
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
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers);
            RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
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
            RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        });

        let entryInfo = d3.select('#rama-settings').append('div').style('display', 'inline-block')
            .style('width', '27%').style('margin', '5px 5px 5px 10px');

        entryInfo.append('div').style('display', 'inline-block').style('width', '28%')
            .attr('id', 'rama-info-pdbid').text(this.pdbId.toUpperCase());

        entryInfo.append('div').style('display', 'inline-block')
            .attr('id', 'rama-info-chains').style('width', '36%')
            .style('text-align','right').text(this.chainsToShow);

        entryInfo.append('div').style('display', 'inline-block').attr('id', 'rama-info-models')
            .style('width', '36%').style('text-align','right').text(this.modelsToShow);

        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers);
        RamachandranComponent.baseContours(this.ramaContourPlotType, RamachandranComponent.contourColoringStyle);
        this.addEventListeners();
    }


    /**
     * change residues in chart
     * @param {any[]} chainsToShow
     * @param {number} ramaContourPlotType
     * @param {number[]} entityToShow
     */
    public updateChart(chainsToShow: any[], ramaContourPlotType: number, entityToShow: number[]) {
        this.svgContainer.selectAll('g.dataGroup').remove();

        //reset counters
        this.sidechainOutliers = 0;
        this.rsrzCount = 0;
        this.ramachandranOutliers = 0;
        RamachandranComponent.allowed = 0;
        RamachandranComponent.favored = 0;
        this.clashes = 0;
        RamachandranComponent.residuesOnCanvas = [];
        RamachandranComponent.outliersList = [];

        let width = 500;
        const { fillColorFunction, outliersType, rsrz, tooltip, residueColorStyle} = this;

        const jsonObject = RamachandranComponent.jsonObject;
        let { onMouseOutResidue, onMouseOverResidue } = this;

        if (width > 768) {
            width = 580;
        }
        // if (height > 768) {
        //     height = 580;
        // }

        const pdbId = this.pdbId;

        // scales
        const xScale = d3.scaleLinear()
            .domain([-180, 180])
            .range([0, (width)]);
        // .range([0, (0.985 * width)]);

        const yScale = d3.scaleLinear()
            .domain([180, -180])
            .range([0, (width)]);

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


        // sort because of svg z-index
        this.sortJson(jsonObject, residueColorStyle, outliersType, rsrz);

        // outliersText
        d3.selectAll('.outliers').remove();
        d3.selectAll('table').remove();

        this.svgContainer.selectAll('.shapes')
            .data(jsonObject.filter((d: any, i: number) => {
                if (chainsToShow.indexOf(d.chain) != -1 && (entityToShow.indexOf(d.modelId) != -1 ||
                    entityToShow.indexOf(d.modelId.toString()))) {
                    if (d.phi != null || d.psi != null) {
                        const actualRes = switchPlotType(d, i);
                        if (typeof actualRes != 'undefined') {
                            RamachandranComponent.residuesOnCanvas.push(actualRes);
                            return actualRes;
                        }
                    }
                }
            }))
            .enter()
            .append('g')
            .attr('class', 'dataGroup')
            .append('path')
            .attr('id', (d) => {
                const id = d.aa + '-' + d.chain + '-' + d.modelId + '-' + d.num;

                d.idSelector = id;
                if (residueColorStyle !== 3) {
                    if (d.rama === 'OUTLIER') {
                        RamachandranComponent.outliersList.push(d);
                    }
                    if (d.rama === 'Favored') {
                        RamachandranComponent.favored++;
                    }
                    if (d.rama === 'Allowed') {
                        RamachandranComponent.allowed++;
                    }
                    return id;
                }
                if (d.rama === 'OUTLIER' && typeof rsrz[d.num] !== 'undefined') {
                    RamachandranComponent.outliersList.push(d);
                    return id;
                }
                return id;
            })

            .attr('d', (d) => {
                if (d.aa === 'GLY') {
                    return RamachandranComponent.symbolTypes.triangle();
                }
                return RamachandranComponent.symbolTypes.circle();
            })
            .attr('transform', (d) => 'translate(' + xScale(d.phi) + ',' + yScale(d.psi) + ')')
            .merge(this.svgContainer)
            // .style('fill', 'transparent')
            .style('fill', (d) => fillColorFunction(d, residueColorStyle, outliersType, rsrz, true))
            .style('opacity', (d) => {
                return RamachandranComponent.computeOpacity(fillColorFunction(d, residueColorStyle, outliersType, rsrz))
            })
            .on('mouseover', function(d: any) {
                if (d3.select(this).node().style.opacity == 0)
                    return;

                onMouseOverResidue(d, pdbId, ramaContourPlotType, residueColorStyle, tooltip, outliersType, rsrz);

            })
            .on('mouseout', function(d: any) {
                    if (d3.select(this).node().style.opacity == 0)
                        return;
                    window.clearTimeout(RamachandranComponent.timeoutId);

                    onMouseOutResidue(d, pdbId, ramaContourPlotType, residueColorStyle, tooltip, outliersType, rsrz, fillColorFunction)
                }
            );
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
        RamachandranComponent.outliersList.sort((a: any, b: any) => a.num - b.num);

        this.addSummaryInfo();

    }


    /**
     * add baseContours
     * @param {number} ramaContourPlotType
     * @param {number} contourColorStyle
     */
    static baseContours(ramaContourPlotType: number, contourColorStyle: number) {
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


    /**
     * add listeners from other components
     */
    public addEventListeners() {
        const clickEvents = ['PDB.litemol.click', 'PDB.topologyViewer.click'];
        const mouseOutEvents = ['PDB.topologyViewer.mouseout', 'PDB.litemol.mouseout'];
        let scrollTimer, lastScrollFireTime = 0;

        const {fillColorFunction, residueColorStyle, outliersType, rsrz} = this;


        /**
         * unhighlight residue from event
         * @param event
         */
        function unHighlightObject(event: any) {
            if (typeof event.eventData != 'undefined') {
                if (RamachandranComponent.highlightedResidues.indexOf(getResidueNode(event)) == -1) {
                    d3.select('.selected-res')
                        .classed('selected-res', false)
                        .attr('d', (d: any) => RamachandranComponent.changeObjectSize(d)).transition().duration(50)
                        .style('fill', (d) => fillColorFunction(d, residueColorStyle, outliersType, rsrz, true))
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
                RamachandranComponent.highlightedResidues.forEach((d: any) => {
                    d.attr('d', (d: any) => RamachandranComponent.changeObjectSize(d)).transition().duration(50)
                        .style('fill', (dat) => fillColorFunction(dat, residueColorStyle, outliersType, rsrz))
                        .style('display', 'block');
                    // .style('opacity', (d) => {
                    //     return RamachandranComponent.computeOpacity(fillColorFunction(d, drawingType, outliersType, rsrz))
                    // });
                });
                RamachandranComponent.highlightedResidues.pop();
            }
            RamachandranComponent.highlightedResidues.push(res);
            getResidueNode(event).attr('d', (d: any) => RamachandranComponent.changeObjectSize(d, false))
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
            RamachandranComponent.hiddenResidues.forEach((dat: any) => {
                if (dat.idSelector != ''){
                    d3.select(`#${dat.idSelector}`)
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
            RamachandranComponent.hiddenResidues = RamachandranComponent.residuesOnCanvas.filter((dat: any) => {
                if (!(dat.authorResNum >= this.lastSelection.begin && dat.authorResNum <= this.lastSelection.end))
                    return dat;
                else RamachandranComponent.selectedResidues.push(dat);
            });



            RamachandranComponent.hiddenResidues.forEach((dat: any) => {
                if (dat.idSelector != '') {
                    if (d3.select(`#${dat.idSelector}`).empty()){
                        return
                    }
                    d3.select(`#${dat.idSelector}`).style('visibility', 'hidden');
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
        switch (this.residueColorStyle) {
            case 1:
                d3.selectAll('#rama-sum-div').remove();
                d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
                    .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
                    .text('Preferred regions: ' + String(RamachandranComponent.favored)
                        + ' (' + String((RamachandranComponent.favored / RamachandranComponent.jsonObject.length * 100).toFixed(0))
                        + '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-middle')
                    .text('Allowed regions: ' + String(RamachandranComponent.allowed)
                        + ' (' + String((RamachandranComponent.allowed / RamachandranComponent.jsonObject.length * 100).toFixed(0))
                        + '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-thinnest')
                    .text('Outliers: ' + String(RamachandranComponent.outliersList.length)
                        + ' (' + String((RamachandranComponent.outliersList.length / RamachandranComponent.jsonObject.length * 100).toFixed(0)) + '%)').enter();

                break;
            case 2:
                d3.selectAll('#rama-sum-div').remove();
                d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
                    .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
                    .text('Ramachandran outliers: ' + String(this.ramachandranOutliers)
                        + ' (' + String((this.ramachandranOutliers / RamachandranComponent.jsonObject.length * 100).toFixed(0)) +
                        '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-middle')
                    .text('Sidechain outliers: ' + String(this.sidechainOutliers)
                        + ' (' + String((this.sidechainOutliers / RamachandranComponent.jsonObject.length * 100).toFixed(0)) + '%)').enter();
                d3.select('#rama-sum-div').append('div').attr('class', 'rama-sum-cell')
                    .attr('id', 'rama-sum-thinnest')
                    .text('Clashes: ' + String(this.clashes)
                        + ' (' + String((this.clashes / RamachandranComponent.jsonObject.length * 100).toFixed(0)) + '%)').enter();
                break;
            case 3:
                d3.selectAll('#rama-sum-div').remove();
                d3.select('#rama-sum').append('div').attr('id', 'rama-sum-div')
                    .append('div').attr('class', 'rama-sum-cell').attr('id', 'rama-sum-widest')
                    .text('RSRZ: ' + String(this.rsrzCount)
                        + ' (' + String((this.rsrzCount / RamachandranComponent.jsonObject.length * 100).toFixed(0)) + '%) ').enter();
                break;
            default:
                return;
        }
    }


    /**
     * compute summary stats of ramachandran diagram
     * @param d
     */
    public computeStats(d: any) {
         if (this.outliersType[d.num] != undefined) {
             if (this.outliersType[d.num].outliersType.includes('clashes')) {
                 this.clashes++;
             }
             if (this.outliersType[d.num].outliersType.includes('ramachandran_outliers')) {
                 this.ramachandranOutliers++;
             }
             if (this.outliersType[d.num].outliersType.includes('sidechain_outliers')) {
                 this.sidechainOutliers++;
             }
         }
        if (typeof this.rsrz[d.num] != 'undefined') {
            this.rsrzCount++;
        }
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
    public fillColorFunction(d: any, drawingType: number, outliersType: any, rsrz: any, compute: boolean = false) {
        if (compute)
            this.computeStats(d);
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
    public static computeOpacity(fillTmp: any) {
            if (fillTmp === '#008000' || fillTmp === 'black') {
                return 0.15;
            }
            if (fillTmp === '#ff0') {
                return 0.8;
            }
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
     * @param d node
     */
    static dispatchCustomEvent(name: string, d: any, pdbId: string) {
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
     * @param ramaContourPlotType
     */
    static changeContours(data: any, toDefault: boolean = true, ramaContourPlotType: number) {
        RamachandranComponent.currentTime = new Date().getTime();
        switch (data.aa) {
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
                        if (data.cisPeptide === null && data.aa === 'PRO') {
                            RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(5, 'PRO');
                            break;
                        }
                        if (data.cisPeptide === 'Y' && data.aa === 'PRO') {
                            RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(6, 'PRO');
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
                        RamachandranComponent.baseContours(ramaContourPlotType, RamachandranComponent.contourColoringStyle);
                        RamachandranComponent.changeOpacity('', false);
                    } else {
                        RamachandranComponent.timeoutId = RamachandranComponent.getTimeout(3, '');
                    }
                }
                break;
            default:
                break;
        }
    }


    /**
     * text for tooltip
     * @param d
     * @returns {string}
     */
    static tooltipText(d: any) {
        // language=HTML
        return  `<b>${d.chain} ${d.num} ${d.aa}</b><br/>\u03A6: ${d.phi}<br/>\u03A8: ${d.psi}`;
    }


    /**
     * change object size on hover
     * @param d
     * @param {boolean} smaller
     * @returns {string | null}
     */
    static changeObjectSize(d: any, smaller: boolean = true) {
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
        if (d.aa === 'GLY') {
            RamachandranComponent.symbolTypes.triangle.size(size);
            return RamachandranComponent.symbolTypes.triangle();
        }
        RamachandranComponent.symbolTypes.circle.size(size);
        return RamachandranComponent.symbolTypes.circle();

    }


    /**
     *
     * @param d
     * @param {string} pdbId
     * @param {number} ramaContourPlotType
     * @param {number} residueColorStyle
     * @param tooltip
     * @param outliersType
     * @param rsrz
     */
    public onMouseOverResidue(d: any, pdbId: string, ramaContourPlotType: number, residueColorStyle: number,
                              tooltip: any, outliersType: any, rsrz: any){
        let highlightColor = 'yellow';
        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOver', d, pdbId);
        RamachandranComponent.changeContours(d, false, ramaContourPlotType);
        switch (residueColorStyle) {
            case 1:
                if (d.rama === 'Favored') {
                    tooltip.html(RamachandranComponent.tooltipText(d) + '<br/> Favored');
                }
                if (d.rama === 'Allowed') {
                    tooltip.html(RamachandranComponent.tooltipText(d) + '<br/> Allowed');
                }
                if (d.rama === 'OUTLIER') {
                    tooltip.html(RamachandranComponent.tooltipText(d) + '<br/><b>OUTLIER</b>');
                }
                break;
            case 2:
                let tempStr = '';
                highlightColor = 'magenta';
                if (typeof outliersType[d.num] === 'undefined') {
                    tooltip.html(RamachandranComponent.tooltipText(d));
                    break;
                }
                if (outliersType[d.num].outliersType.includes('clashes')) {
                    tempStr += '<br/>Clash';
                }
                if (outliersType[d.num].outliersType.includes('ramachandran_outliers')) {
                    tempStr += '<br/>Ramachandran outlier';
                    RamachandranComponent.tooltipWidth = 130;
                }
                if (outliersType[d.num].outliersType.includes('sidechain_outliers')) {
                    tempStr += '<br/>Sidechain outlier';
                    RamachandranComponent.tooltipWidth = 100;
                }
                if (outliersType[d.num].outliersType.includes('bond_angles')) {
                    tempStr += '<br/>Bond angles';
                } else {
                    tooltip.html(RamachandranComponent.tooltipText(d));
                }
                switch (outliersType[d.num].outliersType.length) {
                    case 2:
                        RamachandranComponent.tooltipHeight = 68;
                        break;
                    case 3:
                        RamachandranComponent.tooltipHeight = 78;
                        break;
                    default:
                        break;
                }
                tooltip.html(RamachandranComponent.tooltipText(d) + tempStr);
                break;
            case 3:
                if (typeof rsrz[d.num] === 'undefined') {
                    tooltip.html(RamachandranComponent.tooltipText(d));
                } else {
                    tooltip.html(RamachandranComponent.tooltipText(d) + '<br/><b>RSRZ outlier</b>');
                }
                break;
            default:
                break;
        }
        tooltip.transition()
            .style('opacity', .95)
            .style('left', (d3.event.pageX + 10) + 'px')
            .style('top', (d3.event.pageY - 48) + 'px')
            .style('height', RamachandranComponent.tooltipHeight)
            .style('width', String(RamachandranComponent.tooltipWidth) + 'px');

        d3.select(`#${d.idSelector}`)
            .attr('d', (d: any) => RamachandranComponent.changeObjectSize(d, false))
            .style('fill', highlightColor)
            .style('opacity', 1);
        // .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));

    }


    /**
     *
     * @param d
     * @param pdbId
     * @param {number} ramaContourPlotType
     * @param {number} residueColorStyle
     * @param tooltip
     * @param outliersType
     * @param rsrz
     * @param fillColorFunction
     */
    public onMouseOutResidue(d: any, pdbId: any, ramaContourPlotType: number, residueColorStyle: number,
                             tooltip: any, outliersType: any, rsrz: any, fillColorFunction: any) {
        let outTime = new Date().getTime();

        RamachandranComponent.dispatchCustomEvent('PDB.ramaViewer.mouseOut', d, pdbId);
        if (RamachandranComponent.highlightedResidues.indexOf(d) > -1) {
            return;
        }

        d3.select(`#${d.idSelector}`)
            .transition()
            .attr('d', (dat: any) => RamachandranComponent.changeObjectSize(dat))
            .style('fill', (d) => fillColorFunction(d, residueColorStyle, outliersType, rsrz))
            .style('opacity', (d) => {
                return RamachandranComponent.computeOpacity(fillColorFunction(d, residueColorStyle, outliersType, rsrz))
            });
        tooltip.transition()
            .style('opacity', 0);

        console.log(outTime-RamachandranComponent.currentTime);
        if ((outTime - RamachandranComponent.currentTime) > 600) {
            window.setTimeout(() => {
                RamachandranComponent.changeContours(d, true, ramaContourPlotType)
            }, 50);
        }
    }


    /**
     * change residue coloring
     * @param {number} residueColorStyle
     */
    public changeResiduesColors(residueColorStyle: number) {

        let {tooltip, outliersType, rsrz, onMouseOverResidue, pdbId, ramaContourPlotType,
            fillColorFunction, onMouseOutResidue} = this;
        let resArray = RamachandranComponent.jsonObject.slice(0);
        if (RamachandranComponent.selectedResidues.length != 0) {
            resArray = RamachandranComponent.selectedResidues.slice(0)
        }

        resArray.forEach((d: any) => {
            if (d.idSelector != '') {
                const node = d3.select(`#${d.idSelector}`);
                node.style('fill', this.fillColorFunction(d, residueColorStyle, this.outliersType, this.rsrz));
                node.style('opacity', (d) => {
                    return RamachandranComponent.computeOpacity(this.fillColorFunction(d,
                        residueColorStyle, this.outliersType, this.rsrz))
                });
                node.on('mouseover', function () {
                    if (d3.select(`#${d.idSelector}`).style('opacity')== '0')
                        return;
                    onMouseOverResidue(d, pdbId, ramaContourPlotType, residueColorStyle, tooltip, outliersType, rsrz)

                });

                node.on('mouseout', function () {
                    if (d3.select(`#${d.idSelector}`).style('opacity')== '0')
                        return;
                    window.clearTimeout(RamachandranComponent.timeoutId);

                    onMouseOutResidue(d, pdbId, ramaContourPlotType, residueColorStyle, tooltip, outliersType, rsrz, fillColorFunction)

                })
            }
        })


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
     * @param {string} aa
     * @param {boolean} makeInvisible
     */
    static changeOpacity(aa: string, makeInvisible: boolean = true) {
        let residues = aa.split(',');
        let nodes;
        let resArray = RamachandranComponent.jsonObject.slice(0);
        if (RamachandranComponent.selectedResidues.length != 0) {
            resArray = RamachandranComponent.selectedResidues.slice(0)
        }
        if (aa == '')
        {
            nodes = resArray.filter((d: any) => {
                return d.prePro == false;
            })

        } else if (residues.length > 1) {
            nodes = resArray.filter((d:any) => {
                return (residues.indexOf(d.aa) == -1)
            });

        } else {
            nodes = resArray.filter((d: any) => {
                return (d.aa != aa);
            });
        }

        nodes.forEach((d: any) => {
            if (d.idSelector == '')
                return;
            let node = d3.select(`#${d.idSelector}`);
            if (makeInvisible)
                // node.style('opacity', 0);
                node.style('display', 'none');
            else {
                node.style('display', 'block');
                // const selection: any = node.node();
                // if (selection.style.fill == 'rgb(0, 128, 0)'
                //     || selection.style.fill == 'black'
                //     || selection.style.fill == 'rgb(0, 0, 0)') {
                //     selection.style.opacity = 0.15;
                //
                // } else if (selection.style.fill == 'rgb(255, 255, 0)') {
                //     selection.style.opacity = 0.8;
                // }else {
                //     selection.style.opacity = 1;
                // }
            }
        })
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