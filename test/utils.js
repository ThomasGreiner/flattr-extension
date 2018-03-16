"use strict";

const fs = require("fs");
const path = require("path");
const {promisify} = require("util");

let fsReaddir = promisify(fs.readdir);
let fsStat = promisify(fs.stat);

// Based on https://gist.github.com/jakearchibald/31b89cba627924972ad6
function spawn(generatorFunc)
{
  let generator = generatorFunc();
  let onFulfilled;
  let onRejected;

  function continuer(verb, arg)
  {
    let result;
    try
    {
      result = generator[verb](arg);
    }
    catch (err)
    {
      return Promise.reject(err);
    }
    if (result.done)
    {
      return result.value;
    }
    return Promise.resolve(result.value).then(onFulfilled, onRejected);
  }

  onFulfilled = continuer.bind(continuer, "next");
  onRejected = continuer.bind(continuer, "throw");
  return onFulfilled();
}
exports.spawn = spawn;

async function getFiles(rootDir)
{
  let allFiles = [];
  let queue = [rootDir];

  while (queue.length > 0)
  {
    let dir = queue.shift();
    let stat = await fsStat(dir);

    if (stat.isDirectory())
    {
      let files = await fsReaddir(dir);
      files = files.map((file) => path.join(dir, file));
      queue.push(...files);
    }
    else
    {
      allFiles.push(dir);
    }
  }

  return allFiles;
}
exports.getFiles = getFiles;
