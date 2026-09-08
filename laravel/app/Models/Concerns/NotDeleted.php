<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait NotDeleted
{
    public function scopeNotDeleted(Builder $query): Builder
    {
        return $query->whereNull('deleted_at')->where('status', '!=', 'deleted');
    }
}
