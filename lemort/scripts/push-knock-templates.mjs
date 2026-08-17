#!/usr/bin/env node
/**
 * Push email + SMS templates to Knock via Management API.
 * Usage:
 *   node scripts/push-knock-templates.mjs [--env development|production]
 *
 * Requires:
 *   KNOCK_MGMT_TOKEN  — Knock service token (Settings > Service tokens)
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

const BASE = "https://control.knock.app/v1";
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
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

function readTemplate(filename) {
  return fs.readFileSync(
    path.join(__dirname, "../email-templates", filename),
    "utf8"
  );
}

// Convert our {{foo}} placeholders to Knock liquid {{ data.foo }}
function toKnock(html, varMap) {
  let out = html;
  for (const [from, to] of Object.entries(varMap)) {
    out = out.replaceAll(`{{${from}}}`, `{{ ${to} }}`);
  }
  return out;
}

const deathHtml = toKnock(readTemplate("death-notification.html"), {
  subjectName: "data.subjectName",
  age: "data.age",
  deathQuip: "data.deathQuip",
  departedDate: "data.departedDate",
  source: "data.source",
  photoUrl: "data.photoUrl",
  unsubscribeUrl: "recipient.unsubscribe_url",
});

const followHtml = toKnock(readTemplate("follow-confirmation.html"), {
  subjectName: "data.subjectName",
  age: "data.age",
  quip: "data.quip",
  watcherCount: "data.watcherCount",
  photoUrl: "data.photoUrl",
  unsubscribeUrl: "recipient.unsubscribe_url",
});

const workflows = [
  {
    key: "death-alert-email",
    name: "Death Alert Email",
    steps: [
      {
        ref: "email_1",
        type: "channel",
        channel_type: "email",
        channel_key: "resend",
        name: "Death Alert",
        template: {
          subject: "{{ data.subjectName }} has flatlined.",
          preview_text: "Your dollar has matured.",
          html_body: deathHtml,
          is_mjml: false,
          settings: { layout_key: "default" },
        },
      },
    ],
  },
  {
    key: "sms-death-alert",
    name: "SMS Death Alert",
    steps: [
      {
        ref: "sms_1",
        type: "channel",
        channel_type: "sms",
        channel_key: "twilio",
        name: "SMS Death Alert",
        template: {
          text_body: "Les Morts: {{ data.subjectName }} has departed, age {{ data.age }}. You knew before almost everyone. That was the deal. Your watchlist has an opening: lesmorts.org",
        },
      },
    ],
  },
  {
    key: "follow-confirmation",
    name: "Follow Confirmation",
    steps: [
      {
        ref: "email_1",
        type: "channel",
        channel_type: "email",
        channel_key: "resend",
        name: "Follow Confirmation",
        template: {
          subject: "You're watching {{ data.subjectName }}.",
          preview_text: "Nothing to do now. That's the point.",
          html_body: followHtml,
          is_mjml: false,
          settings: { layout_key: "default" },
        },
      },
    ],
  },
];

async function pushWorkflow(wf, env) {
  const envSuffix = env ? `?environment=${env}` : "";
  const label = `${wf.key}${env ? ` (${env})` : ""}`;
  console.log(`\n→ Pushing workflow: ${label}`);
  try {
    await api("PUT", `/workflows/${wf.key}${envSuffix}`, {
      workflow: { name: wf.name, steps: wf.steps },
    });
    console.log(`  ✓ ${label} pushed`);
  } catch (err) {
    console.error(`  ✗ ${label} failed: ${err.message}`);
  }
}

const environments = ENV === "production" ? ["development", "production"] : ["development"];

console.log(`\nPushing Knock templates to: ${environments.join(", ")}`);
for (const env of environments) {
  for (const wf of workflows) {
    await pushWorkflow(wf, env);
  }
}
console.log("\nDone.");
