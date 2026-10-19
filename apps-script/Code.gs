const SPREADSHEET_ID = '1g45EPNB0uKs1y-nCxJzjCLcSMSPkb0-jO8LK1zHp4cU';
const SHEET_NAME = 'お問い合わせ';
const HEADERS = [
  '送信日時',
  '氏名',
  'ビジネスメール',
  '会社名',
  '電話番号',
  '部署',
  '役職',
  'お問い合わせ内容',
];
const REQUIRED_FIELDS = [
  'name',
  'email',
  'company',
  'phone',
  'department',
  'position',
];
const DEPARTMENTS = ['営業', 'マーケ', '情報システム', '経営企画', '管理', 'その他'];
const POSITIONS = ['一般', '主任/リーダー', '課長', '部長', '役員', '代表'];

/**
 * アポカルサイトの問い合わせフォームからのPOSTを受け取り、
 * 指定したスプレッドシートの「お問い合わせ」シートに記録します。
 */
function doPost(e) {
  try {
    const payload = parseRequest_(e);

    // ボット用の非表示項目。値があれば正常終了の形で破棄します。
    if (payload.website) return json_({ ok: true });

    const missingFields = REQUIRED_FIELDS.filter((field) => !String(payload[field] || '').trim());
    if (missingFields.length) {
      return json_({ ok: false, error: '必須項目が入力されていません。' });
    }

    if (!isValidEmail_(payload.email)) {
      return json_({ ok: false, error: 'メールアドレスの形式を確認してください。' });
    }
    if (!DEPARTMENTS.includes(payload.department) || !POSITIONS.includes(payload.position)) {
      return json_({ ok: false, error: '選択項目が正しくありません。' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10 * 1000);
    try {
      const sheet = getContactSheet_();
      sheet.appendRow([
        new Date(),
        safeCellValue_(payload.name),
        safeCellValue_(payload.email),
        safeCellValue_(payload.company),
        safeCellValue_(payload.phone),
        safeCellValue_(payload.department),
        safeCellValue_(payload.position),
        safeCellValue_(payload.message),
      ]);
    } finally {
      lock.releaseLock();
    }

    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: '送信処理に失敗しました。' });
  }
}

function parseRequest_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (_) {
      // JSON以外はフォーム形式として処理します。
    }
  }
  return (e && e.parameter) || {};
}

function getContactSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sheet;
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

// `=`, `+`, `-`, `@` から始まる値を文字列として保存し、式の実行を防ぎます。
function safeCellValue_(value) {
  const text = String(value || '').trim();
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(body) {
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}
