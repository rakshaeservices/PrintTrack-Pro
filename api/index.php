<?php
/**
 * PrintTrack Pro - Live Backend Controller for Google Sheet ID: 1YTo31A2Uyt6RpI1fV_mgDbwbTbR2jVW3YvJLZ-kGBcA
 * Maps all 12 exact Google Sheet Tabs & Schema Ranges:
 * 1. Users (Users!A:M)
 * 2. Hospitals (Hospitals!A:K)
 * 3. Counters (Counters!A:J)
 * 4. PaperTypes (PaperTypes!A:H)
 * 5. MonthlyReadings (MonthlyReadings!A:U)
 * 6. Stock (Stock!A:G)
 * 7. StockLedger (StockLedger!A:L)
 * 8. IssueRegister (IssueRegister!A:M)
 * 9. Permissions (Permissions!A:I)
 * 10. AuditLog (AuditLog!A:K)
 * 11. Settings (Settings!A:C)
 * 12. MonthlyPeriods (MonthlyPeriods!A:H)
 */

error_reporting(0);
ob_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    ob_end_clean();
    exit();
}

header('Content-Type: application/json');

require_once __DIR__ . '/app/Services/google_sheets_helper.php';

function sendJson($data) {
    while (ob_get_level() > 0) {
        @ob_end_clean();
    }
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit();
}

function parseSheetRowsToObjects($values) {
    if (empty($values) || count($values) <= 1) return [];
    $headers = $values[0];
    $rows = [];
    for ($i = 1; $i < count($values); $i++) {
        $rowObj = [];
        for ($j = 0; $j < count($headers); $j++) {
            $rowObj[$headers[$j]] = $values[$i][$j] ?? '';
        }
        $rows[] = $rowObj;
    }
    return $rows;
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$sheetId = PRINTTRACK_SPREADSHEET_ID;

if (empty($action)) {
    $inputData = json_decode(file_get_contents('php://input'), true);
    $action = $inputData['action'] ?? '';
}

switch ($action) {
    case 'fetchAll':
    case 'getInitialData':
        $usersRes = googleSheetsApiRequest('fetch', $sheetId, 'Users!A:M');
        $hospitalsRes = googleSheetsApiRequest('fetch', $sheetId, 'Hospitals!A:K');
        $countersRes = googleSheetsApiRequest('fetch', $sheetId, 'Counters!A:J');
        $paperTypesRes = googleSheetsApiRequest('fetch', $sheetId, 'PaperTypes!A:H');
        $readingsRes = googleSheetsApiRequest('fetch', $sheetId, 'MonthlyReadings!A:U');
        $stockRes = googleSheetsApiRequest('fetch', $sheetId, 'Stock!A:G');
        $stockLedgerRes = googleSheetsApiRequest('fetch', $sheetId, 'StockLedger!A:L');
        $issueRegisterRes = googleSheetsApiRequest('fetch', $sheetId, 'IssueRegister!A:M');
        $permissionsRes = googleSheetsApiRequest('fetch', $sheetId, 'Permissions!A:I');
        $auditLogRes = googleSheetsApiRequest('fetch', $sheetId, 'AuditLog!A:K');
        $settingsRes = googleSheetsApiRequest('fetch', $sheetId, 'Settings!A:C');
        $periodsRes = googleSheetsApiRequest('fetch', $sheetId, 'MonthlyPeriods!A:H');

        sendJson([
            'status' => 'success',
            'data' => [
                'users' => parseSheetRowsToObjects($usersRes['data'] ?? []),
                'hospitals' => parseSheetRowsToObjects($hospitalsRes['data'] ?? []),
                'counters' => parseSheetRowsToObjects($countersRes['data'] ?? []),
                'paperTypes' => parseSheetRowsToObjects($paperTypesRes['data'] ?? []),
                'monthlyReadings' => parseSheetRowsToObjects($readingsRes['data'] ?? []),
                'stock' => parseSheetRowsToObjects($stockRes['data'] ?? []),
                'stockLedger' => parseSheetRowsToObjects($stockLedgerRes['data'] ?? []),
                'issueRegister' => parseSheetRowsToObjects($issueRegisterRes['data'] ?? []),
                'permissions' => parseSheetRowsToObjects($permissionsRes['data'] ?? []),
                'auditLog' => parseSheetRowsToObjects($auditLogRes['data'] ?? []),
                'settings' => parseSheetRowsToObjects($settingsRes['data'] ?? []),
                'monthlyPeriods' => parseSheetRowsToObjects($periodsRes['data'] ?? [])
            ]
        ]);
        break;

    case 'appendRow':
        $postData = json_decode(file_get_contents('php://input'), true);
        $tabName = $postData['tabName'] ?? 'AuditLog';
        $rowData = $postData['rowData'] ?? [];
        $res = googleSheetsApiRequest('append', $sheetId, $tabName, [$rowData]);
        sendJson(['status' => $res['success'] ? 'success' : 'error', 'message' => $res['message'] ?? 'Row appended']);
        break;

    default:
        sendJson([
            'status' => 'success',
            'system' => 'PrintTrack Pro 12-Tab Live API Engine',
            'sheet_id' => $sheetId,
            'auth' => 'Google Service Account'
        ]);
        break;
}
