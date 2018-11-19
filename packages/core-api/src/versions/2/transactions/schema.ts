import * as Container from "@arkecosystem/core-container";
import * as Joi from "joi";
import * as Pagination from "../shared/schemas/pagination";

export const index: object = {
  query: {
    ...Pagination,
    ...{
      orderBy: Joi.string(),
      id: Joi.string()
        .hex()
        .length(64),
      blockId: Joi.string().regex(/^[0-9]+$/, "numbers"),
      type: Joi.number()
        .integer()
        .min(0),
      version: Joi.number()
        .integer()
        .positive(),
      senderPublicKey: Joi.string()
        .hex()
        .length(66),
      senderId: Joi.string()
        .alphanum()
        .length(34),
      recipientId: Joi.string()
        .alphanum()
        .length(34),
      ownerId: Joi.string()
        .alphanum()
        .length(34),
      timestamp: Joi.number()
        .integer()
        .min(0),
      amount: Joi.number()
        .integer()
        .min(0),
      fee: Joi.number()
        .integer()
        .min(0),
      vendorFieldHex: Joi.string().hex(),
    },
  },
};

export const store: object = {
  payload: {
    transactions: Joi.array()
      .max(
        Container.resolveOptions("transactionPool").maxTransactionsPerRequest,
      )
      .items(
        Joi.object({
          vendorField: Joi.string()
            .empty("")
            .max(64, "utf8"),
        }).options({ allowUnknown: true }),
      ),
  },
};

export const show: object = {
  params: {
    id: Joi.string()
      .hex()
      .length(64),
  },
};

export const unconfirmed: object = {
  query: Pagination,
};

export const showUnconfirmed: object = {
  params: {
    id: Joi.string()
      .hex()
      .length(64),
  },
};

export const search: object = {
  query: Pagination,
  payload: {
    orderBy: Joi.string(),
    id: Joi.string()
      .hex()
      .length(64),
    blockId: Joi.string().regex(/^[0-9]+$/, "numbers"),
    type: Joi.number()
      .integer()
      .min(0),
    version: Joi.number()
      .integer()
      .positive(),
    senderPublicKey: Joi.string()
      .hex()
      .length(66),
    senderId: Joi.string()
      .alphanum()
      .length(34),
    recipientId: Joi.string()
      .alphanum()
      .length(34),
    ownerId: Joi.string()
      .alphanum()
      .length(34),
    vendorFieldHex: Joi.string().hex(),
    timestamp: Joi.object().keys({
      from: Joi.number()
        .integer()
        .min(0),
      to: Joi.number()
        .integer()
        .min(0),
    }),
    amount: Joi.object().keys({
      from: Joi.number()
        .integer()
        .min(0),
      to: Joi.number()
        .integer()
        .min(0),
    }),
    fee: Joi.object().keys({
      from: Joi.number()
        .integer()
        .min(0),
      to: Joi.number()
        .integer()
        .min(0),
    }),
  },
};