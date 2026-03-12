import * as assert from "assert";

import {
  splitMessageContentSegments,
  splitMessageDisplayLines,
} from "./chat-message-rendering";

suite("Chat message rendering helpers", () => {
  test("splitMessageContentSegments preserves code block boundaries", () => {
    assert.deepStrictEqual(splitMessageContentSegments("before<pre><code>code</code></pre>after"), [
      "before",
      "<pre><code>code</code></pre>",
      "after",
    ]);
  });

  test("splitMessageContentSegments removes empty segments", () => {
    assert.deepStrictEqual(splitMessageContentSegments("<pre><code>code</code></pre>"), [
      "<pre><code>code</code></pre>",
    ]);
  });

  test("splitMessageDisplayLines normalizes duplicate line breaks", () => {
    assert.deepStrictEqual(splitMessageDisplayLines("first<br/>\nsecond\nthird"), [
      "first",
      "second",
      "third",
    ]);
  });
});
