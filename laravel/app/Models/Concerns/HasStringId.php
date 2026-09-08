<?php

namespace App\Models\Concerns;

use App\Support\AppId;

trait HasStringId
{
    public function initializeHasStringId(): void
    {
        $this->incrementing = false;
        $this->keyType = 'string';
    }

    protected static function bootHasStringId(): void
    {
        static::creating(function ($model) {
            if (! $model->getKey()) {
                $model->{$model->getKeyName()} = AppId::make();
            }
        });
    }
}
