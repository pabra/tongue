import initTongue from '@pabra/tongue-translate';

const entries = { test: {} };
const dicts = { en: {} };
initTongue(entries, dicts);
const tongueObj = initTongue(entries, dicts);
const aliasedInit = initTongue;
aliasedInit(entries, dicts);

if (Date.now() > 1) {
  const { t: conditionedT } = initTongue(entries, dicts);
  conditionedT('test');
}

const { translate, t } = initTongue(entries, dicts);

export default tongueObj;
export { translate, t };
