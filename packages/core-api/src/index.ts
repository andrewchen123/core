import * as Hapi from "hapi";
import Server from "./server";

export const plugin = {
  pkg: require("../package.json"),
  defaults: require("./defaults"),
  alias: "api",
  async register(container, options) {
    const server = new Server(options);
    await server.start();

    return server;
  },
  async deregister(container, options) {
    if (options.enabled) {
      return container.resolvePlugin("api").stop();
    }
  },
};
