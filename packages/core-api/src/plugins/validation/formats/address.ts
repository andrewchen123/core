import * as bs58check from 'bs58check';
import * as Container from '@arkecosystem/core-container';

export default function (ajv) {
  const config = Container.resolvePlugin('config');

  ajv.addFormat('address', {
    type: 'string',
    validate: value => {
      try {
        return bs58check.decode(value)[0] === config.network.pubKeyHash;
      } catch (e) {
        return false;
      }
    },
  });
}
