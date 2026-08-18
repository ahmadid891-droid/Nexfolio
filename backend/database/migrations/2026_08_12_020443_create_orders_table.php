<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('total_idr')->default(0);
            $table->string('status')->default('pending')->index(); // pending | paid | failed | expired
            $table->string('payment_type')->nullable(); // midtrans | free
            $table->string('midtrans_order_id')->nullable()->unique();
            $table->string('payment_method')->nullable(); // channel dari gateway
            $table->json('payment_info')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
