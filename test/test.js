var expect = require('chai').expect;
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
    expect(suitcss('body {}')).to.be.a('string');
  });
});

/**
 * Feature tests.
 */

describe('features', function () {
  it('should preprocess CSS correctly', function () {
    var input = read('fixtures/component');
    var output = read('fixtures/component.out');

    expect(suitcss(input, {root: 'test/fixtures'}).trim()).to.equal(output.trim());
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
      expect(res).to.equal(output);
      done();
    });
  });

  it('should read from a file and write to stdout', function (done) {
    exec('bin/suitcss test/fixtures/cli/input.css', function (err, stdout) {
      if (err) return done(err);
      expect(stdout).to.equal(output);
      done();
    });
  });

  it('should read from stdin and write to stdout', function (done) {
    var child = exec('bin/suitcss', function (err, stdout) {
      if (err) return done(err);
      expect(stdout).to.equal(output);
      done();
    });

    child.stdin.write(new Buffer(input));
    child.stdin.end();
  });

  it('should log on verbose', function (done) {
    exec('bin/suitcss -v test/fixtures/cli/input.css test/fixtures/cli/output.css', function (err, stdout) {
      if (err) return done(err);
      expect(stdout).to.contain('write');
      done();
    });
  });

  it('should allow configurable import root', function (done) {
    exec('bin/suitcss -i test/fixtures test/fixtures/import.css test/fixtures/cli/output.css', function (err, stdout) {
      if (err) return done(err);
      var res = read('fixtures/cli/output');
      var expected = read('fixtures/component.out');
      expect(res).to.equal(expected);
      done();
    });
  });

  it('should allow a config file to be passed', function (done) {
    exec('bin/suitcss -i test/fixtures test/fixtures/import.css -c test/test.config.js test/fixtures/cli/output.css', function (err, stdout) {
      if (err) return done(err);
      var res = read('fixtures/cli/output');
      var expected = read('fixtures/config.out');
      expect(res).to.equal(expected);
      done();
    });
  });

  it('should log on non-existant file', function (done) {
    exec('bin/suitcss test/fixtures/cli/non-existant.css', function (err, stdout, stderr) {
      expect(err).to.be.an('error');
      expect(err.code).to.equal(1);
      expect(stderr).to.contain('not found');
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
