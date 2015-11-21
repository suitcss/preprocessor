/**
 * Module dependencies
 */

var merge = require('deepmerge');
var atImport = require('postcss-import');
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

  defaults['postcss-import'].root = options.root;
  defaults.autoprefixer.browsers = options.browsers;
  options.config = merge(defaults, options.config || {});

  var plugins = options.config.use.map(function (p) {
    var plugin = require(p);
    settings = options.config[p];
    return settings ? plugin(settings) : plugin;
  });

  css = postcss(plugins).process(css).css;

  return css;
}
