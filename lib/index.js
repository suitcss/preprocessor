/**
 * Module dependencies
 */

var assign = require('object-assign');
var autoprefixer = require('autoprefixer');
var bemLinter = require('postcss-bem-linter');
var postcss = require('postcss');
var reporter = require('postcss-reporter');

/**
 * Module export
 */

module.exports = preprocessor;

var defaults = {
  use: [
    'postcss-import',
    'postcss-custom-properties',
    'postcss-calc',
    'postcss-custom-media',
    'autoprefixer',
    'postcss-reporter'
  ],
  'autoprefixer': {},
  'postcss-import': {
    transform: function (css, filename) {
      return postcss([bemLinter, reporter]).process(css, {from: filename}).css;
    }
  },
  'postcss-reporter': {
      clearMessages: true
  }
};


/**
 * Process CSS
 *
 * @param {String} css
 * @return {String}
 */

function preprocessor(css, options) {
  if (typeof css !== 'string') {
    throw new Error('suitcss-preprocessor: did not receive a String');
  }

  options = options || {};
  options.config = options.config || {};

  var mergedOptions = assign(defaults, options.config);
  mergedOptions['postcss-import'].root = options.root;

  var plugins = mergedOptions.use.map(function (p) {
    var plugin = require(p);
    settings = mergedOptions[p];

    return settings ? plugin(settings) : plugin;
  });

  css = postcss(plugins).process(css).css;

  return css;
}
