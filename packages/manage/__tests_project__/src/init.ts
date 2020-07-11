import initTongue from '@pabra/tongue-translate';
import entries from '../tongue_entries.json';

// const entries = { test: {} };
const dicts = { en: {} };
initTongue(entries, dicts);
const tongueObj = initTongue(entries, dicts);
const aliasedInit = initTongue;
aliasedInit(entries, dicts);

if (Date.now() > 1) {
  const { t: aliasedT } = initTongue(entries, dicts);
  aliasedT('test');
}

const { translate, t } = initTongue(entries, dicts);

export default tongueObj;
export { translate, t, initTongue };
