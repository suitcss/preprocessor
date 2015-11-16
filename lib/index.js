/**
 * Module dependencies
 */

var autoprefixer = require('autoprefixer');
var postcss = require('postcss');
var atImport = require('postcss-import');
var calc = require('postcss-calc');
var customMedia = require('postcss-custom-media');
var customProperties = require('postcss-custom-properties');
var reporter = require('postcss-reporter');
var bemLinter = require('postcss-bem-linter');

/**
 * Module export
 */

module.exports = preprocessor;

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

  css = postcss([
    atImport({
      root: options.root,
      transform: function(css, filename) {
        return postcss([bemLinter, reporter]).process(css, {from: filename}).css;
      }
    }),
    calc,
    customProperties,
    customMedia,
    autoprefixer({browsers: options.browsers}),
    reporter({clearMessages: true})
  ]).process(css).css;

  return css;
}
