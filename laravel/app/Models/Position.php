<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use App\Support\PositionCatalog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Position extends Model
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $fillable = [
        'department_id', 'name', 'code', 'level', 'description', 'status', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['level' => 'integer'];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public static function findOrCreateForDepartment(Department $department, string $name, string $userId, array $extra = []): self
    {
        $name = trim($name);
        $existing = static::query()->notDeleted()
            ->where('department_id', $department->id)
            ->where('name', $name)
            ->first();
        if ($existing) {
            return $existing;
        }

        return static::create([
            'department_id' => $department->id,
            'name' => $name,
            'code' => ($extra['code'] ?? '') !== '' ? $extra['code'] : PositionCatalog::codeFor($name),
            'level' => $extra['level'] ?? 0,
            'description' => $extra['description'] ?? '',
            'status' => 'active',
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);
    }
}
