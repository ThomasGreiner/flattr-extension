"use strict";

const {document} = require("global/window");

const {emit, on} = require("../../common/events");

function getFlattrId()
{
  let meta = document.querySelector("meta[name='flattr:id']");
  if (!meta)
    return null;

  return meta.getAttribute("content");
}

function onLoad()
{
  let flattrId = getFlattrId();
  if (!flattrId)
    return;

  emit("stats", "flattr-id", flattrId);
}

on("document-loaded", onLoad);
