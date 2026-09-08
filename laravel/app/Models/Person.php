<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Person extends Model
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $table = 'people';

    protected $fillable = [
        'organization_id', 'department_id', 'position_id', 'first_name', 'last_name', 'display_name',
        'phone', 'email', 'description', 'status', 'created_by', 'updated_by',
    ];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function position(): BelongsTo
    {
        return $this->belongsTo(Position::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
