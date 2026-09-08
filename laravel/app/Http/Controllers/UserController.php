<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\Audit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index()
    {
        $users = User::query()->notDeleted()->orderBy('name')->get();

        return view('users.index', compact('users'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'username' => ['required', 'string', 'unique:users,username'],
            'email' => ['required', 'email', 'unique:users,email'],
            'pin' => ['required', 'digits:6'],
            'role' => ['required', 'in:ADMIN,EDITOR,VIEWER'],
        ]);
        $user = User::create([
            'name' => $data['name'],
            'username' => strtolower($data['username']),
            'email' => $data['email'],
            'password_hash' => Hash::make($data['pin']),
            'pin_lookup' => hash('sha256', $data['pin'].':'.config('app.key')),
            'role' => $data['role'],
            'status' => 'active',
        ]);
        Audit::write($request->user(), 'CREATE', 'User', $user->id);

        return back()->with('success', 'สร้างผู้ใช้แล้ว');
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
            'role' => ['required', 'in:ADMIN,EDITOR,VIEWER'],
            'status' => ['required', 'in:active,inactive'],
            'pin' => ['nullable', 'digits:6'],
        ]);
        $user->fill([
            'name' => $data['name'],
            'role' => $data['role'],
            'status' => $data['status'],
        ]);
        if (! empty($data['pin'])) {
            $user->password_hash = Hash::make($data['pin']);
        }
        $user->save();
        Audit::write($request->user(), 'UPDATE', 'User', $user->id);

        return back()->with('success', 'บันทึกผู้ใช้แล้ว');
    }

    public function destroy(Request $request, User $user)
    {
        $user->status = 'deleted';
        $user->save();
        $user->delete();
        Audit::write($request->user(), 'DELETE', 'User', $user->id);

        return back()->with('success', 'ลบผู้ใช้แล้ว');
    }
}
