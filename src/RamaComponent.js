"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("../public/index.css");
require("./RamachandranComponent");
require("bootstrap/dist/css/bootstrap.css");
const polymer_element_js_1 = require("@polymer/polymer/polymer-element.js");
class RamaComponent extends polymer_element_js_1.PolymerElement {
    static get template() {
        // language=HTML
        return polymer_element_js_1.html `
            <style type="text/css">
                select#rama-coloring {
                margin: 10px;
                display: inline-block;
                }
                #rama-contour-style {
                    display: inline-block;
                    margin-left: 10px;
                }
                input#contour-color-default {
                    margin: 5px;
                }
                input#contour-color {
                    margin: 5px;
                }
            </style>
        <div id=ramancontos>
        <rama-scatter 
                pdb-id={{pdbId}} 
                chains-to-show={{chainsToShow}} 
                models-to-show={{modelsToShow}}
                residue-color-style={{residueColorStyle}}
                contour-coloring-style={{contourColoringStyle}}
                rama-contour-plot-type={{ramaContourPlotType}}
                element={{element}}
        ></rama-scatter>
            <div id='ramama'>
        </div>
                <select id='rama-coloring'>
            <option value={1}>
                Default
                </option>
                <option value={2}>
            Quality
            </option>
            <option value={3}>
            RSRZ
            </option>
            </select>
            <select id='rama-plot-type'>
        <option value={1}>
            General case
        </option>
        <option value={2}>
            Isoleucine and valine
        </option>
        <option value={3}>
            Pre-proline
            </option>
            <option value={4}>
            Glycine
            </option>
            <option value={5}>
            Trans proline
        </option>
        <option value={6}>
            Cis proline
        </option>
        </select>
        <form id='rama-contour-style'>
        <label class='rama-contour-style'>
            Contour
            <input
        type='radio'
        name='contour-style'
        class='rama-contour-radio'
        id='contour-color-default'
        value={1}
        checked={true}
        />
        </label>
        <label class='rama-contour-style'>
            Heat Map
        <input
        type='radio'
        name='contour-style'
        class='rama-contour-radio'
        value={2}
        id='contour-color'
        />
        </label>
        </form>
        </div>
        `;
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
            element: {
                type: HTMLElement,
                reflectToAttribute: true
            }
        };
    }
    constructor() {
        super();
        this.residueColorStyle = 1;
        this.contourColoringStyle = 1;
        this.ramaContourPlotType = 1;
    }
    ready() {
        super.ready();
    }
}
customElements.define('rama-component', RamaComponent);
