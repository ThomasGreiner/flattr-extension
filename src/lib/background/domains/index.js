"use strict";

const tld = require("tldjs");

const {STATUS_BLOCKED, STATUS_DISABLED, STATUS_ENABLED, STATUS_UNDEFINED} =
    require("../../common/constants");
const {emit} = require("../../common/events");
const {normalizeURL} = require("../../common/utils");
const presetStatus = require("./status/preset");
const userPresetStatus = require("./status/user-preset");
const userStatus = require("./status/user");

function getEntity(url)
{
  return tld.getDomain(url);
}
exports.getEntity = getEntity;

function getStatus({domain, url})
{
  if (url)
  {
    try
    {
      url = normalizeURL(url);
    }
    catch (ex)
    {
      return Promise.resolve({
        combined: STATUS_BLOCKED,
        preset: STATUS_UNDEFINED,
        user: STATUS_UNDEFINED
      });
    }
  }

  let entity = tld.getDomain(domain || url);
  return Promise.all([
    userStatus.isDisabled(entity),
    userPresetStatus.get()
  ]).then(([isDisabled, userPreset]) =>
  {
    let combined = STATUS_UNDEFINED;
    let preset = presetStatus.get({domain, url});
    let user = STATUS_UNDEFINED;

    let presetCombined = preset;
    if (userPreset !== STATUS_UNDEFINED && preset !== STATUS_BLOCKED)
    {
      presetCombined = userPreset;
    }

    if (typeof isDisabled == "boolean")
    {
      combined = user = (isDisabled) ? STATUS_DISABLED : STATUS_ENABLED;
    }
    else if (presetCombined === STATUS_UNDEFINED)
    {
      combined = STATUS_DISABLED;
    }
    else
    {
      combined = presetCombined;
    }

    if (preset == STATUS_BLOCKED)
    {
      combined = STATUS_BLOCKED;
    }

    return {combined, preset, user, userPreset};
  });
}
exports.getStatus = getStatus;

function hasAuthors(domain)
{
  domain = tld.getDomain(domain);
  return presetStatus.isAuthorDomain(domain);
}
exports.hasDomainAuthors = hasAuthors;

function setEntityStatus(entity, status)
{
  return userStatus.setDisabled(entity, status == STATUS_DISABLED).then(() =>
  {
    emit("status-changed", {entity, status});
  });
}
exports.setEntityStatus = setEntityStatus;

function setPresetStatus(status)
{
  return userPresetStatus.set(status).then(() =>
  {
    emit("status-changed", {status});
  });
}
exports.setPresetStatus = setPresetStatus;
