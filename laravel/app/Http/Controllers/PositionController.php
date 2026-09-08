<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Organization;
use App\Models\Position;
use App\Support\Audit;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    public function store(Request $request, Organization $organization, Department $department)
    {
        abort_unless($department->organization_id === $organization->id, 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string'],
            'level' => ['nullable', 'integer'],
            'description' => ['nullable', 'string'],
        ]);
        $position = Position::findOrCreateForDepartment($department, $data['name'], $request->user()->id, [
            'code' => $data['code'] ?? '',
            'level' => $data['level'] ?? 0,
            'description' => $data['description'] ?? '',
        ]);
        if ($position->wasRecentlyCreated) {
            Audit::write($request->user(), 'CREATE', 'Position', $position->id, $organization->id, $department->id);

            return back()->with('success', 'สร้างตำแหน่งแล้ว');
        }

        return back()->with('success', 'มีตำแหน่งนี้อยู่แล้ว');
    }

    public function destroy(Request $request, Position $position)
    {
        $position->status = 'deleted';
        $position->updated_by = $request->user()->id;
        $position->save();
        $position->delete();
        Audit::write($request->user(), 'DELETE', 'Position', $position->id);

        return back()->with('success', 'ลบตำแหน่งแล้ว');
    }
}
