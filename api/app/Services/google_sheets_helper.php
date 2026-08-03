<?php
require_once __DIR__ . '/GoogleSheetsService.php';
require_once __DIR__ . '/../../config/sheet_config.php';

function googleSheetsApiRequest($action, $sheetId = null, $sheetName = 'Hospitals', $data = null, $range = null) {
    if (!$sheetId) {
        $sheetId = PRINTTRACK_SPREADSHEET_ID;
    }
    
    try {
        $service = new GoogleSheetsService($sheetId);
        
        $targetRange = $range;
        if (empty($targetRange)) {
            $targetRange = $sheetName . '!A:Z';
        } elseif (strpos($targetRange, '!') === false) {
             $targetRange = $sheetName . '!' . $targetRange;
        }

        switch ($action) {
            case 'fetch':
                $result = $service->read($targetRange);
                if ($result['success']) {
                    return ['success' => true, 'data' => $result['values'] ?? []];
                }
                return ['success' => false, 'message' => $result['error']];

            case 'append':
                $service->createTabIfNotExists($sheetName);
                $result = $service->append($targetRange, $data);
                if ($result['success']) {
                    return ['success' => true, 'updates' => $result['updates']];
                }
                return ['success' => false, 'message' => $result['error']];

            case 'update':
                $result = $service->update($targetRange, $data);
                if ($result['success']) {
                    return ['success' => true, 'updatedCells' => $result['updatedCells']];
                }
                return ['success' => false, 'message' => $result['error']];

            case 'delete':
                $result = $service->clear($targetRange);
                if ($result['success']) {
                    return ['success' => true, 'clearedRange' => $result['clearedRange']];
                }
                return ['success' => false, 'message' => $result['error']];

            default:
                return ['success' => false, 'message' => 'Unsupported action: ' . $action];
        }
    } catch (Exception $e) {
        return ['success' => false, 'message' => $e->getMessage()];
    }
}
