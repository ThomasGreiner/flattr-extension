"use strict";

const {STATUS_UNDEFINED} = require("../../../common/constants");
const settings = require("../../../common/settings");

exports.get = () => settings.get("domains.preset", STATUS_UNDEFINED);
exports.set = (status) => settings.set("domains.preset", status);
