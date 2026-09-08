<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $fillable = [
        'name', 'username', 'email', 'password_hash', 'pin_lookup', 'role', 'status', 'last_login_at',
    ];

    protected $hidden = [
        'password_hash', 'pin_lookup',
    ];

    protected function casts(): array
    {
        return [
            'last_login_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    public function getRememberTokenName(): string
    {
        return '';
    }

    public function getRememberToken(): ?string
    {
        return null;
    }

    public function setRememberToken($value): void
    {
        // ตารางเดิมไม่มี remember_token
    }

    public function isAdmin(): bool
    {
        return $this->role === 'ADMIN';
    }

    public function canWrite(): bool
    {
        return in_array($this->role, ['ADMIN', 'EDITOR'], true);
    }

    public function homePath(): string
    {
        return $this->isAdmin() ? '/admin' : '/dashboard';
    }
}
