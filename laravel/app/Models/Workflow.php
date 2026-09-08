<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Workflow extends Model
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $fillable = [
        'organization_id', 'department_id', 'name', 'description', 'status',
        'current_version', 'share_token', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['current_version' => 'integer'];
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(WorkflowBlock::class)->notDeleted();
    }

    public function edges(): HasMany
    {
        return $this->hasMany(WorkflowEdge::class);
    }

    public function versions(): HasMany
    {
        return $this->hasMany(WorkflowVersion::class)->orderByDesc('version');
    }

    public function builderPath(): string
    {
        return "/admin/organizations/{$this->organization_id}/departments/{$this->department_id}/workflow/{$this->id}";
    }

    public function lastSavedLabel(): string
    {
        if (! $this->updated_at) {
            return 'ยังไม่บันทึก';
        }

        return 'ตัวบันทึกล่าสุด · '.$this->updated_at->timezone('Asia/Bangkok')->format('d/m/Y H:i');
    }

    public function lastSavedAt(): string
    {
        return $this->updated_at?->timezone('Asia/Bangkok')->format('d/m/Y H:i') ?? '';
    }
}
