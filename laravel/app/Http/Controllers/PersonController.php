<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Organization;
use App\Models\Person;
use App\Models\Position;
use App\Support\Audit;
use Illuminate\Http\Request;

class PersonController extends Controller
{
    public function store(Request $request, Organization $organization, Department $department)
    {
        abort_unless($department->organization_id === $organization->id, 404);
        $data = $request->validate([
            'first_name' => ['required', 'string'],
            'last_name' => ['required', 'string'],
            'display_name' => ['nullable', 'string'],
            'position_id' => ['nullable', 'string'],
            'position_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $position = $this->resolvePosition($department, $request->user()->id, $data['position_id'] ?? null, $data['position_name'] ?? null);

        $person = Person::create([
            'organization_id' => $organization->id,
            'department_id' => $department->id,
            'position_id' => $position?->id,
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'display_name' => trim((string) ($data['display_name'] ?? '')) ?: trim($data['first_name'].' '.$data['last_name']),
            'phone' => $data['phone'] ?? '',
            'email' => $data['email'] ?? '',
            'description' => trim((string) ($data['description'] ?? '')),
            'status' => 'active',
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);
        Audit::write($request->user(), 'CREATE', 'Person', $person->id, $organization->id, $department->id);

        return back()->with('success', 'สร้างบุคลากรแล้ว');
    }

    public function destroy(Request $request, Person $person)
    {
        $person->status = 'deleted';
        $person->updated_by = $request->user()->id;
        $person->save();
        $person->delete();
        Audit::write($request->user(), 'DELETE', 'Person', $person->id);

        return back()->with('success', 'ลบบุคลากรแล้ว');
    }

    private function resolvePosition(Department $department, string $userId, ?string $positionId, ?string $positionName): ?Position
    {
        $name = trim((string) $positionName);
        if (is_string($positionId) && str_starts_with($positionId, 'new:')) {
            $name = trim(substr($positionId, 4)) ?: $name;
            $positionId = null;
        }

        if ($name !== '') {
            $position = Position::findOrCreateForDepartment($department, $name, $userId);
            if ($position->wasRecentlyCreated) {
                Audit::write(request()->user(), 'CREATE', 'Position', $position->id, $department->organization_id, $department->id);
            }

            return $position;
        }

        if (! $positionId) {
            return null;
        }

        return Position::query()
            ->notDeleted()
            ->where('department_id', $department->id)
            ->whereKey($positionId)
            ->first();
    }
}
