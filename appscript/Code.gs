// ເອົາມາຈາກ URL: https://docs.google.com/spreadsheets/d/<ບ່ອນນີ້ຄື ID>/edit
const SPREADSHEET_ID = '';

// ເອົາມາຈາກ URL: https://drive.google.com/drive/folders/<ບ່ອນນີ້ຄື ID>
const IMAGE_FOLDER_ID = '';

const SHEET_MENU = 'Menu';
const SHEET_ORDERS = 'Orders';
const SHEET_USERS = 'Users';

function initAllsheet() {
  const ss = getSS();

  let menuSheet = ss.getSheetByName(SHEET_MENU);
  if (!menuSheet) {
    menuSheet = ss.insertSheet(SHEET_MENU);
    // ເພີ່ມຄໍລຳ DriveId
    menuSheet.appendRow(['ID', 'ໝວດໝູ່', 'ຊື່ເມນູ', 'ລາຄາ', 'ເປີດຂາຍ', 'DriveId']);
    menuSheet.setFrozenRows(1);
  } else {
    // ກໍລະນີມີຊີດເກົ່າ ກວດສອບວ່າມີຫົວຄໍລຳ DriveId ຫຼືຍັງ
    const headers = menuSheet.getRange(1, 1, 1, menuSheet.getLastColumn()).getValues()[0];
    if (headers.length < 6) {
      menuSheet.getRange(1, 6).setValue('DriveId');
    }
  }

  let orderSheet = ss.getSheetByName(SHEET_ORDERS);
  if (!orderSheet) {
    orderSheet = ss.insertSheet(SHEET_ORDERS);
    orderSheet.appendRow(['ເລກທີອໍເດີ້', 'ວັນທີເວລາ', 'ໂຕະ/ລູກຄ້າ', 'ລາຍການ (JSON)', 'ຍອດລວມ', 'ຊຳລະໂດຍ', 'ສະຖານະ']);
    orderSheet.setFrozenRows(1);
  }

  let userSheet = ss.getSheetByName(SHEET_USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(SHEET_USERS);
    userSheet.appendRow(['Username', 'Password', 'Role']);
    userSheet.appendRow(['admin', '1234', 'Admin']);
    userSheet.setFrozenRows(1);
  }

  return 'ຕັ້ງຄ່າຊີດຮຽບຮ້ອຍແລ້ວ';
}

// ໜ້າເວັບຖືກໂຮດແຍກຕ່າງຫາກ (index.html) ສະຄຣິບນີ້ເຮັດໜ້າທີ່ເປັນ API ຜ່ານ doPost ເທົ່ານັ້ນ
function doGet() {
  initAllsheetOnce();
  return jsonOutput({ result: 'POS API ພ້ອມໃຊ້ງານ' });
}

// ລາຍຊື່ຟັງຊັນທີ່ເປີດໃຫ້ api.js ເອີ້ນໃຊ້ໄດ້ (whitelist — ກັນການເອີ້ນຟັງຊັນອື່ນຈາກພາຍນອກ)
const API_ACTIONS = {
  checkLogin: checkLogin,
  getMenu: getMenu,
  getAllMenuForAdmin: getAllMenuForAdmin,
  addMenuItem: addMenuItem,
  updateMenuItem: updateMenuItem,
  deleteMenuItem: deleteMenuItem,
  submitOrder: submitOrder,
  getOrdersByDate: getOrdersByDate
};

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const fn = API_ACTIONS[req.action];
    if (!fn) return jsonOutput({ error: 'ບໍ່ຮູ້ຈັກ action: ' + req.action });

    initAllsheetOnce();
    return jsonOutput({ result: fn.apply(null, req.args || []) });
  } catch (err) {
    return jsonOutput({ error: err.message });
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// openById ເປັນຄຳສັ່ງທີ່ຊ້າທີ່ສຸດໃນໄຟລ໌ນີ້ ຄຳຂໍຄັ້ງໜຶ່ງເປີດຄັ້ງດຽວພໍ
let SS = null;

function getSS() {
  if (!SS) SS = SpreadsheetApp.openById(SPREADSHEET_ID);
  return SS;
}

const PROP_SHEETS_READY = 'SHEETS_READY';

// PropertiesService ເປັນການເອີ້ນຂ້າມເຄືອຂ່າຍ ຖ້າຖາມທຸກຄຳຂໍຈະບວກເວລາໃຫ້ທຸກປຸ່ມລວມເຖິງຕອນເຂົ້າສູ່ລະບົບ
// Apps Script ໃຊ້ instance ເກົ່າຊ້ຳກັບຄຳຂໍທີ່ມາຕິດໆ ກັນ ຈື່ໃສ່ຕົວແປໄວ້ຈຶ່ງຂ້າມການຖາມໄປໄດ້ເລີຍ
let SHEETS_READY = false;

function initAllsheetOnce() {
  if (SHEETS_READY) return;

  const props = PropertiesService.getScriptProperties();
  if (props.getProperty(PROP_SHEETS_READY) !== '1') {
    initAllsheet();
    props.setProperty(PROP_SHEETS_READY, '1');
  }
  SHEETS_READY = true;
}

function resetInitFlag() {
  PropertiesService.getScriptProperties().deleteProperty(PROP_SHEETS_READY);
  SHEETS_READY = false;
  return 'ລ້າງ flag ແລ້ວ ຄັ້ງຕໍ່ໄປທີ່ເປີດໜ້າເວັບຈະ init ຊີດໝsecurity';
}

/* ຣັນຟັງຊັນນີ້ໃນຕົວແກ້ໄຂ Apps Script ແລ້ວເບິ່ງທີ່ບັນທຶກການດຳເນີນການ
   ເພື່ອບອກວ່າ openById ລົ້ມເຫຼວເພາະ ID ຜິດ ຫຼືເພາະຣັນຢູ່ຄົນລະບັນຊີກັບເຈົ້າຂອງໄຟລ໌ */
function checkConfig() {
  const lines = ['ບັນຊີທີ່ຣັນສະຄຣິບ: ' + (Session.getEffectiveUser().getEmail() || '(ບໍ່ທາມ)')];

  lines.push('SPREADSHEET_ID: ' + SPREADSHEET_ID + ' (' + SPREADSHEET_ID.length + ' ຕົວອັກສອນ)');
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    lines.push('  ເປີດໄດ້: "' + ss.getName() + '"');
    lines.push('  ຊີດທີ່ມີ: ' + ss.getSheets().map(s => s.getName()).join(', '));
  } catch (err) {
    lines.push('  ເປີດບໍ່ໄດ້: ' + err.message);
    lines.push('  → ກວດເບິ່ງວ່າ ID ກົງກັບ URL ຂອງໄຟລ໌ ແລະ ໄຟລ໌ຢູ່ໃນບັນຊີຂ້າງເທິງຫຼືຖືກແຊຣ໌ໃຫ້ບັນຊີເນັ້ນແລ້ວ');
  }

  lines.push('IMAGE_FOLDER_ID: ' + IMAGE_FOLDER_ID + ' (' + IMAGE_FOLDER_ID.length + ' ຕົວອັກສອນ)');
  try {
    lines.push('  ເປີດໄດ້: "' + DriveApp.getFolderById(IMAGE_FOLDER_ID).getName() + '"');
  } catch (err) {
    lines.push('  ເປີດບໍ່ໄດ້: ' + err.message);
  }

  const report = lines.join('\n');
  Logger.log(report);
  return report;
}

function checkLogin(username, password) {
  const sheet = getSS().getSheetByName(SHEET_USERS);
  if (!sheet) return { success: false, message: 'ບໍ່ພົບຊີດ Users ກະລຸນາຣັນ initAllsheet' };

  // ກັນການເຂົ້າສູ່ລະບົບດ້ວຍຄ່າຫວ່າງໄປກົງກັບແຖວຫວ່າງທີ່ຄ້າງຢູ່ໃນຊີດ
  if (String(username || '').trim() === '' || String(password || '') === '') {
    return { success: false, message: 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ' };
  }

  const data = sheet.getDataRange().getValues();
  data.shift();

  const user = data.find(r => String(r[0]).trim() === String(username).trim() && String(r[1]) === String(password));

  if (user) {
    return { success: true, username: user[0], role: user[2] || 'Staff' };
  } else {
    return { success: false, message: 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ' };
  }
}

// Helper: ດຶງ File ID ອອກຈາກລິ້ງ Drive ທຸກຮູບແບບ (ຫຼືຮັບ ID ດິບກໍໄດ້)
function extractDriveId(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  const m = s.match(/\/d\/([-\w]{20,})/) || s.match(/[?&]id=([-\w]{20,})/);
  if (m) return m[1];
  return /^[-\w]{20,}$/.test(s) ? s : '';
}

// Helper: ລິ້ງ Drive ແບບປົກຕິສຳລັບເກັບລົງຊີດ
function getDriveLink(fileId) {
  return fileId ? 'https://drive.google.com/file/d/' + fileId + '/view?usp=sharing' : '';
}

// Helper: ແປງຄ່າໃນຄໍລຳ DriveId ເປັນ URL ສຳລັບສະແດງພາບ
function getImageUrl(value) {
  const id = extractDriveId(value);
  return id ? 'https://lh3.googleusercontent.com/d/' + id : '';
}

// ຄໍລຳ "ເປີດຂາຍ" ອາດເປັນຊ່ອງຕິກ (boolean) ຫຼືຖືກພິມເປັນຂໍ້ຄວາມ TRUE / ແມ່ນ / 1
function toBool(v) {
  if (v === true || v === 1) return true;
  const s = String(v == null ? '' : v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y'
    || s === 'ແມ່ນ' || s === 'ເປີດ' || s === 'ເປີດຂາຍ' || s === 'ใช่' || s === 'เปิด' || s === 'เปิดขาย';
}

// ລາຄາທີ່ພິມມາພ້ອມເຄື່ອງໝາຍ ຫຼື ຈຳນວນເງິນ (ເຊັ່ນ "15,000") ຕ້ອງອ່ານເປັນຕົວເລກໃຫ້ໄດ້
function toNumber(v) {
  if (typeof v === 'number') return v;
  const n = Number(String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''));
  return isNaN(n) ? 0 : n;
}

// ແຖວທີ່ຍັງບໍ່ມີ ID ແຕ່ມີຊື່ເມນູ ຄວນຖືກອ່ານດ້ວຍ ບໍ່ແມ່ນຖືກຕັດຖິ້ມ
function isMenuRow(r) {
  return String(r[0] || '').trim() !== '' || String(r[2] || '').trim() !== '';
}

// ---------- ເມນູ ----------

function getMenu() {
  const sheet = getSS().getSheetByName(SHEET_MENU);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  data.shift();
  return data
    .filter(r => isMenuRow(r) && toBool(r[4]))
    .map(r => ({
      id: r[0],
      category: r[1],
      name: r[2],
      price: toNumber(r[3]),
      driveId: r[5] || '',
      fileId: extractDriveId(r[5]),
      imageUrl: getImageUrl(r[5])
    }));
}

function getAllMenuForAdmin() {
  const sheet = getSS().getSheetByName(SHEET_MENU);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  data.shift();
  return data
    .filter(isMenuRow)
    .map(r => ({
      id: r[0],
      category: r[1],
      name: r[2],
      price: toNumber(r[3]),
      active: toBool(r[4]),
      driveId: r[5] || '',
      fileId: extractDriveId(r[5]),
      imageUrl: getImageUrl(r[5])
    }));
}

/**
 * ຟັງຊັນຮັບໄຟລ໌ base64 ແລ້ວອັບໂຫລດໄປທີ່ Google Drive
 * ຄືນຄ່າລິ້ງ Drive ແບບປົກຕິເພື່ອເອົາໄປບັນທຶກລົງໃນ Sheet
 */
function uploadImageToDrive(base64Data, filename) {
  try {
    const splitData = base64Data.split(',');
    const contentType = splitData[0].match(/:(.*?);/)[1];
    const bytes = Utilities.base64Decode(splitData[1]);
    const blob = Utilities.newBlob(bytes, contentType, filename);
    
    // ຍັງບໍ່ທັນຕັ້ງ IMAGE_FOLDER_ID ກໍຍັງອັບໂຫລດໄດ້ ແຕ່ໄຟລ໌ຈະໄປຢູ່ໃນ My Drive
    const file = IMAGE_FOLDER_ID
      ? DriveApp.getFolderById(IMAGE_FOLDER_ID).createFile(blob)
      : DriveApp.createFile(blob);

    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (e) {
      try {
        file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e2) { /* ປ່ອຍໃຫ້ສືບທອດສິດຈາກໂຟນເດີ */ }
    }

    return getDriveLink(file.getId());
  } catch (err) {
    throw new Error('ການອັບໂຫລດຮູບພາບລົ້ມເຫຼວ: ' + err.message);
  }
}

function addMenuItem(item) {
  // ຮັບໄດ້ທັງລິ້ງ Drive ແລະ ID ດິບ ແລ້ວເກັບລົງຊີດເປັນລິ້ງສະເໝີ
  let driveLink = getDriveLink(extractDriveId(item.driveId));

  // ຫາກມີການແນບຮູບພາບໃໝ່ເຂົ້າມາແບບ base64
  if (item.imageBase64) {
    driveLink = uploadImageToDrive(item.imageBase64, 'menu_' + Date.now());
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sheet = getSS().getSheetByName(SHEET_MENU);
    const data = sheet.getDataRange().getValues();
    let maxId = 0;
    for (let i = 1; i < data.length; i++) {
      const n = Number(data[i][0]);
      if (n > maxId) maxId = n;
    }
    const newId = maxId + 1;
    sheet.appendRow([newId, item.category, item.name, toNumber(item.price), true, driveLink]);
    return { success: true, id: newId };
  } finally {
    lock.releaseLock();
  }
}

function updateMenuItem(item) {
  let driveLink = getDriveLink(extractDriveId(item.driveId));

  // ຫາກມີການເລືອກຮູບໃໝ່ເຂົ້າມາ
  if (item.imageBase64) {
    driveLink = uploadImageToDrive(item.imageBase64, 'menu_' + item.id + '_' + Date.now());
  }

  const sheet = getSS().getSheetByName(SHEET_MENU);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(item.id)) {
      sheet.getRange(i + 1, 2, 1, 5).setValues([[item.category, item.name, toNumber(item.price), toBool(item.active), driveLink]]);
      return { success: true };
    }
  }
  return { success: false, message: 'ບໍ່ພົບເມນູນີ້' };
}

function deleteMenuItem(id) {
  const sheet = getSS().getSheetByName(SHEET_MENU);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
  return { success: false, message: 'ບໍ່ພົບເມນູນີ້' };
}

// ---------- ອໍເດີ້ ----------

function submitOrder(order) {
  if (!order || !order.items || order.items.length === 0) {
    return { success: false, message: 'ບໍ່ມີລາຍການອາຫານໃນອໍເດີ້' };
  }
  const tz = Session.getScriptTimeZone();
  const now = new Date();
  const timeStr = Utilities.formatDate(now, tz, 'dd/MM/yyyy HH:mm:ss');

  let total = 0;
  order.items.forEach(it => { total += toNumber(it.price) * toNumber(it.qty); });

  // ສອງບິນທີ່ປິດໃນວິນາທີດຽວກັນຈະໄດ້ເລກທີບິນຊ້ຳ ຕໍ່ທ້າຍດ້ວຍມິນລິວິນາທີກັນຊົນ
  const orderId = 'OD' + Utilities.formatDate(now, tz, 'yyMMdd-HHmmss')
    + '-' + ('00' + (now.getTime() % 1000)).slice(-3);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    getSS().getSheetByName(SHEET_ORDERS).appendRow([
      orderId,
      timeStr,
      order.tableName || '-',
      JSON.stringify(order.items),
      total,
      order.payment || 'ເງິນສົດ',
      'ສຳເລັດ'
    ]);
  } finally {
    lock.releaseLock();
  }

  return { success: true, orderId: orderId, time: timeStr, total: total };
}

// date ເປັນ 'yyyy-MM-dd' ຕາມທີ່ <input type="date"> ສົ່ງມາ ຖ້າບໍ່ສົ່ງມາຈະຖືວ່າເປັນມື້ນີ້
function getOrdersByDate(date) {
  const sheet = getSS().getSheetByName(SHEET_ORDERS);
  if (!sheet) return { orders: [], count: 0, totalSales: 0 };
  const data = sheet.getDataRange().getValues();
  data.shift();
  const tz = Session.getScriptTimeZone();
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date || ''));
  const dayStr = ymd
    ? ymd[3] + '/' + ymd[2] + '/' + ymd[1]
    : Utilities.formatDate(new Date(), tz, 'dd/MM/yyyy');

  const timeStr = v => v instanceof Date ? Utilities.formatDate(v, tz, 'dd/MM/yyyy HH:mm:ss') : String(v);

  let totalSales = 0;
  const orders = data
    .filter(r => String(r[0] || '').trim() !== '' && timeStr(r[1]).indexOf(dayStr) === 0)
    .map(r => {
      totalSales += toNumber(r[4]);
      let items = [];
      try { items = JSON.parse(r[3] || '[]'); } catch (e) { items = []; }
      return {
        orderId: r[0],
        time: timeStr(r[1]),
        table: r[2],
        items: items,
        total: toNumber(r[4]),
        payment: r[5],
        status: r[6]
      };
    })
    .reverse();

  return { orders: orders, count: orders.length, totalSales: totalSales };
}