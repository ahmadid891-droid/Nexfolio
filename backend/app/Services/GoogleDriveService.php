<?php

namespace App\Services;

use App\Models\Setting;
use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class GoogleDriveService
{
    public const FOLDER_NAME = 'Showcase Products';

    public const FOLDER_KEY = 'google_drive_folder_id';

    public const TOKEN_KEY = 'google_drive_refresh_token';

    protected ?Client $client = null;

    protected ?Drive $drive = null;

    public function token(): ?string
    {
        $raw = Setting::get(self::TOKEN_KEY);

        if ($raw) {
            try {
                return Crypt::decryptString($raw);
            } catch (DecryptException) {
                // nilai lama (plaintext) yang belum terenkripsi
                return $raw;
            }
        }

        return config('services.google_drive.refresh_token');
    }

    public function storeToken(string $token): void
    {
        Setting::set(self::TOKEN_KEY, Crypt::encryptString($token));
    }

    public function client(): Client
    {
        if ($this->client instanceof Client) {
            return $this->client;
        }

        $client = new Client();
        $client->setClientId(config('services.google_drive.client_id'));
        $client->setClientSecret(config('services.google_drive.client_secret'));
        $client->setScopes([Drive::DRIVE_FILE]);
        $client->setAccessType('offline');
        $client->setApprovalPrompt('force');
        $client->setRedirectUri(config('services.google_drive.redirect'));

        $token = $this->token();

        if ($token) {
            $client->setAccessToken(['refresh_token' => $token, 'access_token' => '', 'expires_in' => 0]);
        }

        $this->client = $client;

        return $client;
    }

    public function drive(): Drive
    {
        if (! $this->drive instanceof Drive) {
            $this->drive = new Drive($this->client());
        }

        return $this->drive;
    }

    public function isConfigured(): bool
    {
        return (bool) $this->token();
    }

    public function authUrl(): string
    {
        return $this->client()->createAuthUrl();
    }

    public function exchangeCode(string $code): string
    {
        $token = $this->client()->fetchAccessTokenWithAuthCode($code);

        if (isset($token['error'])) {
            Log::error('Google Drive token error', $token);
            throw new \RuntimeException($token['error_description'] ?? 'Gagal menukar kode OAuth Drive.');
        }

        $refreshToken = $token['refresh_token'] ?? null;

        if (! $refreshToken) {
            throw new \RuntimeException('Tidak ada refresh_token. Gunakan prompt=consent & access_type=offline.');
        }

        $this->storeToken($refreshToken);

        return $refreshToken;
    }

    public function ensureFolder(): string
    {
        $existing = Setting::get(self::FOLDER_KEY);

        if ($existing) {
            return $existing;
        }

        $folderId = $this->findOrCreateFolder(self::FOLDER_NAME);
        Setting::set(self::FOLDER_KEY, $folderId);

        return $folderId;
    }

    protected function findOrCreateFolder(string $name, ?string $parentId = null): string
    {
        $parentClause = $parentId ? " and '{$parentId}' in parents" : '';

        $query = sprintf(
            "name = '%s' and mimeType = 'application/vnd.google-apps.folder' and trashed = false%s",
            str_replace("'", "\\'", $name),
            $parentClause
        );

        $files = $this->drive()->files->listFiles([
            'q' => $query,
            'spaces' => 'drive',
            'fields' => 'files(id,name)',
            'pageSize' => 1,
        ]);

        if (count($files->getFiles()) > 0) {
            return $files->getFiles()[0]->getId();
        }

        $metadata = [
            'name' => $name,
            'mimeType' => 'application/vnd.google-apps.folder',
        ];

        if ($parentId) {
            $metadata['parents'] = [$parentId];
        }

        $created = $this->drive()->files->create(new DriveFile($metadata), ['fields' => 'id']);

        return $created->getId();
    }

    public function ensureProductFolder(string $folderName): string
    {
        $parentId = $this->ensureFolder();

        return $this->findOrCreateFolder($folderName, $parentId);
    }

    public function upload(string $filePath, string $fileName): array
    {
        return $this->uploadIntoFolder($this->ensureFolder(), $filePath, $fileName);
    }

    public function uploadIntoFolder(string $folderId, string $filePath, string $fileName): array
    {
        $file = new DriveFile([
            'name' => $fileName,
            'parents' => [$folderId],
        ]);

        $response = $this->drive()->files->create($file, [
            'data' => file_get_contents($filePath),
            'mimeType' => mime_content_type($filePath) ?: 'application/octet-stream',
            'uploadType' => 'multipart',
            'fields' => 'id,name,webViewLink',
        ]);

        return [
            'id' => $response->getId(),
            'name' => $response->getName(),
            'webViewLink' => $response->getWebViewLink(),
        ];
    }

    public function trashFile(string $fileId): void
    {
        try {
            $this->drive()->files->update($fileId, new DriveFile(['trashed' => true]));
        } catch (\Throwable $e) {
            Log::warning("GoogleDrive trashFile gagal untuk {$fileId}: ".$e->getMessage());
        }
    }

    public function getWebViewLink(string $fileId): ?string
    {
        $file = $this->drive()->files->get($fileId, ['fields' => 'id,webViewLink']);

        return $file->getWebViewLink();
    }

    public function grantAccess(string $fileId, string $email): void
    {
        $permission = new Permission([
            'type' => 'user',
            'role' => 'reader',
            'emailAddress' => $email,
        ]);

        try {
            $this->drive()->permissions->create($fileId, $permission);
        } catch (\Exception $e) {
            Log::error("GoogleDrive grantAccess failed for {$email} on {$fileId}: ".$e->getMessage());
            throw $e;
        }
    }

    public function revokeAccess(string $fileId, string $email): void
    {
        $permissions = $this->drive()->permissions->listPermissions($fileId, [
            'fields' => 'permissions(id,emailAddress,type)',
        ]);

        foreach ($permissions->getPermissions() as $permission) {
            if (strcasecmp((string) $permission->getEmailAddress(), $email) === 0) {
                $this->drive()->permissions->delete($fileId, $permission->getId());
            }
        }
    }
}
