<?php

namespace App\Support;

class PositionCatalog
{
    public static function templates(): array
    {
        return [
            ['key' => 'central-admin', 'title' => 'ธุรการกลาง'],
            ['key' => 'dept-admin', 'title' => 'ธุรการกอง'],
            ['key' => 'officer', 'title' => 'เจ้าหน้าที่'],
            ['key' => 'unit-head', 'title' => 'หัวหน้างาน'],
            ['key' => 'unit-admin', 'title' => 'ธุรการงาน'],
            ['key' => 'division-head', 'title' => 'หัวหน้าฝ่าย'],
            ['key' => 'director', 'title' => 'ผู้อำนวยการกอง'],
            ['key' => 'clerk', 'title' => 'ปลัด'],
            ['key' => 'deputy-mayor', 'title' => 'รองนายก'],
            ['key' => 'mayor', 'title' => 'นายก'],
        ];
    }

    public static function titles(): array
    {
        return array_column(self::templates(), 'title');
    }

    public static function codeFor(string $name): string
    {
        foreach (self::templates() as $template) {
            if ($template['title'] === $name) {
                return $template['key'];
            }
        }

        return '';
    }
}
