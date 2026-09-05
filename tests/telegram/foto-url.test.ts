import assert from "node:assert/strict";
import test from "node:test";
import { extractFotoUrl } from "../../lib/telegram/foto-url";

test("reads a Google Photos URL from the message that /foto replied to", () => {
  assert.equal(
    extractFotoUrl(
      {
        text: "/foto",
        reply_to_message: { text: "https://photos.app.goo.gl/AbCdEf123" },
      },
      true,
    ),
    "https://photos.app.goo.gl/AbCdEf123",
  );
  assert.equal(
    extractFotoUrl(
      {
        text: "/foto@NexaBot",
        reply_to_message: {
          text: "Album program pagi ini",
          entities: [
            {
              type: "text_link",
              offset: 0,
              length: 5,
              url: "https://photos.google.com/share/AF1QipExample?key=abc",
            },
          ],
        },
      },
      true,
    ),
    "https://photos.google.com/share/AF1QipExample?key=abc",
  );
  assert.equal(
    extractFotoUrl(
      {
        text: "/foto",
        reply_to_message: { text: "https://drive.google.com/file/d/abc/view" },
      },
      true,
    ),
    null,
  );
  assert.equal(
    extractFotoUrl({
      text: "/foto",
      reply_to_message: { text: "https://photos.app.goo.gl/AbCdEf123" },
    }),
    null,
  );
});

test("still accepts /foto followed by the album URL", () => {
  assert.equal(
    extractFotoUrl({ text: "/foto https://photos.app.goo.gl/AbCdEf123" }),
    "https://photos.app.goo.gl/AbCdEf123",
  );
});
