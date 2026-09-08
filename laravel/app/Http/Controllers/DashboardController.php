<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Organization;
use App\Models\Person;
use App\Models\Requirement;
use App\Models\Workflow;

class DashboardController extends Controller
{
    public function __invoke()
    {
        return view('dashboard', [
            'organizationCount' => Organization::query()->notDeleted()->count(),
            'departmentCount' => Department::query()->notDeleted()->count(),
            'personCount' => Person::query()->notDeleted()->count(),
            'workflowCount' => Workflow::query()->notDeleted()->count(),
            'requirementCount' => Requirement::query()->notDeleted()->count(),
            'recentOrganizations' => Organization::query()->notDeleted()->latest('updated_at')->limit(5)->get(),
            'recentWorkflows' => Workflow::query()->notDeleted()->with(['organization', 'department'])->latest('updated_at')->limit(5)->get(),
            'recentRequirements' => Requirement::query()->notDeleted()->latest('updated_at')->limit(5)->get(),
            'recentActivities' => AuditLog::query()->with('actor')->latest('created_at')->limit(8)->get(),
        ]);
    }
}
