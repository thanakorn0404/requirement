<?php

namespace App\Support;

use App\Models\AuditLog;
use App\Models\User;

class Audit
{
    public static function write(
        User $actor,
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?string $organizationId = null,
        ?string $departmentId = null,
        mixed $oldData = null,
        mixed $newData = null,
    ): void {
        AuditLog::create([
            'id' => AppId::make(),
            'actor_id' => $actor->id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId ?? '',
            'organization_id' => $organizationId,
            'department_id' => $departmentId,
            'old_data' => $oldData,
            'new_data' => $newData,
        ]);
    }
}
