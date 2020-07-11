import tongueObj, { initTongue, t, translate } from './init';

initTongue({}, {});
tongueObj.t('test');
tongueObj['t']('test with args', { arg: 'my arg' });
t('test');
t.newEntry('new entry');
t['newEntry']('another new entry');
translate('en', 'test');
translate.newEntry('en', 'another entry');
translate['newEntry']('en', 'another entry');

const s = 'test';

setTimeout(() => {
  t(s);
});
