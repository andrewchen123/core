import * as fs from 'fs';
import * as path from 'path';
import * as AJV from 'ajv';
import * as Hapi from "hapi";
import * as Boom from "boom";

// SOF: IMPORT CUSTOM AJV FORMATS
import registerCsvFormat from './formats/csv';
import registerAddressFormat from './formats/address';
import registerHexFormat from './formats/hex';
import registerIpFormat from './formats/ip';
import registerParsedIntFormat from './formats/parsedInt';
import registerPublicKeyFormat from './formats/publicKey';
import registerSignatureFormat from './formats/signature';
import registerVendorFieldFormat from './formats/vendorField';
// EOF: IMPORT CUSTOM AJV FORMATS

const PLUGIN_NAME = 'hapi-ajv';

const register = async (server: Hapi.Server, options: object): Promise<void> => {
  const ajv = new AJV();
  registerCsvFormat(ajv);
  registerAddressFormat(ajv);
  registerHexFormat(ajv);
  registerIpFormat(ajv);
  registerParsedIntFormat(ajv);
  registerPublicKeyFormat(ajv);
  registerSignatureFormat(ajv);
  registerVendorFieldFormat(ajv);

  const validate = (schema, data) => {
    return ajv.validate(schema, data) ? null : ajv.errors;
  };

  const createErrorResponse = (request, h, errors) => {
    if (request.pre.apiVersion === 1) {
      return h
        .response({
          path: errors[0].dataPath,
          error: errors[0].message,
          success: false,
        })
        .takeover();
    }

    return Boom.badData(errors);
  };

  server.ext({
    type: 'onPreHandler',
    method: (request, h) => {
      const config = request.route.settings.plugins[PLUGIN_NAME] || {};

      let errors;

      if (config.payloadSchema) {
        errors = validate(config.payloadSchema, request.payload);

        if (errors) {
          return createErrorResponse(request, h, errors);
        }
      }

      if (config.querySchema) {
        errors = validate(config.querySchema, request.query);
        console.log(errors);

        if (errors) {
          return createErrorResponse(request, h, errors);
        }
      }

      return h.continue;
    },
  });
};

export = {
  register,
  name: PLUGIN_NAME,
  version: "1.0.0"
};
