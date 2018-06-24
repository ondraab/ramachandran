"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const d3 = require("d3");
const polymer_element_js_1 = require("@polymer/polymer/polymer-element.js");
const HeatMapContours_1 = require("../contours/HeatMapContours");
const LineContours_1 = require("../contours/LineContours");
require("bootstrap/dist/css/bootstrap.css");
require("../public/index.css");
const parsePdb_1 = require("./parsePdb");
class RamachandranComponent extends polymer_element_js_1.PolymerElement {
    constructor() {
        super();
        // this.pdbId = '1tqn';
        // console.log(this.pdbId);
        this.createChart = this.createChart.bind(this);
        // const pdb = new ParsePDB(this.pdbId);
        // pdb.downloadAndParse();
        //
        // this.jsonObject = pdb.residueArray;
        // this.outliersType = pdb.outlDict;
        // this.rsrz = pdb.rsrz;
        //
        // this.ramachandranOutliers = 0;
        // this.sidechainOutliers = 0;
        // this.rsrzCount = 0;
        // this.clashes = 0;
        // this.firstRun = true;
        // this.highlightedResidues = [];
        // this.createChart();
        // this.state = {
        //     chainsToShow: ['A'],
        //     contourColoringStyle: 1,
        //     element: this.props.element,
        //     initial: true,
        //     modelsToShow: [1],
        //     pdb: this.props.pdbID,
        //     ramaContourPlotType: this.props.ramaContourPlotType,
        //     residueColorStyle: 1,
        // };
        this.fillColorFunction = this.fillColorFunction.bind(this);
    }
    connectedCallback() {
        const pdb = new parsePdb_1.default(this.pdbId);
        pdb.downloadAndParse();
        this.jsonObject = pdb.residueArray;
        this.outliersType = pdb.outlDict;
        this.rsrz = pdb.rsrz;
        this.ramachandranOutliers = 0;
        this.sidechainOutliers = 0;
        this.ramaContourPlotType = 1;
        this.contourColoringStyle = 1;
        this.residueColorStyle = 1;
        this.modelsToShowNumbers = [];
        this.modelsToShow.map((d) => {
            this.modelsToShowNumbers.push(parseInt(d));
        });
        this.rsrzCount = 0;
        this.clashes = 0;
        this.firstRun = true;
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
    static get template() {
        return null;
    }
    // public componentWillUpdate(nextProps: any, nextState: any) {
    //
    //     if (nextProps.pdbID !== this.state.pdb || nextProps.chainsToShow !== this.state.chainsToShow ||
    //         nextProps.modelsToShow !== this.state.modelsToShow) {
    //         this.updateChart(nextProps.chainsToShow, nextProps.ramaContourPlotType, nextProps.modelsToShow,
    //             nextProps.residueColorStyle);
    //         // console.log(nextProps.contourColoringStyle, this.state.contourColoringStyle);
    //     }
    //     if (nextProps.ramaContourPlotType !== this.state.ramaContourPlotType) {
    //         // this.updateChart(nextProps.chainsToShow, nextProps.ramaContourPlotType, nextProps.modelsToShow,
    //         //                  nextProps.residueColorStyle);
    //         this.updateChart(nextProps.chainsToShow, nextProps.ramaContourPlotType, nextProps.modelsToShow,
    //             nextProps.residueColorStyle);
    //         this.basicContours(nextProps.ramaContourPlotType, nextProps.contourColoringStyle);
    //     } else if (nextProps.residueColorStyle !== this.state.residueColorStyle) {
    //         this.updateChart(nextProps.chainsToShow, nextProps.ramaContourPlotType, nextProps.modelsToShow,
    //             nextProps.residueColorStyle);
    //     } else if (nextProps.contourColoringStyle !== this.state.contourColoringStyle) {
    //         // console.log(nextProps.contourColoringStyle, this.state.contourColoringStyle);
    //         this.basicContours(nextProps.ramaContourPlotType, nextProps.contourColoringStyle);
    //     }
    //
    // }
    // public shouldComponentUpdate(nextProps: any, nextState: any) {
    //     if (nextState.pdb.length === 4 && nextProps.pdbID !== this.state.pdb)  {
    //         return true;
    //     }
    //     if (nextProps.ramaContourPlotType !== this.state.ramaContourPlotType) {
    //         return true;
    //     }
    //     if (nextProps.contourColoringStyle !== this.state.contourColoringStyle) {
    //         return true;
    //     }
    //     if (nextProps.modelsToShow.length !== this.state.modelsToShow.length) {
    //         return true;
    //     }
    //     if (nextProps.residueColorStyle !== this.state.residueColorStyle) {
    //         return true;
    //     }
    //     return nextProps.chainsToShow.length !== this.state.chainsToShow.length;
    // }
    createChart() {
        let width = 500, height = 500;
        // let element = document.getElementById('rama-root');
        // const node = document.createElement('div');
        // node.setAttribute('id', 'ramachandran-root-element');
        // element.appendChild(node);
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
        this.canvasContainer = d3.select('#rama-svg-container')
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
            .attr('x', 0 - (height / 2))
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
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers, this.residueColorStyle);
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
            this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers, this.residueColorStyle);
            this.basicContours(this.ramaContourPlotType, this.contourColoringStyle);
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
            this.contourColoringStyle = parseInt(d3.select('input[name="contour-style"]:checked').property('value'));
            this.basicContours(this.ramaContourPlotType, this.contourColoringStyle);
        });
        this.updateChart(this.chainsToShow, this.ramaContourPlotType, this.modelsToShowNumbers, this.residueColorStyle);
        this.basicContours(this.ramaContourPlotType, this.contourColoringStyle);
    }
    fillColorFunction(d, drawingType, outliersType, rsrz, compute = false) {
        switch (drawingType) {
            case 1:
                if (d.rama === 'OUTLIER') {
                    return '#f00';
                }
                return 'black';
            case 2:
                if (typeof outliersType[d.num] === 'undefined') {
                    return '#008000';
                }
                else {
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
                }
                else {
                    if (compute === true) {
                        this.rsrzCount++;
                    }
                    return '#f00';
                }
            default:
                break;
        }
    }
    updateChart(chainsToShow, ramaContourPlotType, entityToShow, drawingType) {
        this.svgContainer.selectAll('g.dataGroup').remove();
        let width = 500;
        const tooltip = this.tooltip;
        const { jsonObject, fillColorFunction, outliersType, rsrz, highlightedResidues } = this;
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
        function switchPlotType(d, i) {
            switch (ramaContourPlotType) {
                case 1:
                    return d;
                case 2:
                    if (d.aa === 'ILE' || d.aa === 'VAL') {
                        return d;
                    }
                    break;
                case 3:
                    if (i + 1 !== jsonObject.length && jsonObject[i + 1].aa === 'PRO') {
                        return d;
                    }
                    break;
                case 4:
                    if (d.aa === 'GLY') {
                        return d;
                    }
                    break;
                case 5:
                    if (d.cisPeptide === null && d.aa === 'PRO') {
                        return d;
                    }
                    break;
                case 6:
                    if (d.cisPeptide === 'Y' && d.aa === 'PRO') {
                        return d;
                    }
                    break;
                default:
                    return d;
            }
        }
        function tooltipText(d) {
            // language=HTML
            return `<b>${d.chain} ${d.num} ${d.aa}</b><br/>\u03A6: ${d.phi}<br/>\u03A8: ${d.psi}`;
        }
        function compare(a, b) {
            switch (drawingType) {
                case 1:
                    if (a.rama === 'OUTLIER') {
                        return a;
                    }
                    if (a.rama === 'Allowed') {
                        return a;
                    }
                    if (a.rama === 'Favored') {
                        return a;
                    }
                    break;
                case 2:
                    if (typeof outliersType[a.num] === 'undefined') {
                        return b;
                    }
                    else if (typeof outliersType[b.num] === 'undefined') {
                        return a;
                    }
                    else if (outliersType[a.num].outliersType.length > outliersType[b.num].outliersType.length) {
                        return a;
                    }
                    else {
                        return b;
                    }
                case 3:
                    if (typeof rsrz[a.num] === 'undefined') {
                        return b;
                    }
                    else {
                        return a;
                    }
                default:
                    break;
            }
        }
        // sort because of svg z-index
        jsonObject.sort((a, b) => {
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
                    }
                    else if (typeof outliersType[b.num] === 'undefined') {
                        return 1;
                    }
                    else if (outliersType[a.num].outliersType.length > outliersType[b.num].outliersType.length) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                case 3:
                    if (typeof rsrz[a.num] === 'undefined') {
                        return -1;
                    }
                    else if (typeof rsrz[b.num] === 'undefined') {
                        return 1;
                    }
                    else {
                        return 1;
                    }
                default:
                    break;
            }
        });
        // outliersText
        d3.selectAll('.outliers').remove();
        d3.selectAll('table').remove();
        let favored = 0;
        let allowed = 0;
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
        //
        this.outliersTable = d3.select('.outliers-container').append('div')
            .attr('class', 'outliers').append('table')
            .attr('class', 'table table-hover table-responsive');
        function dispatchCustomEvent(name, d) {
            const event = new CustomEvent(name, { detail: {
                    chainId: d.chain,
                    entityId: d.modelId,
                    entry: pdbId,
                    residueName: d.aa,
                    residueNumber: d.num
                } });
            window.dispatchEvent(event);
        }
        this.svgContainer.selectAll('.shapes')
            .data(jsonObject.filter((d, i) => {
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
            const fillTmp = fillColorFunction(d, drawingType, outliersType, rsrz);
            if (fillTmp === '#008000' || fillTmp === 'black') {
                return 0.15;
            }
            if (fillTmp === '#ff0') {
                return 0.8;
            }
            return 1;
        })
            .on('mouseover', function (d) {
            let height = 58;
            let width = 90;
            dispatchCustomEvent('PDB.ramaViewer.mouseOver', d);
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
                    }
                    else {
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
                    }
                    else {
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
                .attr('d', (d) => changeObjectSize(d, false))
                .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
        })
            .on('mouseout', function (d) {
            dispatchCustomEvent('PDB.ramaViewer.mouseOut', d);
            if (highlightedResidues.indexOf(d) > -1) {
                return;
            }
            d3.select(this)
                .transition()
                // .duration(50)
                .attr('d', (dat) => changeObjectSize(dat))
                // .style('fill', 'transparent')
                .style('fill', (d) => fillColorFunction(d, drawingType, outliersType, rsrz));
            // .style('fillColorFunction-width', '0.5');
            tooltip.transition()
                // .duration(50)
                .style('opacity', 0);
        })
            .on('click', function (d) {
            if (highlightedResidues.indexOf(d) > -1) {
                unHighlightObject(true);
                return;
            }
            unHighlightObject(true);
            dispatchCustomEvent('PDB.ramaViewer.click', d);
            highlightedResidues.push(d);
            d3.select(this)
                .attr('d', (d) => changeObjectSize(d, false))
                .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
        });
        outliersList.sort((a, b) => a.num - b.num);
        // this.setState({
        //     initial: false
        // });
        this.firstRun = false;
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
        // const butt = d3.select('div#ramachandran-root-element').append('button').text('OK');
        // butt.on('mouseover', () => {
        //     unHighlightObject(false);
        //     d3.select('path#ASN-A-1-14').attr('d', (dat: any) => {
        //         if (dat.aa === 'GLY') {
        //             symbolTypes.triangle.size(175);
        //             return symbolTypes.triangle();
        //         }
        //         symbolTypes.circle.size(175);
        //         return symbolTypes.circle();
        //     });
        // }).on('mouseout', (d: any) => {
        //     unHighlightObject(false);
        // });
        //
        // const butt2 = d3.select('div#ramachandran-root-element').append('button').text('OK');
        // butt2.on('mouseover', () => {
        //     unHighlightObject(false);
        //     d3.select('path#VAL-A-1-26').attr('d', (dat: any) => {
        //         if (dat.aa === 'GLY') {
        //             symbolTypes.triangle.size(175);
        //             return symbolTypes.triangle();
        //         }
        //         symbolTypes.circle.size(175);
        //         return symbolTypes.circle();
        //     });
        // }).on('mouseout', (d: any) => {
        //     unHighlightObject(false);
        // });
        //
        // const butt3 = d3.select('div#ramachandran-root-element').append('button').text('OK');
        // butt3.on('click', () => {
        //     const res = d3.select('path#TRP-A-1-87');
        //     if (highlightedResidues.indexOf(res) > -1) {
        //         unHighlightObject(true);
        //         return;
        //     }
        //     unHighlightObject(true);
        //     highlightedResidues.push(res);
        //     highLightObject(event);
        // }).on('mouseover', () => {
        //     unHighlightObject(false);
        //     d3.select('path#TRP-A-1-87').attr('d', (dat: any) => {
        //         if (dat.aa === 'GLY') {
        //             symbolTypes.triangle.size(175);
        //             return symbolTypes.triangle();
        //         }
        //         symbolTypes.circle.size(175);
        //         return symbolTypes.circle();
        //     });
        // }).on('mouseout', (d: any) => {
        //     unHighlightObject(false);
        // });
        function changeObjectSize(d, smaller = true) {
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
        function unHighlightObject(all = true) {
            if (all) {
                highlightedResidues.forEach((d) => {
                    d3.select('#' + d._idSlector)
                        .attr('d', (d) => changeObjectSize(d)).transition().duration(50);
                });
                highlightedResidues.pop();
                return;
            }
            d3.selectAll('path').filter((d) => {
                if (d) {
                    if (highlightedResidues.indexOf(d) === -1) {
                        return d;
                    }
                }
            }).each((d) => d).attr('d', (d) => changeObjectSize(d)).transition().duration(50);
            // if (!all) {
            //     d3.selectAll('path').filter((d: any) => {
            //         if (d) {
            //             if (d.spProp === true) {
            //                 d.spProp = false;
            //                 return d;
            //             }
            //         }
            //     }).each((d) => d).attr('d', (d: any) => changeObjectSize(d)).transition().duration(50);
            // }
            // highlightedResidues.forEach((d: any) => {
            //     if (all && d.spProp) {
            //         d.spProp = false;
            //         return;
            //     }
            //     d3.select('#' + d._idSlector).attr('d', (d: any) => changeObjectSize(d)).transition().duration(50);
            // });
            // d3.selectAll('path').filter((d: any) => {
            //     if (d) {
            //         if (all) {
            //             if (d.spProp) {
            //                 d.spProp = false;
            //             }
            //             return d;
            //         }
            //         if (d.spProp === false) {
            //             return d;
            //         }
            //     }
            // }).each((d) => d).attr('d', (dat: any) => {
            //     if (dat) {
            //         // console.log(dat.aa);
            //         if (dat.aa === 'GLY') {
            //             symbolTypes.triangle.size(objSize);
            //             return symbolTypes.triangle();
            //         }
            //         symbolTypes.circle.size(objSize);
            //         return symbolTypes.circle();
            //     }
            // }).transition().duration(50);
        }
        function getRes(event) {
            return d3.select('path#' + event.eventData.residuesName + '-' +
                event.eventData.chainId + '-' +
                event.eventData.entityId + '-' +
                event.eventData.residueNumber);
        }
        function highLightObject(event) {
            // highlightedResidues.push(res);
            getRes(event).attr('d', (d) => changeObjectSize(d, false))
                .style('fill', (dat) => fillColorFunction(dat, drawingType, outliersType, rsrz));
        }
        window.addEventListener('PDB.litemol.mouseover', (event) => {
            unHighlightObject(false);
            highLightObject(event);
        });
        window.addEventListener('PDB.litemol.click', (event) => {
            const res = getRes(event);
            if (highlightedResidues.indexOf(res) > -1) {
                unHighlightObject(true);
                return;
            }
            unHighlightObject(true);
            highlightedResidues.push(res);
            highLightObject(event);
        });
        window.addEventListener('PDB.litemol.mouseout', (event) => {
            if (highlightedResidues.indexOf(event) > -1) {
                return;
            }
            unHighlightObject(false);
        });
        window.addEventListener('PDB.topologyViewer.click', (event) => {
            const res = getRes(event);
            if (highlightedResidues.indexOf(res) > -1) {
                unHighlightObject(true);
                return;
            }
            unHighlightObject(true);
            highlightedResidues.push(res);
            highLightObject(event);
        });
        window.addEventListener('PDB.topologyViewer.mouseover', (event) => {
            unHighlightObject(false);
            highLightObject(event);
        });
        window.addEventListener('PDB.topologyViewer.mouseout', () => {
            if (highlightedResidues.indexOf(event) > -1) {
                return;
            }
            unHighlightObject(false);
        });
        this.sidechainOutliers = 0;
        this.rsrzCount = 0;
        this.clashes = 0;
        this.ramachandranOutliers = 0;
        // this.addTable(outliersList, drawingType);
    }
    basicContours(ramaContourPlotType, contourColorStyle) {
        d3.select('#rama-canvas').empty();
        d3.selectAll('.contour-line').remove();
        const canvas = this.canvasContainer;
        // let svg = this.svgContainer;
        let width = 500, height = 500;
        // console.log(ramaContourPlotType);
        if (width > 768) {
            width = 580;
        }
        if (height > 768) {
            height = 580;
        }
        //
        // let node: any = (d3.select('svg.svg-container').node());
        // let width = (node.getBoundingClientRect().width) - this.leftPadding - this.padding;
        // let height = (node.getBoundingClientRect().height) - this.leftPadding - this.padding;
        // console.log(width, height);
        // const xScale = d3.scaleLinear()
        //     .domain([-180, 180])
        //     .range([0, (width)]);
        //     // .range([0, (0.985 * width)]);
        //
        // const yScale = d3.scaleLinear()
        //     .domain([180, -180])
        //     .range([0, (height)]);
        //     // .range([0, (0.985 * height)]);
        // let url = 'https://raw.githubusercontent.com/ondraab/rama/master/public/data/';
        const img = new Image();
        const svgImg = new Image();
        switch (ramaContourPlotType) {
            case 1:
                // url += 'rama8000-general-noGPIVpreP.csv';
                img.src = HeatMapContours_1.generalContour;
                svgImg.src = LineContours_1.lineGeneralContour;
                break;
            case 2:
                // url += 'rama8000-ileval-nopreP.csv';
                img.src = HeatMapContours_1.ileVal;
                svgImg.src = LineContours_1.lineIleVal;
                break;
            case 3:
                // url += 'rama8000-prepro-noGP.csv';
                img.src = HeatMapContours_1.prePro;
                svgImg.src = LineContours_1.linePrePro;
                break;
            case 4:
                // url += 'rama8000-gly-sym.csv';
                img.src = HeatMapContours_1.gly;
                svgImg.src = LineContours_1.lineGly;
                break;
            case 5:
                // url += 'rama8000-transpro.csv';
                img.src = HeatMapContours_1.transPro;
                svgImg.src = LineContours_1.lineTransPro;
                break;
            case 6:
                // url += 'rama8000-cispro.csv';
                img.src = HeatMapContours_1.cisPro;
                svgImg.src = LineContours_1.lineCisPro;
                break;
            default:
                return;
        }
        const context = canvas.node().getContext('2d');
        context.clearRect(0, 0, width + 80, height + 60);
        if (contourColorStyle == 2) {
            context.globalAlpha = 0.6;
            img.onload = () => {
                context.drawImage(img, 0, 0, width, height * img.height / img.width);
            };
        }
        else {
            context.globalAlpha = 1;
            svgImg.onload = () => {
                context.drawImage(svgImg, 0, 0, width, height * svgImg.height / svgImg.width);
            };
            //
            // setTimeout(function () {
            //             // let s = new XMLSerializer().serializeToString(document.getElementById('rama-svg'));
            //             // let encode = window.btoa(s);
            //     let enc: any = document.getElementById('rama-canvas');
            //     console.log(enc.toDataURL());
            //         }, 3000);
            // d3.csv(url, function (error: any, data: any) {
            //     if (error) {
            //         throw error;
            //     }
            //
            //     data.sort(function (a: any, b: any) {
            //         return b.value - a.value;
            //     });
            //     data.forEach(function (d: any) {
            //         d.psi = +d.psi;
            //         d.phi = +d.phi;
            //         d.value = +d.value;
            //     });
            //     //
            //     // scale(0.965, 0.965), translate(16, 16)
            //     let scale = '';
            //     switch (ramaContourPlotType) {
            //         case '2':
            //             data = data.slice(0, data.length / 2.7);
            //             break;
            //         case '3':
            //             data = data.slice(0, data.length / 2.5);
            //             break;
            //         case '4':
            //             data = data.slice(0, data.length / 1.5);
            //             break;
            //         case '5':
            //             data = data.slice(0, data.length / 3.7);
            //             break;
            //         case '6':
            //             data = data.slice(0, data.length / 2.2);
            //             break;
            //         default:
            //
            //             // console.log(data[0], data[data.length-1]);
            //             data = data.slice(0, (data.length / 2.1) - 850);
            //             // data.splice(0, data.length-1000);
            //     }
            //     let median = d3.median(data, function (d: any) {
            //         return d.value;
            //     });
            //     let max = d3.max(data, function (d: any) {
            //         return +d.value;
            //     });
            //     let min = d3.min(data, function (d: any) {
            //         return +d.value;
            //     });
            //     //
            //     // let line = d3.line();
            //     console.log(data.length);
            //     svg.selectAll('.shapes')
            //         .data(d3Contour.contourDensity()
            //             .x(function (d: any) {
            //                 return xScale(d.phi);
            //             })
            //             .y(function (d: any) {
            //                 return yScale(d.psi);
            //             })
            //             .size([height, width])
            //             .thresholds(d3.range(median, max, 5))
            //             .cellSize(1)
            //             .bandwidth(6)
            //             (data))
            //         .enter()
            //         .append('path')
            //         .attr('fillColorFunction', '#1359eb')
            //         .attr('fillColorFunction-width', '2')
            //         .attr('fill', 'none')
            //         .attr('class', 'contour-line')
            //         .attr('margin', '30px')
            //         .attr('d', d3.geoPath())
            //         .attr('transform', scale)
            //         .attr('clip-path', 'url(#clipRect)');
            //     // svg.selectAll('.shapes')
            //     //     .data(d3Contour.contourDensity()
            //     //         .x(function (d: any) {
            //     //             return xScale(d.phi);
            //     //         })
            //     //         .y(function (d: any) {
            //     //             return yScale(d.psi);
            //     //         })
            //     //         .size([height, width])
            //     //         .thresholds(d3.ticks(min, max, 1))
            //     //         .thresholds(d3.range(min, max))
            //     //         .cellSize(1)
            //     //         .bandwidth(1)
            //     //         (data))
            //     //     //
            //     //     .enter()
            //     //     .append('path')
            //     //     .attr('fillColorFunction', '#1359eb')
            //     //     .attr('fillColorFunction-width', '2')
            //     //     .attr('fill', 'none')
            //     //     .attr('class', 'line')
            //     //     .attr('id', 'contour-basis-line')
            //     //     .attr('margin', '30px')
            //     //     .attr('d', d3.geoPath())
            //     //     .attr('transform', scale);
            //     let pa: any = document.getElementById('contour-basis-line');
            //     // scale(0.99, 0.99),
            //     switch (ramaContourPlotType) {
            //         //
            //         case '3':
            //             data = data.slice(0, data.length / 2.9);
            //             break;
            //         case '2':
            //             data = data.slice(0, data.length / 3);
            //             break;
            //         case '4':
            //             data = data.slice(0, data.length / 1.65);
            //             break;
            //         case '5':
            //             data = data.slice(0, data.length / 1.8);
            //             break;
            //         case '6':
            //             data = data.slice(0, data.length / 2.2);
            //             break;
            //         default:
            //             data = data.slice(0, data.length / 2.7);
            //             break;
            //     }
            //     console.log(data.length);
            //     svg.selectAll('.shapes')
            //         .data(d3Contour.contourDensity()
            //             .x(function (d: any) {
            //                 return xScale(d.phi);
            //             })
            //             .y(function (d: any) {
            //                 return yScale(d.psi);
            //             })
            //             .size([height, width])
            //             .thresholds(d3.range(median, max, 5))
            //             .cellSize(1)
            //             .bandwidth(6)
            //             (data))
            //         .enter()
            //         .append('path')
            //         .attr('fillColorFunction', '#3ee2eb')
            //         .attr('fillColorFunction-width', '2')
            //         .attr('fill', 'none')
            //         .attr('class', 'contour-line')
            //         .attr('margin', '30px')
            //         .attr('d', d3.geoPath())
            //         .attr('transform', scale);
            //    // scale(0.99,0.99),
            // });
            // if (ramaContourPlotType !== '1') {
            //     setTimeout(function () {
            //         let s = new XMLSerializer().serializeToString(document.getElementById('rama-svg'));
            //         let encode = window.btoa(s);
            //         console.log('data:image/svg+xml;base64,' + encode);
            //     },         3000);
            // }
            //
        }
    }
    addTable(sortedTable, drawingType) {
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
            .on('mouseover', function (d) {
            d3.select(this)
                .style('background-color', '#b4bed6')
                .style('cursor', 'pointer');
            d3.select('#' + d.aa + '-' + d.chain + '-' + d.modelId + '-' + d.num)
                .attr('d', (dat) => {
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
            .on('mouseout', function (d) {
            d3.select(this)
                .style('background-color', 'transparent')
                .style('cursor', 'default');
            d3.select('#' + d.aa + '-' + d.chain + '-' + d.modelId + '-' + d.num)
                .transition()
                // .duration(50)
                .attr('d', (dat) => {
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
customElements.define('ramachandran-component', RamachandranComponent);
