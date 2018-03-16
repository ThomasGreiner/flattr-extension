"use strict";

const fs = require("fs");
const path = require("path");
const parseArgs = require("minimist");
const Mocha = require("mocha");

const {getArgs} = require("../build/cli");
const {getFiles} = require("./utils");

const testsDir = path.join(__dirname, "tests");

let args = getArgs({
  boolean: ["nobuilds"],
  string: ["exclude", "include"]
});

let reExcluded = new RegExp(args.exclude);
let reIncluded = new RegExp(args.include);

function getMochaOpts()
{
  let opts = fs.readFileSync(path.join(__dirname, "mocha.opts"), "utf8");
  return parseArgs(opts.trim().split(/\s/));
}

function run()
{
  let mochaOpts = getMochaOpts();

  return new Promise((resolve, reject) =>
  {
    const mochaRunner = new Mocha(mochaOpts);

    getFiles(testsDir).then((files) =>
    {
      for (let file of files)
      {
        if (args.include && !reIncluded.test(file))
          continue;

        if (args.exclude && reExcluded.test(file))
          continue;

        if (args.nobuilds && path.basename(file) == "build.js")
          continue;

        mochaRunner.addFile(file);
      }

      process.env.FP_BUILD_MODE = "test";
      mochaRunner.run((failures) =>
      {
        if (failures)
        {
          reject(failures);
        }

        delete process.env.FP_BUILD_MODE;
        resolve();
      });
    })
    .catch(reject);
  });
}
exports.run = run;
