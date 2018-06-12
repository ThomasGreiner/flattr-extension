"use strict";

const {document} = require("global/window");

const ipc = require("../../common/ipc");
const settings = require("../../common/settings");
const i18n = require("../i18n");
const {VirtualElement, v, h} = require("./virtual-element");

class OptionsSectionPreset extends VirtualElement
{
  renderTree()
  {
    // if (!this.isInitialized())
    // {
    //   return;
    // }

    // let betaEnabled = this.data.beta;

    return [
      h("h3", "Foo")
    ];

    // return [
    //   h("h3", i18n.get("options_beta_title")),
    //   h("p", i18n.get("options_beta_intro")),
    //   h("p.consent", i18n.getNodes("options_beta_description", {
    //     urls: [`${API_BASE_WEB}/privacy/consent`]
    //   })),
    //   h("p.consent", i18n.get("options_beta_revocation")),
    //   h("p", i18n.get("options_beta_optin")),
    //   v(
    //     "input-toggle",
    //     {
    //       attributes: {
    //         default: "off"
    //       },
    //       checked: betaEnabled,
    //       onclick(e)
    //       {
    //         that.beta = this.checked;
    //       }
    //     },
    //     i18n.get("options_beta_feedback_toggle", [API_BASE_DOMAIN])
    //   ),
    //   h("div", exporter),
    //   h("div.footnotes", footnotes)
    // ];
  }

  set beta(value)
  {
    let betaEnabled = value;
    settings.set("feedback.disabled", !betaEnabled);
    this.data = {beta: betaEnabled};
  }
}

document.registerElement("flattr-options-preset", OptionsSectionPreset);
