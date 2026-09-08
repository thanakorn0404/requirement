<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Department extends Model
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $fillable = [
        'organization_id', 'name', 'code', 'type', 'description', 'status', 'created_by', 'updated_by',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function positions(): HasMany
    {
        return $this->hasMany(Position::class)->notDeleted();
    }

    public function people(): HasMany
    {
        return $this->hasMany(Person::class)->notDeleted();
    }

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class)->notDeleted();
    }

    public function requirements(): HasMany
    {
        return $this->hasMany(Requirement::class);
    }
}
