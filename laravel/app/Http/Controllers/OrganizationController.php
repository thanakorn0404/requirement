<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Support\Audit;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    public function index(Request $request)
    {
        $query = Organization::query()->notDeleted();

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where('name', 'like', "%{$search}%");
        }
        if ($type = $request->get('type')) {
            $query->where('type', $type);
        }
        if ($province = $request->get('province')) {
            $query->where('province', $province);
        }

        $organizations = $query->orderBy('name')->paginate(24)->withQueryString();

        $provinces = cache()->remember('org:provinces', 300, function () {
            return Organization::query()
                ->notDeleted()
                ->where('province', '!=', '')
                ->distinct()
                ->orderBy('province')
                ->pluck('province');
        });

        return view('organizations.index', compact('organizations', 'provinces'));
    }

    public function store(Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $data = $this->stringFields($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'province' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'subdistrict' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
        ]));

        $org = Organization::create([
            'name' => $data['name'],
            'type' => $data['type'],
            'province' => $data['province'],
            'district' => $data['district'],
            'subdistrict' => $data['subdistrict'],
            'address' => $data['address'],
            'phone' => $data['phone'],
            'email' => $data['email'],
            'description' => '',
            'logo_url' => '',
            'status' => 'active',
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);
        cache()->forget('org:provinces');
        Audit::write($request->user(), 'CREATE', 'Organization', $org->id, $org->id);

        return redirect("/admin/organizations/{$org->id}")->with('success', 'สร้างหน่วยงานแล้ว');
    }

    public function show(Organization $organization)
    {
        $organization->load(['departments' => fn ($q) => $q->orderBy('name')]);

        return view('organizations.show', [
            'organization' => $organization,
            'departmentCount' => $organization->departments()->count(),
            'personCount' => $organization->people()->notDeleted()->count(),
            'workflowCount' => $organization->workflows()->notDeleted()->count(),
            'requirementCount' => $organization->requirements()->notDeleted()->count(),
        ]);
    }

    public function update(Request $request, Organization $organization)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $data = $this->stringFields($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string'],
            'province' => ['nullable', 'string'],
            'district' => ['nullable', 'string'],
            'subdistrict' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'phone' => ['nullable', 'string'],
            'email' => ['nullable', 'string'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', 'in:active,inactive'],
        ]));
        $organization->fill($data);
        $organization->updated_by = $request->user()->id;
        $organization->save();
        cache()->forget('org:provinces');
        Audit::write($request->user(), 'UPDATE', 'Organization', $organization->id, $organization->id);

        return back()->with('success', 'บันทึกหน่วยงานแล้ว');
    }

    public function destroy(Request $request, Organization $organization)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $organization->status = 'deleted';
        $organization->updated_by = $request->user()->id;
        $organization->save();
        $organization->delete();
        cache()->forget('org:provinces');
        Audit::write($request->user(), 'DELETE', 'Organization', $organization->id, $organization->id);

        return redirect('/admin/organizations')->with('success', 'ลบหน่วยงานแล้ว');
    }

    private function stringFields(array $data): array
    {
        foreach (['province', 'district', 'subdistrict', 'address', 'phone', 'email', 'description', 'logo_url'] as $field) {
            $data[$field] = trim((string) ($data[$field] ?? ''));
        }

        return $data;
    }
}
