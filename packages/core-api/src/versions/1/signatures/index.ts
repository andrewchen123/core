import * as Hapi from "hapi";
import Routes from "./routes";

export function register(server: Hapi.Server) {
  Routes(server);
}
