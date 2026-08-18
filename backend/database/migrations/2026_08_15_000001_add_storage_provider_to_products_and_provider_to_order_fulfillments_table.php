<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('storage_provider')->default('google_drive')->after('drive_folder_id');
            $table->text('mediafire_link')->nullable()->after('storage_provider');
        });

        Schema::table('order_fulfillments', function (Blueprint $table) {
            $table->string('provider')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['storage_provider', 'mediafire_link']);
        });

        Schema::table('order_fulfillments', function (Blueprint $table) {
            $table->dropColumn('provider');
        });
    }
};
