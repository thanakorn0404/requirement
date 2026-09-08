<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class WorkflowBlock extends Model
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $fillable = [
        'workflow_id', 'title', 'description', 'block_type', 'x', 'y', 'width', 'height',
        'status', 'created_by', 'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'x' => 'float',
            'y' => 'float',
            'width' => 'float',
            'height' => 'float',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }

    public function responsibles(): HasMany
    {
        return $this->hasMany(WorkflowBlockResponsible::class, 'block_id');
    }
}
