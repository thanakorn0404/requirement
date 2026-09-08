<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Organization;
use App\Models\Requirement;
use App\Support\Audit;
use Illuminate\Http\Request;

class RequirementController extends Controller
{
    public function index(Request $request)
    {
        $query = Requirement::query()->notDeleted()->with(['organization', 'department', 'person']);
        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('requirement_code', 'like', "%{$search}%");
            });
        }
        $requirements = $query->latest('updated_at')->paginate(50)->withQueryString();

        return view('requirements.index', compact('requirements'));
    }

    public function store(Request $request, Organization $organization, Department $department)
    {
        abort_unless($department->organization_id === $organization->id, 404);
        $data = $this->validated($request);
        $req = Requirement::create([
            ...$this->map($data, $organization->id, $department->id),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);
        if (! $req->requirement_code) {
            $req->requirement_code = 'REQ-'.strtoupper(substr($req->id, 0, 6));
            $req->save();
        }
        Audit::write($request->user(), 'CREATE', 'Requirement', $req->id, $organization->id, $department->id);

        return back()->with('success', 'บันทึกความต้องการของระบบแล้ว');
    }

    public function update(Request $request, Requirement $requirement)
    {
        $data = $this->validated($request, false);
        $requirement->fill($this->map($data, $requirement->organization_id, $requirement->department_id));
        $requirement->updated_by = $request->user()->id;
        $requirement->save();
        Audit::write($request->user(), 'UPDATE', 'Requirement', $requirement->id, $requirement->organization_id, $requirement->department_id);

        return back()->with('success', 'แก้ไขความต้องการของระบบแล้ว');
    }

    public function destroy(Request $request, Requirement $requirement)
    {
        $requirement->status = 'deleted';
        $requirement->updated_by = $request->user()->id;
        $requirement->save();
        $requirement->delete();
        Audit::write($request->user(), 'DELETE', 'Requirement', $requirement->id);

        return back()->with('success', 'ลบความต้องการของระบบแล้ว');
    }

    private function validated(Request $request, bool $requireTitle = true): array
    {
        return $request->validate([
            'title' => [$requireTitle ? 'required' : 'nullable', 'string'],
            'requirement_code' => ['nullable', 'string'],
            'category' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'workflow_id' => ['nullable', 'string'],
            'block_id' => ['nullable', 'string'],
            'responsible_person_id' => ['nullable', 'string'],
            'position_id' => ['nullable', 'string'],
            'input' => ['nullable', 'string'],
            'process' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
            'related_documents' => ['nullable', 'string'],
            'current_problem' => ['nullable', 'string'],
            'desired_behavior' => ['nullable', 'string'],
            'priority' => ['nullable', 'string'],
            'status' => ['nullable', 'string'],
            'note' => ['nullable', 'string'],
        ]);
    }

    private function map(array $data, string $organizationId, string $departmentId): array
    {
        return [
            'organization_id' => $organizationId,
            'department_id' => $departmentId,
            'title' => $data['title'] ?? '',
            'requirement_code' => $data['requirement_code'] ?? '',
            'category' => $data['category'] ?? 'workflow',
            'description' => $data['description'] ?? '',
            'workflow_id' => $data['workflow_id'] ?: null,
            'block_id' => $data['block_id'] ?: null,
            'responsible_person_id' => $data['responsible_person_id'] ?: null,
            'position_id' => $data['position_id'] ?: null,
            'input' => $data['input'] ?? '',
            'process' => $data['process'] ?? '',
            'output' => $data['output'] ?? '',
            'related_documents' => $data['related_documents'] ?? '',
            'current_problem' => $data['current_problem'] ?? '',
            'desired_behavior' => $data['desired_behavior'] ?? '',
            'priority' => $data['priority'] ?? 'medium',
            'status' => $data['status'] ?? 'draft',
            'note' => $data['note'] ?? '',
        ];
    }
}
