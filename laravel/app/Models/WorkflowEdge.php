<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowEdge extends Model
{
    use HasStringId;

    protected $fillable = [
        'workflow_id', 'source_block_id', 'target_block_id', 'source_handle', 'target_handle',
        'type', 'label', 'animated',
    ];

    protected function casts(): array
    {
        return ['animated' => 'boolean'];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(Workflow::class);
    }
}
