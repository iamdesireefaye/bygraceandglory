// === PASTE THIS INTO GOOGLE APPS SCRIPT ===
// Extensions > Apps Script > paste > Save > Deploy

// Spreadsheet IDs (already created)
const EMAIL_SHEET_ID = '13pqnPwViD5xBCgk5tWxzs6MUNBdKI0RFSmMbT3l5I5g';
const CONTACT_SHEET_ID = '1dJXW_jHs1r_6xJPgvz9iPA0_PDlrY2qyNeCrzcU5gYE';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'contact') {
      // Contact form submission
      const sheet = SpreadsheetApp.openById(CONTACT_SHEET_ID).getActiveSheet();
      sheet.appendRow([data.name, data.email, data.message, data.date]);

      // Send you an email notification
      MailApp.sendEmail({
        to: 'desireefaye@youngandbrilliant.org',
        subject: 'New Message from Esi Prints - ' + data.name,
        body: 'Name: ' + data.name + '\nEmail: ' + data.email + '\n\nMessage:\n' + data.message + '\n\nSent: ' + data.date
      });
    } else {
      // Email signup
      const sheet = SpreadsheetApp.openById(EMAIL_SHEET_ID).getActiveSheet();
      sheet.appendRow([data.email, data.date, data.source || 'website']);
    }

    return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Esi Prints API is running.');
}

// === DEPLOYMENT STEPS ===
// 1. Paste this code in Apps Script
// 2. Click "Deploy" > "New deployment"
// 3. Type: "Web app"
// 4. Execute as: "Me"
// 5. Who has access: "Anyone"
// 6. Click "Deploy"
// 7. Copy the Web App URL
// 8. Give that URL to Claude to wire into the site
