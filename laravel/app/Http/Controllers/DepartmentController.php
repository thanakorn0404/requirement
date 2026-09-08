<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Organization;
use App\Support\Audit;
use App\Support\PositionCatalog;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function store(Request $request, Organization $organization)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string'],
            'type' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $department = Department::create([
            'organization_id' => $organization->id,
            'name' => $data['name'],
            'code' => $data['code'] ?? '',
            'type' => $data['type'] ?? 'กอง',
            'description' => $data['description'] ?? '',
            'status' => 'active',
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);
        Audit::write($request->user(), 'CREATE', 'Department', $department->id, $organization->id, $department->id);

        return redirect("/admin/organizations/{$organization->id}/departments/{$department->id}")
            ->with('success', 'สร้างกอง / สำนักแล้ว');
    }

    public function show(Organization $organization, Department $department)
    {
        abort_unless($department->organization_id === $organization->id, 404);

        $department->load([
            'positions' => fn ($q) => $q->orderBy('name'),
            'people' => fn ($q) => $q->with('position')->orderBy('display_name'),
            'workflows' => fn ($q) => $q->orderByDesc('updated_at'),
        ]);
        $requirements = $department->requirements()->notDeleted()->latest('updated_at')->limit(50)->get();
        $positionTemplates = PositionCatalog::templates();

        return view('departments.show', compact('organization', 'department', 'requirements', 'positionTemplates'));
    }

    public function update(Request $request, Organization $organization, Department $department)
    {
        abort_unless($department->organization_id === $organization->id, 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string'],
            'type' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
        ]);
        $department->fill($data);
        $department->updated_by = $request->user()->id;
        $department->save();
        Audit::write($request->user(), 'UPDATE', 'Department', $department->id, $organization->id, $department->id);

        return back()->with('success', 'บันทึกกอง / สำนักแล้ว');
    }
}
