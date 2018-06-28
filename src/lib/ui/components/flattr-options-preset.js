"use strict";

const {document} = require("global/window");

const {
  STATUS_DISABLED,
  STATUS_ENABLED,
  STATUS_UNDEFINED
} = require("../../common/constants");
const ipc = require("../../common/ipc");
const settings = require("../../common/settings");
const i18n = require("../i18n");
const {VirtualElement, h} = require("./virtual-element");

let values = [
  STATUS_UNDEFINED,
  STATUS_ENABLED,
  STATUS_DISABLED
];

class OptionsSectionPreset extends VirtualElement
{
  set value(value)
  {
    this._value = value;
    settings.set("domains.preset", value);
    this.render();
  }

  renderTree()
  {
    if (!this.isInitialized(["value"]))
      return;

    let items = values.map((value) =>
    {
      let stringId = `options_domains_preset_${value}`;
      let content = null;

      if (value === STATUS_UNDEFINED)
      {
        content = i18n.getNodes(stringId, {
          urls: [
            "https://blog.flattr.com/2017/09/the-story-about-the-new-flattr-the-flattr-enabled-list/"
          ]
        });
      }
      else
      {
        content = i18n.get(stringId);
      }

      let itemId = `domains-preset-${value}`;

      return h("li", [
        h("input", {
          value,
          checked: this._value === value,
          id: itemId,
          name: "domains-preset",
          type: "radio",
          onclick: (ev) =>
          {
            this.value = parseInt(value, 10);
          }
        }),
        h(
          "label",
          {
            attributes: {for: itemId}
          },
          [content]
        )
      ]);
    });

    return [
      h("h3", i18n.get("options_domains_preset_title")),
      h("ul", items)
    ];
  }
}

document.registerElement("flattr-options-preset", OptionsSectionPreset);
