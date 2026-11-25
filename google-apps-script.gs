// Tempel di script.google.com (Apps Script) > Deploy > Web app (akses: Anyone).
// Salin URL /exec ke config.js -> logEndpoint. Ganti SHEET_ID dengan ID Google Sheet Anda.
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const sh = SpreadsheetApp.openById("SHEET_ID").getSheets()[0];
  sh.appendRow([d.time, d.name, d.id, d.event, d.detail, d.violations, d.ua]);
  return ContentService.createTextOutput("ok");
}
