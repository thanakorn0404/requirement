<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowVersion extends Model
{
    use HasStringId;

    public $timestamps = false;

    protected $fillable = [
        'workflow_id', 'version', 'name', 'blocks', 'edges', 'created_by', 'note', 'created_at',
    ];

    protected function casts(): array
    {
        return [
            'blocks' => 'array',
            'edges' => 'array',
            'created_at' => 'datetime',
            'version' => 'integer',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
