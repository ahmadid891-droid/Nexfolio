<?php

namespace App\Console\Commands;

use App\Models\Setting;
use App\Services\GoogleDriveService;
use Illuminate\Console\Command;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Support\Facades\Crypt;

class EncryptDriveToken extends Command
{
    protected $signature = 'nexfolio:encrypt-drive-token';

    protected $description = 'Migrasi refresh token Google Drive agar tersimpan terenkripsi.';

    public function handle(GoogleDriveService $drive): int
    {
        $raw = Setting::get(GoogleDriveService::TOKEN_KEY);

        if (! $raw) {
            $this->info('Tidak ada token tersimpan di settings — tidak ada yang dimigrasi.');

            return self::SUCCESS;
        }

        try {
            Crypt::decryptString($raw);
            $this->info('Token sudah terenkripsi.');

            return self::SUCCESS;
        } catch (DecryptException) {
            // token lama plaintext
        }

        $drive->storeToken($raw);
        $this->info('Token berhasil dienkripsi.');

        return self::SUCCESS;
    }
}
