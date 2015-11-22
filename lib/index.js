/**
 * Module dependencies
 */
var assign = require('object-assign-deep');
var without = require('lodash/array/without');
var last = require('lodash/array/last');
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
    },
    root: undefined,
    onImport: function(imported) {
      // Update the watch task with the list of imported files
      if (typeof global.watchCSS === 'function') {
        global.watchCSS(imported);
      }
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

  options = mergeOptions(options);

  var plugins = options.use.map(function (p) {
    var plugin = require(p);
    settings = options[p];

    return settings ? plugin(settings) : plugin;
  });

  css = postcss(plugins).process(css).css;

  return css;
}


/**
 * Merge options with defaults and set root
 *
 * @param {Object} options
 */

function mergeOptions(options) {
  options = options || {};
  options.config = options.config || {};

  var merged = assign({}, defaults, options.config);
  merged['postcss-import'].root = options.root;

  // Ensure postcss-reporter is always the final plugin
  if (last(merged.use) !== 'postcss-reporter') {
    var plugins = without(merged.use, 'postcss-reporter');
    plugins.push('postcss-reporter');
    merged.use = plugins;
  }

  return merged;
}
