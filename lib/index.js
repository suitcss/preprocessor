var assign = require('object-assign-deep');
var autoprefixer = require('autoprefixer');
var bemLinter = require('postcss-bem-linter');
var cssnano = require('cssnano');
var difference = require('lodash.difference');
var encapsulationPlugins = require('./encapsulation');
var isEmpty = require('lodash.isempty');
var postcss = require('postcss');
var postcssEasyImport = require('postcss-easy-import');
var reporter = require('postcss-reporter');
var stylelint = require('stylelint');
var stylelintConfigSuit = require('stylelint-config-suitcss');

module.exports = preprocessor;

/**
 * Default configuration
 * and options to PostCSS plugins
 */

var defaults = {
  debug: identity,
  lint: true,
  minify: false,
  encapsulate: false,
  use: [
    'postcss-custom-properties',
    'postcss-calc',
    'postcss-color-function',
    'postcss-custom-media',
    'postcss-apply'
  ],
  autoprefixer: {
    browsers: '> 1%, last 2 versions, safari > 6, ie > 9, ' +
      'ios > 6, android > 4.3, samsung > 3, chromeandroid > 50'
  },
  'postcss-easy-import': {
    transform: identity,
    onImport: noop
  },
  'postcss-reporter': {
    clearMessages: true
  },
  // http://cssnano.co/optimisations/
  cssnano: {
    calc: false,
    autoprefixer: false,
    mergeRules: false,
    safe: true
  }
};

/**
 * Process CSS
 *
 * @param {String} css
 * @param {Object} options
 * @param {String} filename
 * @returns {Promise}
 */

function preprocessor(css, options, filename) {
  options = mergeOptions(options);

  var plugins = [
    postcssEasyImport(options['postcss-easy-import'])
  ];

  plugins = plugins.concat(
    options.use.map(function(p) {
      var plugin = require(p);
      var settings = options[p];
      return settings ? plugin(settings) : plugin;
    })
  );

  if (options.encapsulate) {
    plugins = plugins.concat([
      encapsulationPlugins.resetGeneric,
      encapsulationPlugins.resetInherited
    ]);
  }

  // autoprefixer and postcss-reporter
  // should always be the last plugin
  plugins = plugins.concat([
    autoprefixer(options.autoprefixer),
    reporter(options['postcss-reporter'])
  ]);

  var processor = postcss(options.debug(plugins));

  if (options.minify) {
    processor.use(cssnano(options.cssnano));
  }

  return lintFile(css, options, filename).then(function(result) {
    return processor.process(result.css, options.postcss);
  });
}

/**
 * Merge options with defaults and set root
 *
 * @param {Object} options
 * @returns {Object} Merged options object
 */

function mergeOptions(options) {
  options = options || {};
  var mergedOpts = assign({}, defaults, options);
  var easyImportOpts = mergedOpts['postcss-easy-import'];
  var origTransform = easyImportOpts.transform;
  var origOnImport = easyImportOpts.onImport;

  if (mergedOpts.root) {
    easyImportOpts.root = mergedOpts.root;
  }

  easyImportOpts.transform = function(css, filename) {
    var transformedCss = origTransform(css);
    return lintFile(transformedCss, mergedOpts, filename).then(function(result) {
      return result.css;
    });
  };

  easyImportOpts.onImport = function(importedFiles) {
    updateWatchTaskFiles(importedFiles);
    origOnImport(importedFiles);
  };

  // Allow additional plugins to be merged with the defaults
  // but remove any duplicates so that it respects the new order
  if (!isEmpty(options.use)) {
    var plugins = difference(mergedOpts.use, options.use);
    // Remove core plugins. Can't reorder them
    var userPlugins = difference(options.use, [
      'postcss-easy-import',
      'autoprefixer',
      'postcss-reporter'
    ]);
    mergedOpts.use = plugins.concat(userPlugins);
  }
  return mergedOpts;
}

/**
 * Lint component with postcss-bem-linter and stylelint
 *
 * @param {String} css
 * @param {Object} options
 * @param {String} filename
 * @returns {Promise} Used by postcss-import transform
 */
function lintFile(css, options, filename) {
  var processor = postcss();

  if (options.lint) {
    processor
      .use(stylelint(options.stylelint || stylelintConfigSuit))
      .use(bemLinter(options['postcss-bem-linter']));
  }

  // Merge filename alongside any other `postcss` options
  assign(options, {
    postcss: {from: filename}
  });

  processor
    .use(reporter(options['postcss-reporter']));

  if (isPromise(css)) {
    return css.then(function(css) { // eslint-disable-line no-shadow
      return processor.process(css, options.postcss);
    });
  }

  return processor.process(css, options.postcss);
}

function isPromise(obj) {
  return typeof obj.then === 'function';
}

function noop() {}

function identity(x) {
  return x;
}

function updateWatchTaskFiles(files) {
  if (typeof global.watchCSS === 'function') {
    global.watchCSS(files);
  }
}
