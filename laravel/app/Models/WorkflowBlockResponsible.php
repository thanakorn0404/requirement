<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkflowBlockResponsible extends Model
{
    use HasStringId;

    protected $table = 'workflow_block_responsibles';

    protected $fillable = [
        'block_id', 'person_id', 'responsibility',
    ];

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function block(): BelongsTo
    {
        return $this->belongsTo(WorkflowBlock::class, 'block_id');
    }
}
