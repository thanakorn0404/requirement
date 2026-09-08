<?php

namespace App\Support;

class AppId
{
    public static function make(): string
    {
        return bin2hex(random_bytes(12));
    }
}
