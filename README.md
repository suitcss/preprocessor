# suitcss-preprocessor

[![Build Status](https://travis-ci.org/suitcss/preprocessor.svg?branch=master)](https://travis-ci.org/suitcss/preprocessor) [![Build status](https://ci.appveyor.com/api/projects/status/txiwk8cppv3eno3x?svg=true)](https://ci.appveyor.com/project/simonsmith/preprocessor)

[SUIT CSS](https://github.com/suitcss/suit) preprocessor.

Provides a CLI and Node.js interface for a preprocessor that combines
various [PostCSS](https://github.com/postcss/postcss) plugins.

Compiles CSS packages with:

* [postcss-easy-import](https://github.com/TrySound/postcss-easy-import)
* [postcss-custom-properties](https://github.com/postcss/postcss-custom-properties)
* [postcss-calc](https://github.com/postcss/postcss-calc)
* [postcss-custom-media](https://github.com/postcss/postcss-custom-media)
* [autoprefixer](https://github.com/postcss/autoprefixer)

Each imported file is linted with [postcss-bem-linter](https://github.com/postcss/postcss-bem-linter) and minification is provided by [cssnano](http://cssnano.co/). Code style can also be checked with [stylelint](http://stylelint.io/)

Additional plugins can be added via the configuration options.

## Installation

```
npm install suitcss-preprocessor
```

## Usage

```
suitcss input.css output.css
```

## API

### Command Line

```
Usage: suitcss [<input>] [<output>]

Options:

  -h, --help                output usage information
  -V, --version             output the version number
  -m, --minify              minify output with cssnano
  -l, --lint                ensure code adheres to the SUIT code style
  -i, --import-root [path]  the root directory for imported css files
  -c, --config [path]       a custom PostCSS config file
  -v, --verbose             log verbose output for debugging
  -w, --watch               watch the input file and any imports for changes

Examples:

  # pass an input and output file:
  $ suitcss input.css output.css

  # configure the import root directory:
  $ suitcss --import-root src/css input.css output.css

  # watch the input file and imports for changes:
  $ suitcss --watch input.css output.css

  # configure postcss plugins with a config file:
  $ suitcss --config config.js input.css output.css

  # unix-style piping to stdin and stdout:
  $ cat input.css | suitcss | grep background-color
```

### Node.js

Returns a [PostCSS promise](http://api.postcss.org/LazyResult.html)

```js
var preprocessor = require('suitcss-preprocessor');
var fs = require('fs');

var css = fs.readFileSync('src/components/index.css', 'utf8');

preprocessor(css, {
  root: 'path/to/css',
  minify: true,
}).then(function(result) {
  fs.writeFileSync('build/bundle.css', result.css);
});
```

#### Options

##### `root`

* Type: `String`
* Default: `process.cwd()`

Where to resolve imports from. Passed to [`postcss-import`](https://github.com/postcss/postcss-import/blob/master/README.md#root).

##### `debug`

* Type: `Function`
* Default: identity (it does nothing)

Before preprocessing `debug` is invoked on the postcss `plugins` array.
This allows you to pass a [`postcss-debug`](https://www.npmjs.com/package/postcss-debug) instance.

```javascript
var preprocessor = require('suitcss-preprocessor');
var createDebugger = require('postcss-debug').createDebugger;
var debug = createDebugger();

preprocessor(css, {
  debug: debug
}).then(function () {
  debug.inspect();
});
```

N.B. `debug` should always take one argument that is `plugins` and eventually return it:

```javascript
function debug(plugins) {
  // do something with plugins here
  return plugins;
}
```

##### `lint`

* Type: `Boolean`
* Default: `false`

Ensure code conforms to the [SUIT code style](https://github.com/suitcss/suit/blob/master/doc/STYLE.md)
by using the [stylelint-config-suitcss](https://github.com/suitcss/stylelint-config-suitcss) package.

Stylelint [configuration
options](http://stylelint.io/?/docs/user-guide/configuration.md) can also be
overridden but this requires the `stylelint-config-suitcss` to be installed
locally in your package.

```js
{
  lint: true,
  stylelint: {
    extends: 'stylelint-config-suitcss',
    rules: {
      indentation: [4, 'tab'],
    }
  }
}
```

##### `minify`

* Type: `Boolean`
* Default: `false`

If set to `true` then the output is minified by [`cssnano`](http://cssnano.co/).

##### `postcss`

* Type: `Object`
* Default: `undefined`

Options that are passed directly to `postcss`, as per [the documentation](http://api.postcss.org/global.html#processOptions).

```js
{
  postcss: {from: 'filename.css'}
}
```

##### `use`

* Type: `Array`
* Default: `undefined`

A list of plugins that are passed to PostCSS. This can be used to add new plugins and/or reorder the defaults

```js
{
  use: ['postcss-at2x', 'postcss-property-lookup']
}
```

##### `<plugin-name>`

* Type: `Object`
* Default: `undefined`

Property matching the name of a PostCSS plugin that has options for that plugin

```js
{
  autoprefixer: {
    browsers: ['> 1%', 'IE 7'],
    cascade: false
  },
  'postcss-calc': { preserve: true }
}
```

### Plugin configuration

Creating a configuration file allows options to be passed to the individual PostCSS plugins. It can be passed to the `suitcss` CLI via the `-c` flag and can be either JavaScript or JSON

```js
module.exports = {
  root: 'path/to/css',
  autoprefixer: { browsers: ['> 1%', 'IE 7'], cascade: false },
  'postcss-calc': { preserve: true }
}
```

```js
{
  "root": "path/to/css",
  "autoprefixer": { "browsers": ["> 1%", "IE 7"], "cascade": false },
  "postcss-calc": { "preserve": true }
}
```

Options are merged recursively with the defaults. For example, adding new plugins to the `use` array will result in them being merged alongside the existing ones.

#### Adding additional plugins

By default the preprocessor uses all necessary plugins to build SUIT components. However additional plugins can be installed into a project and then added to the `use` array.

**Note**: This will not work with the preprocessor installed globally. Instead rely on the convenience of `npm run script`

```js
module.exports = {
  use: [
    'postcss-property-lookup'
  ]
};
```

```js
{
  "name": "my-pkg",
  "version": "0.1.0",
  "dependencies": {
    "postcss-property-lookup": "^1.1.3",
    "suitcss-preprocessor": "^0.5.0"
  },
  "scripts": {
    "preprocess": "suitcss -c myconfig.js index.css build/built.css"
  }
}
```

```
npm run preprocess
```

#### Changing plugin order

If duplicate plugins are used they will be removed, but the new order will be respected. This is useful if you need to change the default order:

```js
// Default order
var defaults = [
  'postcss-easy-import',
  'postcss-custom-properties',
  'postcss-calc',
  'postcss-custom-media',
  'autoprefixer',
  'postcss-reporter'
];

// config
module.exports = {
  use: [
    'postcss-at2x',
    'postcss-calc',
    'autoprefixer',
    'postcss-reporter'
  ]
};

var result = [
  'postcss-easy-import',
  'postcss-custom-properties',
  'postcss-custom-media',
  'postcss-at2x',
  'postcss-calc',
  'autoprefixer',
  'postcss-reporter'
];
```

#### Autoprefixer: vendor prefixes

By default the preprocessor uses the SUIT
[browserslist](https://github.com/ai/browserslist) configuration:

```
> 1%, last 2 versions, safari > 6, ie > 9, ios > 6, android > 4.3, samsung > 3, chromeandroid > 50
```

The preprocessor doesn't attempt to find any `browserslist` config file.

Instead you can customise the browsers list
via [configuration file](#plugin-configuration).


## Acknowledgements

Based on [Myth](https://github.com/segmentio/myth) by Segment.io.
