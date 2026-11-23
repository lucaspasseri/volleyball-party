import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarFile } from "../lib/calendar";
import { event } from "../lib/event";

test("ICS encodes the full event in UTC corresponding to São Paulo 9h–17h", () => {
  const content = calendarFile();
  assert.match(content, /DTSTART:20270107T120000Z/);
  assert.match(content, /DTEND:20270107T200000Z/);
  assert.match(content, /X-EVENT-TIMEZONE:America\/Sao_Paulo/);
  assert.match(content, /BEGIN:VEVENT/);
  assert.match(content, /END:VCALENDAR\r\n$/);
  for (const line of content.split("\r\n"))
    assert.ok(Buffer.byteLength(line) <= 75);
  assert.match(content.replace(/\r\n /g, ""), /Posto a definir/);
});

test("event falls on Thursday, January 7, 2027", () => {
  assert.equal(new Date(event.startsAt).getUTCDay(), 4);
  assert.equal(new Date("2027-01-01T12:00:00Z").getUTCDay(), 5);
});
