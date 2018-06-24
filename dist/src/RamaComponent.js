"use strict";

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(["\n            <style type=\"text/css\">\n                select#rama-coloring {\n                margin: 10px;\n                display: inline-block;\n                }\n                #rama-contour-style {\n                    display: inline-block;\n                    margin-left: 10px;\n                }\n                input#contour-color-default {\n                    margin: 5px;\n                }\n                input#contour-color {\n                    margin: 5px;\n                }\n            </style>\n        <div id=ramancontos>\n        <rama-scatter \n                pdb-id={{pdbId}} \n                chains-to-show={{chainsToShow}} \n                models-to-show={{modelsToShow}}\n                residue-color-style={{residueColorStyle}}\n                contour-coloring-style={{contourColoringStyle}}\n                rama-contour-plot-type={{ramaContourPlotType}}\n                element={{element}}\n        ></rama-scatter>\n            <div id='ramama'>\n        </div>\n                <select id='rama-coloring'>\n            <option value={1}>\n                Default\n                </option>\n                <option value={2}>\n            Quality\n            </option>\n            <option value={3}>\n            RSRZ\n            </option>\n            </select>\n            <select id='rama-plot-type'>\n        <option value={1}>\n            General case\n        </option>\n        <option value={2}>\n            Isoleucine and valine\n        </option>\n        <option value={3}>\n            Pre-proline\n            </option>\n            <option value={4}>\n            Glycine\n            </option>\n            <option value={5}>\n            Trans proline\n        </option>\n        <option value={6}>\n            Cis proline\n        </option>\n        </select>\n        <form id='rama-contour-style'>\n        <label class='rama-contour-style'>\n            Contour\n            <input\n        type='radio'\n        name='contour-style'\n        class='rama-contour-radio'\n        id='contour-color-default'\n        value={1}\n        checked={true}\n        />\n        </label>\n        <label class='rama-contour-style'>\n            Heat Map\n        <input\n        type='radio'\n        name='contour-style'\n        class='rama-contour-radio'\n        value={2}\n        id='contour-color'\n        />\n        </label>\n        </form>\n        </div>\n        "], ["\n            <style type=\"text/css\">\n                select#rama-coloring {\n                margin: 10px;\n                display: inline-block;\n                }\n                #rama-contour-style {\n                    display: inline-block;\n                    margin-left: 10px;\n                }\n                input#contour-color-default {\n                    margin: 5px;\n                }\n                input#contour-color {\n                    margin: 5px;\n                }\n            </style>\n        <div id=ramancontos>\n        <rama-scatter \n                pdb-id={{pdbId}} \n                chains-to-show={{chainsToShow}} \n                models-to-show={{modelsToShow}}\n                residue-color-style={{residueColorStyle}}\n                contour-coloring-style={{contourColoringStyle}}\n                rama-contour-plot-type={{ramaContourPlotType}}\n                element={{element}}\n        ></rama-scatter>\n            <div id='ramama'>\n        </div>\n                <select id='rama-coloring'>\n            <option value={1}>\n                Default\n                </option>\n                <option value={2}>\n            Quality\n            </option>\n            <option value={3}>\n            RSRZ\n            </option>\n            </select>\n            <select id='rama-plot-type'>\n        <option value={1}>\n            General case\n        </option>\n        <option value={2}>\n            Isoleucine and valine\n        </option>\n        <option value={3}>\n            Pre-proline\n            </option>\n            <option value={4}>\n            Glycine\n            </option>\n            <option value={5}>\n            Trans proline\n        </option>\n        <option value={6}>\n            Cis proline\n        </option>\n        </select>\n        <form id='rama-contour-style'>\n        <label class='rama-contour-style'>\n            Contour\n            <input\n        type='radio'\n        name='contour-style'\n        class='rama-contour-radio'\n        id='contour-color-default'\n        value={1}\n        checked={true}\n        />\n        </label>\n        <label class='rama-contour-style'>\n            Heat Map\n        <input\n        type='radio'\n        name='contour-style'\n        class='rama-contour-radio'\n        value={2}\n        id='contour-color'\n        />\n        </label>\n        </form>\n        </div>\n        "]);

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

Object.defineProperty(exports, "__esModule", { value: true });
require("../public/index.css");
require("./RamachandranComponent");
require("bootstrap/dist/css/bootstrap.css");
var polymer_element_js_1 = require("@polymer/polymer/polymer-element.js");

var RamaComponent = function (_polymer_element_js_) {
    _inherits(RamaComponent, _polymer_element_js_);

    _createClass(RamaComponent, null, [{
        key: "template",
        get: function get() {
            // language=HTML
            return polymer_element_js_1.html(_templateObject);
        }
    }, {
        key: "properties",
        get: function get() {
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
    }]);

    function RamaComponent() {
        _classCallCheck(this, RamaComponent);

        var _this = _possibleConstructorReturn(this, (RamaComponent.__proto__ || Object.getPrototypeOf(RamaComponent)).call(this));

        _this.residueColorStyle = 1;
        _this.contourColoringStyle = 1;
        _this.ramaContourPlotType = 1;
        return _this;
    }

    _createClass(RamaComponent, [{
        key: "ready",
        value: function ready() {
            _get(RamaComponent.prototype.__proto__ || Object.getPrototypeOf(RamaComponent.prototype), "ready", this).call(this);
        }
    }]);

    return RamaComponent;
}(polymer_element_js_1.PolymerElement);

customElements.define('rama-component', RamaComponent);
//# sourceMappingURL=RamaComponent.js.map