<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Requirement extends Model
{
    use HasStringId, SoftDeletes;

    protected $fillable = [
        'organization_id', 'department_id', 'workflow_id', 'block_id', 'responsible_person_id',
        'position_id', 'requirement_code', 'title', 'category', 'description', 'input', 'process',
        'output', 'related_documents', 'current_problem', 'desired_behavior', 'priority', 'status',
        'note', 'orphaned', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return ['orphaned' => 'boolean'];
    }

    public function scopeNotDeleted($query)
    {
        return $query->whereNull('deleted_at')->where('status', '!=', 'deleted');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class, 'responsible_person_id');
    }
}
