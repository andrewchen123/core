import * as Hapi from "hapi";
import * as Boom from "boom";
import { IPlugin } from "../interfaces/plugin";

const register = async (server: Hapi.Server, options: object): Promise<void> => {
  server.ext({
    type: 'onPreResponse',
    async method(request, h) {
      const response = request.response;

      if (response['isBoom'] && response['data']) {
        // Deleting the property beforehand makes it appear last in the
        // response body.
        delete response['output']['payload']['error'];
        response['output'] = { payload: { error: response['data'] } };
      }

      return h.continue;
    },
  });
};

export = {
  register,
  name: "set-headers",
  version: "1.0.0"
};
