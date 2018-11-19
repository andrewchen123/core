import * as Hapi from "hapi";
import Server from "./server";

export const plugin = {
  pkg: require("../package.json"),
  defaults: require("./defaults"),
  alias: "api",
  async register(container, options) {
    if (!options.enabled) {
      container
        .resolvePlugin("logger")
        .info("Public API is disabled :grey_exclamation:");

      return;
    }

    return new Server(options);
  },
  async deregister(container, options) {
    return container.resolvePlugin("api").stop();
  },
};
