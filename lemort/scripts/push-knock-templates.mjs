#!/usr/bin/env node
/**
 * Push email + SMS templates to Knock via Management API.
 * Usage:
 *   node scripts/push-knock-templates.mjs [--env development|production]
 *
 * Requires:
 *   KNOCK_SERVICE_TOKEN  — Knock service token (Settings > Service tokens)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ENV = process.argv.includes("--env")
  ? process.argv[process.argv.indexOf("--env") + 1]
  : "development";

const SERVICE_TOKEN = process.env.KNOCK_SERVICE_TOKEN;
if (!SERVICE_TOKEN) {
  console.error("❌  KNOCK_SERVICE_TOKEN env var is required");
  process.exit(1);
}

const APP_ID = "lesmorts";
const BASE = `https://control.knock.app/v1`;

const headers = {
  Authorization: `Bearer ${SERVICE_TOKEN}`,
  "Content-Type": "application/json",
};

async function api(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return text ? JSON.parse(text) : null;
}

function readTemplate(filename) {
  return fs.readFileSync(path.join(__dirname, "../email-templates", filename), "utf8");
}

const deathHtml = readTemplate("death-notification.html");
const followHtml = readTemplate("follow-confirmation.html");

// Knock liquid-style variable mapping:
// Our {{foo}} → Knock uses {{ foo }} (liquid) — they're compatible
// Subject lines use liquid too

const workflows = [
  {
    key: "death-alert-email",
    name: "Death Alert Email",
    steps: [
      {
        type: "channel",
        channel_type: "email",
        settings: {
          subject: "{{ subjectName }} has flatlined.",
          html_body: deathHtml
            .replace(/{{subjectName}}/g, "{{ subjectName }}")
            .replace(/{{age}}/g, "{{ age }}")
            .replace(/{{deathQuip}}/g, "{{ deathQuip }}")
            .replace(/{{departedDate}}/g, "{{ departedDate }}")
            .replace(/{{source}}/g, "{{ source }}")
            .replace(/{{photoUrl}}/g, "{{ photoUrl }}")
            .replace(/{{unsubscribeUrl}}/g, "{{ unsubscribeUrl }}"),
        },
      },
    ],
  },
  {
    key: "sms-death-alert",
    name: "SMS Death Alert",
    steps: [
      {
        type: "channel",
        channel_type: "sms",
        settings: {
          text: "Les Morts: {{ name }} has departed, age {{ age }}. You knew before almost everyone. That was the deal. Your watchlist has an opening: lesmorts.org",
        },
      },
    ],
  },
  {
    key: "follow-confirmation",
    name: "Follow Confirmation",
    steps: [
      {
        type: "channel",
        channel_type: "email",
        settings: {
          subject: "You're watching {{ subjectName }}.",
          html_body: followHtml
            .replace(/{{subjectName}}/g, "{{ subjectName }}")
            .replace(/{{age}}/g, "{{ age }}")
            .replace(/{{quip}}/g, "{{ quip }}")
            .replace(/{{watcherCount}}/g, "{{ watcherCount }}")
            .replace(/{{photoUrl}}/g, "{{ photoUrl }}")
            .replace(/{{unsubscribeUrl}}/g, "{{ unsubscribeUrl }}"),
        },
      },
    ],
  },
];

async function pushWorkflow(wf) {
  console.log(`\n→ Pushing workflow: ${wf.key}`);
  try {
    // Upsert the workflow
    await api("PUT", `/environments/${ENV}/workflows/${wf.key}`, {
      name: wf.name,
      steps: wf.steps,
    });
    console.log(`  ✓ ${wf.key} pushed`);
  } catch (err) {
    console.error(`  ✗ ${wf.key} failed: ${err.message}`);
  }
}

console.log(`\nPushing Knock templates to environment: ${ENV}`);
for (const wf of workflows) {
  await pushWorkflow(wf);
}
console.log("\nDone.");
