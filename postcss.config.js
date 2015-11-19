const postcss = require('postcss');
const bemLinter = require('postcss-bem-linter');
const reporter = require('postcss-reporter');

module.exports = {
  use: [
    "postcss-custom-properties",
    "postcss-calc",
    "postcss-custom-media"
  ]
};
