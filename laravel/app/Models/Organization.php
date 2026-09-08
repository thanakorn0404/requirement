<?php

namespace App\Models;

use App\Models\Concerns\HasStringId;
use App\Models\Concerns\NotDeleted;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasStringId, NotDeleted, SoftDeletes;

    protected $fillable = [
        'name', 'type', 'province', 'district', 'subdistrict', 'address', 'phone', 'email',
        'description', 'logo_url', 'status', 'created_by', 'updated_by',
    ];

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class)->notDeleted();
    }

    public function people(): HasMany
    {
        return $this->hasMany(Person::class);
    }

    public function workflows(): HasMany
    {
        return $this->hasMany(Workflow::class);
    }

    public function requirements(): HasMany
    {
        return $this->hasMany(Requirement::class);
    }
}
