/**
 * PrintTrack Pro - Clean & Standard Google Apps Script Web App Engine
 * Target Spreadsheet ID: 1YTo31A2Uyt6RpI1fV_mgDbwbTbR2jVW3YvJLZ-kGBcA
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = { status: "success", timestamp: new Date().toISOString() };
  var action = "";

  if (e && e.parameter && e.parameter.action) {
    action = e.parameter.action;
  }

  if (!action && e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      action = body.action;
    } catch (err) {
      action = "";
    }
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === "initAllSheets") {
      initAllDatabaseTabs(ss);
      output.message = "All 12 Google Sheet Tabs initialized with exact headers.";
    } else if (action === "fetchAllData") {
      output.data = {
        users: getSheetRowsAsJson(ss, "Users"),
        hospitals: getSheetRowsAsJson(ss, "Hospitals"),
        counters: getSheetRowsAsJson(ss, "Counters"),
        paperTypes: getSheetRowsAsJson(ss, "PaperTypes"),
        monthlyReadings: getSheetRowsAsJson(ss, "MonthlyReadings"),
        stock: getSheetRowsAsJson(ss, "Stock"),
        stockLedger: getSheetRowsAsJson(ss, "StockLedger"),
        issueRegister: getSheetRowsAsJson(ss, "IssueRegister"),
        permissions: getSheetRowsAsJson(ss, "Permissions"),
        auditLog: getSheetRowsAsJson(ss, "AuditLog"),
        settings: getSheetRowsAsJson(ss, "Settings"),
        monthlyPeriods: getSheetRowsAsJson(ss, "MonthlyPeriods")
      };
    } else if (action === "appendRow") {
      var postBody = JSON.parse(e.postData.contents);
      appendRowToSheet(ss, postBody.tabName, postBody.rowData);
      output.message = "Row appended successfully to " + postBody.tabName;
    } else {
      output.message = "PrintTrack Pro Apps Script Web API Engine Online.";
    }
  } catch (err) {
    output.status = "error";
    output.error = err.toString();
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function initAllDatabaseTabs(ss) {
  var tabsSchema = {
    "Users": ["UserID", "FullName", "Email", "MobileNumber", "Role", "HospitalID", "IsActive", "CanEditReports", "CanExport", "LastLogin", "CreatedBy", "CreatedOn", "UpdatedOn"],
    "Hospitals": ["HospitalID", "HospitalCode", "HospitalName", "Address", "City", "ContactPerson", "Mobile", "TotalCounters", "IsActive", "CreatedOn", "UpdatedOn"],
    "Counters": ["CounterID", "HospitalID", "CounterName", "PrinterName", "Status", "InstallDate", "Remarks", "IsActive", "CreatedOn", "UpdatedOn"],
    "PaperTypes": ["PaperTypeID", "PaperName", "Size", "SheetsPerRim", "GSM", "Unit", "IsDefault", "IsActive"],
    "MonthlyReadings": ["ReadingID", "PeriodID", "HospitalID", "CounterID", "PaperTypeID", "OpeningReading", "ClosingReading", "PagesPrinted", "IssuedRims", "UsedRims", "BalanceRims", "ReadingLocked", "LockedOn", "LockedBy", "Verified", "VerifiedBy", "VerifiedOn", "Remarks", "CreatedBy", "CreatedOn", "UpdatedOn"],
    "Stock": ["StockID", "HospitalID", "PaperTypeID", "OpeningStock", "CurrentStock", "ReorderLevel", "LastUpdated"],
    "StockLedger": ["LedgerID", "Date", "HospitalID", "PaperTypeID", "TransactionType", "ReferenceID", "QuantityIn", "QuantityOut", "BalanceAfter", "Remarks", "CreatedBy", "CreatedOn"],
    "IssueRegister": ["IssueID", "IssueDate", "HospitalID", "CounterID", "PaperTypeID", "IssuedQty", "ReturnedQty", "ActualUsed", "Balance", "PeriodID", "IssuedBy", "Remarks", "CreatedOn"],
    "Permissions": ["PermissionID", "Role", "Module", "CanView", "CanCreate", "CanEdit", "CanDelete", "CanApprove", "CanExport"],
    "AuditLog": ["AuditID", "DateTime", "UserID", "Module", "Action", "RecordID", "OldValue", "NewValue", "Reason", "IPAddress", "Browser"],
    "Settings": ["Key", "Value", "Description"],
    "MonthlyPeriods": ["PeriodID", "Month", "Year", "StartDate", "EndDate", "Status", "ClosedBy", "ClosedOn"]
  };

  var tabNames = Object.keys(tabsSchema);
  for (var i = 0; i < tabNames.length; i++) {
    var tName = tabNames[i];
    var sheet = ss.getSheetByName(tName);
    if (!sheet) {
      sheet = ss.insertSheet(tName);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(tabsSchema[tName]);
    }
  }
}

function getSheetRowsAsJson(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  var headers = data[0];
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function appendRowToSheet(ss, sheetName, rowData) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var headers = sheet.getDataRange().getValues()[0];
  var arr = [];
  if (Array.isArray(rowData)) {
    arr = rowData;
  } else {
    for (var k = 0; k < headers.length; k++) {
      var h = headers[k];
      arr.push(rowData[h] !== undefined ? rowData[h] : "");
    }
  }
  sheet.appendRow(arr);
}
