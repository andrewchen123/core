import * as Hapi from "hapi";
import * as Server from "./server";

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

    return Server.init(options);
  },
  async deregister(container, options) {
    if (options.enabled) {
      const servers: Map<string, Hapi.Server> = container.resolvePlugin("api");

      for (const [type, server] of servers) {
        container.resolvePlugin("logger").info(`Stopping Public ${type} API`);

        return server.stop();
      }
    }
  },
};
