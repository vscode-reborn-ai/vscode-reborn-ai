import * as assert from 'assert';
import { getUpdatedModel, isReasoningModel, throttle } from './helpers';

suite('Helper utilities (co-located)', () => {
  test('getUpdatedModel maps deprecated models to replacements', () => {
    assert.strictEqual(getUpdatedModel('gpt-3.5-turbo'), 'gpt-4o-mini');
    assert.strictEqual(getUpdatedModel('gpt-4-1106-preview'), 'gpt-4-turbo');
  });

  test('getUpdatedModel returns the same id when not deprecated', () => {
    assert.strictEqual(getUpdatedModel('gpt-4o'), 'gpt-4o');
  });

  test('isReasoningModel flags reasoning-capable models', () => {
    assert.ok(isReasoningModel('o1'));
    assert.ok(!isReasoningModel('gpt-4o'));
  });

  test('throttle limits rapid consecutive calls but allows spaced calls', async () => {
    let count = 0;
    const throttled = throttle(() => { count += 1; }, 30);

    throttled();
    throttled();
    throttled();
    assert.strictEqual(count, 1);

    await new Promise(resolve => setTimeout(resolve, 40));
    throttled();
    assert.strictEqual(count, 2);
  });
});
