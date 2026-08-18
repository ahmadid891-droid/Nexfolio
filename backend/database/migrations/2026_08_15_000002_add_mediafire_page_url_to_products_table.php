<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->text('mediafire_page_url')->nullable()->after('mediafire_link');
            $table->timestamp('mediafire_link_resolved_at')->nullable()->after('mediafire_page_url');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['mediafire_page_url', 'mediafire_link_resolved_at']);
        });
    }
};
