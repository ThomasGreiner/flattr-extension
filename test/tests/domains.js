"use strict";

const requireInject = require("require-inject");
const {expect} = require("chai");

const {Window} = require("../mocks/window");
const {
  STATUS_DISABLED: DISABLED,
  STATUS_ENABLED: ENABLED,
  STATUS_UNDEFINED: UNDEFINED
} = require("../../src/lib/common/constants");

describe("Test domain checks", () =>
{
  let invalidUrl = "invalid.com";
  let userList = new Map([
    ["enabled-user.com", false],
    ["disabled-user.com", true]
  ]);

  let lastUpdated = 0;
  let userPresetStatus = UNDEFINED;

  const domains = requireInject("../../src/lib/background/domains", {
    "localforage":
    {
      createInstance()
      {
        return {
          getItem: (key) => Promise.resolve(userList.get(key)),
          removeItem(key)
          {
            userList.delete(key);
            return Promise.resolve();
          },
          setItem(key, value)
          {
            userList.set(key, value);
            return Promise.resolve();
          }
        };
      }
    },
    "../../src/data/domains": {
      status: {
        a1: {
          "b1": {
            "c1": 30,
            "c2": {
              "/foo": 31,
              "/foo/bar": 40,
              "": 32,
              "*": 33
            },
            "/bar": 21,
            "*": 22
          },
          "*": 12
        },
        com: {
          "enabled-default": ENABLED
        }
      }
    },
    "global/window": new Window(),
    "../../src/lib/common/events": {
      emit() {}
    },
    "../../src/lib/common/utils": {
      normalizeURL(url)
      {
        if (url == invalidUrl)
          throw new Error();

        return url;
      }
    },
    "../../src/lib/common/env/chrome":
    {
      chrome:
      {
        runtime: {},
        storage:
        {
          local:
          {
            get(name, callback)
            {
              if (name == "domains.lastUpdated")
                return callback({"domains.lastUpdated": lastUpdated});

              if (name == "domains.preset")
                return callback({"domains.preset": userPresetStatus});

              callback({});
            },
            set(settings, callback)
            {
              if ("domains.lastUpdated" in settings)
              {
                lastUpdated = settings["domains.lastUpdated"];
              }

              if ("domains.preset" in settings)
              {
                userPresetStatus = settings["domains.preset"];
              }

              callback();
            }
          }
        }
      }
    }
  });

  function checkEntity(domain, combined = UNDEFINED, {
    preset = UNDEFINED,
    user = UNDEFINED,
    userPreset = UNDEFINED
  })
  {
    return domains.getStatus({domain})
        .then((status) =>
        {
          expect(status).to.deep.equal({combined, preset, user, userPreset});
        });
  }

  function checkURL(url, combined, {
    preset = UNDEFINED,
    user = UNDEFINED,
    userPreset = UNDEFINED
  })
  {
    return domains.getStatus({url})
        .then((status) =>
        {
          expect(status).to.deep.equal({combined, preset, user, userPreset});
        });
  }

  beforeEach(() =>
  {
    return domains.setPresetStatus(UNDEFINED);
  });

  it("Should use host value", () =>
    checkEntity("c1.b1.a1", 30, {preset: 30}));

  it("Should use pathname value", () =>
  {
    return Promise.all([
      checkURL("http://c2.b1.a1/foo", 31, {preset: 31}),
      checkURL("http://c2.b1.a1/bar", 32, {preset: 32})
    ]);
  });

  it("Should match only first part of pathname", () =>
  {
    return Promise.all([
      checkURL("http://c2.b1.a1/", 32, {preset: 32}),
      checkURL("http://c2.b1.a1/foo", 31, {preset: 31}),
      checkURL("http://c2.b1.a1/foobar", 32, {preset: 32}),
      checkURL("http://c2.b1.a1/foo/bar", 31, {preset: 31})
    ]);
  });

  it("Should use \"\" value", () =>
    checkEntity("c2.b1.a1", 32, {preset: 32}));

  it("Should use \"*\" value", () => checkEntity("b1.a1", 22, {preset: 22}));

  it("Should use parent host's \"*\" value", () =>
    checkEntity("d1.c2.b1.a1", 33, {preset: 33}));

  it("Should return undefined if no matching host or parent host", () =>
    checkEntity("z1.y1.x1", DISABLED, {}));

  it("Should consider user presets", () =>
  {
    const disabled = "disabled-default.com";
    return checkEntity(disabled, DISABLED, {})
        .then(() => domains.setPresetStatus(ENABLED))
        .then(() => checkEntity(disabled, ENABLED, {userPreset: ENABLED}))
        .then(() => domains.setPresetStatus(DISABLED))
        .then(() => checkEntity(disabled, DISABLED, {userPreset: DISABLED}));
  });

  it("Should consider user changes (preset: undefined)", () =>
  {
    const disabled = "disabled-default.com";
    return checkEntity(disabled, DISABLED, {})
        .then(() => domains.setEntityStatus(disabled, ENABLED))
        .then(() => checkEntity(disabled, ENABLED, {user: ENABLED}))
        .then(() => domains.setEntityStatus(disabled, DISABLED))
        .then(() => checkEntity(disabled, DISABLED, {user: DISABLED}))
        .then(() => domains.setPresetStatus(ENABLED))
        .then(() => checkEntity(disabled, DISABLED,
            {user: DISABLED, userPreset: ENABLED}));
  });

  it("Should consider user changes (preset: enabled)", () =>
  {
    const enabled = "enabled-default.com";
    return checkEntity(enabled, ENABLED, {preset: ENABLED})
        .then(() => domains.setEntityStatus(enabled, DISABLED))
        .then(() => checkEntity(enabled, DISABLED,
            {preset: ENABLED, user: DISABLED}))
        .then(() => domains.setEntityStatus(enabled, ENABLED))
        .then(() => checkEntity(enabled, ENABLED,
            {preset: ENABLED, user: ENABLED}))
        .then(() => domains.setPresetStatus(DISABLED))
        .then(() => checkEntity(enabled, ENABLED,
            {preset: ENABLED, user: ENABLED, userPreset: DISABLED}));
  });
});
