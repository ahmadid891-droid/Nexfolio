<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\LoginLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            Log::warning('Google OAuth callback gagal: '.$e->getMessage());

            return Redirect::to(rtrim(config('app.frontend_url'), '/').'/login?error=oauth');
        }

        $user = User::query()->firstOrCreate(
            ['email' => $googleUser->getEmail()],
            [
                'name' => $googleUser->getName(),
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'is_admin' => User::query()->count() === 0,
            ]
        );

        if ($user->google_id === null) {
            $user->google_id = $googleUser->getId();
        }
        if (! $user->avatar) {
            $user->avatar = $googleUser->getAvatar();
        }
        $user->save();

        $request->session()->regenerate();
        Auth::login($user);
        LoginLog::record($user, $request);

        return Redirect::to(rtrim(config('app.frontend_url'), '/').'/oauth/callback');
    }

    public function devLogin(Request $request, string $email)
    {
        abort_unless(app()->environment('local'), 404);

        $user = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => 'Dev '.$email,
                'email_verified_at' => now(),
                'is_admin' => User::query()->count() === 0,
            ]
        );

        $request->session()->regenerate();
        Auth::login($user);
        LoginLog::record($user, $request);

        return Redirect::to(rtrim(config('app.frontend_url'), '/').'/oauth/callback');
    }

    public function user(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['ok' => true]);
    }
}
