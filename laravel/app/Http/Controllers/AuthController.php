<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            return redirect(Auth::user()->homePath());
        }

        return response()
            ->view('auth.login')
            ->header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
            ->header('Pragma', 'no-cache');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string'],
            'pin' => ['required', 'digits:6'],
        ]);

        $user = User::query()
            ->notDeleted()
            ->where('username', strtolower(trim($data['username'])))
            ->where('status', 'active')
            ->first();

        if (! $user || ! password_verify($data['pin'], $user->password_hash)) {
            return back()->withInput($request->only('username'))->with('error', 'Username หรือ PIN ไม่ถูกต้อง');
        }

        Auth::login($user);
        $request->session()->regenerate();
        $user->forceFill(['last_login_at' => now()])->save();
        Audit::write($user, 'LOGIN', 'User', $user->id);

        return redirect()->intended($user->homePath())->with('success', 'เข้าสู่ระบบสำเร็จ');
    }

    public function logout(Request $request)
    {
        if ($user = $request->user()) {
            Audit::write($user, 'LOGOUT', 'User', $user->id);
        }
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }

    public function settings()
    {
        return view('settings.index');
    }

    public function updatePin(Request $request)
    {
        $data = $request->validate([
            'current_pin' => ['required', 'digits:6'],
            'new_pin' => ['required', 'digits:6', 'different:current_pin'],
        ]);

        $user = $request->user();
        if (! password_verify($data['current_pin'], $user->password_hash)) {
            return back()->with('error', 'PIN ปัจจุบันไม่ถูกต้อง');
        }

        $user->forceFill([
            'password_hash' => Hash::make($data['new_pin']),
        ])->save();

        Audit::write($user, 'UPDATE', 'User', $user->id, newData: ['pin' => 'changed']);

        return back()->with('success', 'เปลี่ยน PIN เรียบร้อยแล้ว');
    }
}
