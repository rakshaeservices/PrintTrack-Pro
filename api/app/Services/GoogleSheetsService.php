<?php
require_once __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../config/google_credentials.php';

use Google\Client;
use Google\Service\Sheets;
use Google\Service\Sheets\ValueRange;
use Google\Service\Sheets\ClearValuesRequest;

class GoogleSheetsService {
    private $client;
    private $service;
    private $spreadsheetId;

    public function __construct($spreadsheetId = null) {
        $this->client = new Client();
        // Force IPv4 and disable SSL verify (for XAMPP local environment)
        $this->client->setHttpClient(new \GuzzleHttp\Client([
            'force_ip_resolve' => 'v4',
            'verify' => false
        ]));
        
        $this->client->setApplicationName('PrintTrackPro');
        $this->client->setScopes([Sheets::SPREADSHEETS]);
        
        if (defined('GOOGLE_SERVICE_ACCOUNT_KEY_FILE') && file_exists(GOOGLE_SERVICE_ACCOUNT_KEY_FILE)) {
            $this->client->setAuthConfig(GOOGLE_SERVICE_ACCOUNT_KEY_FILE);
        } else {
            throw new Exception('Google Service Account key file not found or not configured.');
        }
        
        $this->client->setAccessType('offline');
        $this->service = new Sheets($this->client);
        
        if ($spreadsheetId) {
            $this->spreadsheetId = $spreadsheetId;
        }
    }

    public function setSpreadsheetId($spreadsheetId) {
        $this->spreadsheetId = $spreadsheetId;
    }

    public function append($range, $values) {
        if (!$this->spreadsheetId) throw new Exception('Spreadsheet ID not set');

        $body = new ValueRange(['values' => $values]);
        $params = [
            'valueInputOption' => 'USER_ENTERED',
            'insertDataOption' => 'OVERWRITE'
        ];
        
        try {
            $result = $this->service->spreadsheets_values->append($this->spreadsheetId, $range, $body, $params);
            return [
                'success' => true,
                'updates' => $result->getUpdates()
            ];
        } catch (Exception $e) {
            error_log('Google Sheets Append Error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function read($range) {
        if (!$this->spreadsheetId) throw new Exception('Spreadsheet ID not set');
        
        try {
            $response = $this->service->spreadsheets_values->get($this->spreadsheetId, $range);
            return [
                'success' => true,
                'values' => $response->getValues()
            ];
        } catch (Exception $e) {
            error_log('Google Sheets Read Error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function update($range, $values) {
        if (!$this->spreadsheetId) throw new Exception('Spreadsheet ID not set');

        $body = new ValueRange(['values' => $values]);
        $params = ['valueInputOption' => 'USER_ENTERED'];
        
        try {
            $result = $this->service->spreadsheets_values->update($this->spreadsheetId, $range, $body, $params);
            return [
                'success' => true,
                'updatedCells' => $result->getUpdatedCells()
            ];
        } catch (Exception $e) {
            error_log('Google Sheets Update Error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function clear($range) {
        if (!$this->spreadsheetId) throw new Exception('Spreadsheet ID not set');
        
        try {
            $requestBody = new ClearValuesRequest();
            $result = $this->service->spreadsheets_values->clear($this->spreadsheetId, $range, $requestBody);
            return [
                'success' => true,
                'clearedRange' => $result->getClearedRange()
            ];
        } catch (Exception $e) {
            error_log('Google Sheets Clear Error: ' . $e->getMessage());
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function createTabIfNotExists($title) {
        if (!$this->spreadsheetId) throw new Exception('Spreadsheet ID not set');
        try {
            $spreadsheet = $this->service->spreadsheets->get($this->spreadsheetId);
            $sheets = $spreadsheet->getSheets();
            foreach ($sheets as $s) {
                if ($s->getProperties()->getTitle() === $title) {
                    return true;
                }
            }

            $addSheetRequest = new \Google\Service\Sheets\AddSheetRequest([
                'properties' => ['title' => $title]
            ]);
            $request = new \Google\Service\Sheets\Request([
                'addSheet' => $addSheetRequest
            ]);
            $batchUpdateRequest = new \Google\Service\Sheets\BatchUpdateSpreadsheetRequest([
                'requests' => [$request]
            ]);
            $this->service->spreadsheets->batchUpdate($this->spreadsheetId, $batchUpdateRequest);
            return true;
        } catch (Exception $e) {
            error_log('Error creating tab in Google Sheets: ' . $e->getMessage());
            return false;
        }
    }
}
