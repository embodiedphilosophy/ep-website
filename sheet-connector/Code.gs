/**
 * EP Support KB — sheet connector for Ether.
 *
 * Paste this into the EP Support KB sheet: Extensions → Apps Script.
 * It does three things:
 *   1. GET  — gives Ether every row of the Entries tab (Ether keeps only the Live ones).
 *   2. POST — Ether logs each handoff to the Handoffs tab.
 *   3. importZendesk() — copies the last 60 days of Zendesk tickets into the Zendesk Log tab, daily.
 *
 * Script properties (Project Settings → Script properties):
 *   KB_TOKEN            any long random string; the same value goes in Vercel as KB_TOKEN
 *   ZENDESK_SUBDOMAIN   embodiedphilosophy
 *   ZENDESK_EMAIL       the Zendesk agent email the API token belongs to
 *   ZENDESK_API_TOKEN   Zendesk Admin Center → Apps and integrations → Zendesk API → Add API token
 */

var ENTRY_COLUMNS = {
  id: 'ID', replaces: 'Replaces', topic: 'Topic', programs: 'Programs', platform: 'Platform',
  question: 'Question', phrasings: 'Other phrasings', answer: 'Public answer', notes: 'Ether notes',
  handoff: 'Hand to Ichha when', public: 'Public', status: 'Status', owner: 'Owner', reviewed: 'Last reviewed'
};

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || '';
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function authorised_(token) {
  var expected = prop_('KB_TOKEN');
  return expected && token === expected;
}

// 1. Ether reads the knowledge base.
function doGet(e) {
  if (!authorised_(e && e.parameter && e.parameter.token)) return json_({ error: 'unauthorised' });
  var sheet = SpreadsheetApp.getActive().getSheetByName('Entries');
  var rows = sheet.getDataRange().getDisplayValues();
  var header = rows.shift();
  var index = {};
  Object.keys(ENTRY_COLUMNS).forEach(function (key) { index[key] = header.indexOf(ENTRY_COLUMNS[key]); });
  var entries = rows
    .filter(function (r) { return r[index.id]; })
    .map(function (r) {
      var entry = {};
      Object.keys(index).forEach(function (key) { entry[key] = index[key] >= 0 ? r[index[key]] : ''; });
      return entry;
    });
  return json_({ updated: new Date().toISOString(), entries: entries });
}

// 2. Ether logs a handoff.
function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ error: 'bad_request' }); }
  if (!authorised_(body.token)) return json_({ error: 'unauthorised' });
  var entry = String(body.entry || 'none');
  SpreadsheetApp.getActive().getSheetByName('Handoffs').appendRow([
    new Date().toISOString().replace('T', ' ').slice(0, 16),
    String(body.ticket || ''),
    entry,
    String(body.topic || ''),
    entry === 'none' ? 'Yes' : '',
    String(body.summary || '').slice(0, 1000),
    body.test ? 'Yes' : ''
  ]);
  return json_({ ok: true });
}

// 3. Zendesk tickets → Zendesk Log tab (last 60 days, rewritten each run).
function importZendesk() {
  var sub = prop_('ZENDESK_SUBDOMAIN') || 'embodiedphilosophy';
  var auth = Utilities.base64Encode(prop_('ZENDESK_EMAIL') + '/token:' + prop_('ZENDESK_API_TOKEN'));
  var since = new Date(Date.now() - 60 * 24 * 3600 * 1000);
  var url = 'https://' + sub + '.zendesk.com/api/v2/tickets.json?include=comment_count&sort_by=created_at&sort_order=desc&page[size]=100';
  var out = [];
  var done = false;
  while (url && !done) {
    var res = UrlFetchApp.fetch(url, { headers: { Authorization: 'Basic ' + auth }, muteHttpExceptions: true });
    if (res.getResponseCode() !== 200) throw new Error('Zendesk ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
    var data = JSON.parse(res.getContentText());
    (data.tickets || []).forEach(function (t) {
      if (new Date(t.created_at) < since) { done = true; return; }
      var match = /^\[Chat · ([a-z0-9]+)\]/i.exec(t.subject || '');
      out.push([
        t.id,
        t.created_at.replace('T', ' ').slice(0, 16),
        t.via && t.via.channel ? t.via.channel : '',
        t.subject || '',
        t.status,
        (t.tags || []).join(', '),
        match ? match[1] : '',
        /^\[Chat/.test(t.subject || '') ? 'Yes' : '',
        typeof t.comment_count === 'number' ? Math.max(t.comment_count - 1, 0) : ''
      ]);
    });
    url = data.meta && data.meta.has_more ? data.links.next : null;
  }
  var sheet = SpreadsheetApp.getActive().getSheetByName('Zendesk Log');
  if (sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, 9).clearContent();
  if (out.length) sheet.getRange(2, 1, out.length, 9).setValues(out);
}

// Run once to schedule importZendesk every morning.
function setupDailyImport() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importZendesk') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importZendesk').timeBased().everyDays(1).atHour(6).create();
}
