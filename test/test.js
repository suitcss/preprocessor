var assert = require('assert');
var child = require('child_process');
var exec = child.exec;
var spawn = child.spawn;
var fs = require('fs');
var suitcss = require('../lib');
var path = require('path');

/**
 * Node API tests.
 */

describe('suitcss', function () {
  it('should return a css string', function () {
    assert('string' == typeof suitcss('body {}'));
  });
});

/**
 * Feature tests.
 */

describe('features', function () {
  it('should preprocess CSS correctly', function () {
    var input = read('fixtures/component');
    var output = read('fixtures/component.out');
    assert.equal(suitcss(input, {root: 'test/fixtures'}).trim(), output.trim());
  });
});

/**
 * CLI tests.
 */

describe('cli', function () {
  var input = read('fixtures/cli/input');
  var output = read('fixtures/cli/input.out');

  afterEach(function () {
    remove('fixtures/cli/output');
  });

  it('should read from a file and write to a file', function (done) {
    exec('bin/suitcss test/fixtures/cli/input.css test/fixtures/cli/output.css', function (err, stdout) {
      if (err) return done(err);
      var res = read('fixtures/cli/output');
      assert.equal(res, output);
      done();
    });
  });

  it('should read from a file and write to stdout', function (done) {
    exec('bin/suitcss test/fixtures/cli/input.css', function (err, stdout) {
      if (err) return done(err);
      assert.equal(stdout, output);
      done();
    });
  });

  it('should read from stdin and write to stdout', function (done) {
    var child = exec('bin/suitcss', function (err, stdout) {
      if (err) return done(err);
      assert.equal(stdout, output);
      done();
    });

    child.stdin.write(new Buffer(input));
    child.stdin.end();
  });

  it('should log on verbose', function (done) {
    exec('bin/suitcss -v test/fixtures/cli/input.css test/fixtures/cli/output.css', function (err, stdout) {
      if (err) return done(err);
      assert(-1 != stdout.indexOf('write'));
      done();
    });
  });

  it('should allow configurable import root', function (done) {
    exec('bin/suitcss -i test/fixtures test/fixtures/import.css test/fixtures/cli/output.css', function (err, stdout) {
      if (err) return done(err);
      var res = read('fixtures/cli/output');
      var expected = read('fixtures/import.out');
      assert.equal(res, expected);
      done();
    });
  });

  it('should log on non-existant file', function (done) {
    exec('bin/suitcss test/fixtures/cli/non-existant.css', function (err, stdout, stderr) {
      assert(err);
      assert(err.code == 1);
      assert(-1 != stderr.indexOf('not found'));
      done();
    });
  });
});

/**
 * Read a fixture by `filename`.
 *
 * @param {String} filename
 * @return {String}
 */

function read (filename) {
  var file = resolve(filename);
  return fs.readFileSync(file, 'utf8');
}

/**
 * Remove a fixture by `filename`.
 *
 * @param {String} filename
 */

function remove (filename) {
  var file = resolve(filename);
  if (!fs.existsSync(file)) return;
  fs.unlinkSync(file);
}

/**
 * Resolve a fixture by `filename`.
 *
 * @param {String} filename
 * @return {String}
 */

function resolve (filename) {
  return path.resolve(__dirname, filename + '.css');
}
