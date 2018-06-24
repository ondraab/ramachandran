'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _templateObject = _taggedTemplateLiteral(['\n      <style>\n        :host {\n          display: inline-block;\n        }\n        iron-icon {\n          fill: rgba(0,0,0,0);\n          stroke: currentcolor;\n        }\n        :host([pressed]) iron-icon {\n          fill: currentcolor;\n        }\n      </style>\n\n      <!-- shadow DOM goes here -->\n      <iron-icon icon="polymer"></iron-icon>\n    '], ['\n      <style>\n        :host {\n          display: inline-block;\n        }\n        iron-icon {\n          fill: rgba(0,0,0,0);\n          stroke: currentcolor;\n        }\n        :host([pressed]) iron-icon {\n          fill: currentcolor;\n        }\n      </style>\n\n      <!-- shadow DOM goes here -->\n      <iron-icon icon="polymer"></iron-icon>\n    ']);

var _polymerElement = require('@polymer/polymer/polymer-element.js');

require('@polymer/iron-icon/iron-icon.js');

function _taggedTemplateLiteral(strings, raw) { return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IconToggle = function (_PolymerElement) {
  _inherits(IconToggle, _PolymerElement);

  _createClass(IconToggle, null, [{
    key: 'template',
    get: function get() {
      return (0, _polymerElement.html)(_templateObject);
    }
  }]);

  function IconToggle() {
    _classCallCheck(this, IconToggle);

    return _possibleConstructorReturn(this, (IconToggle.__proto__ || Object.getPrototypeOf(IconToggle)).call(this));
  }

  return IconToggle;
}(_polymerElement.PolymerElement);

customElements.define('icon-toggle', IconToggle);
//# sourceMappingURL=icon-toggle.js.map