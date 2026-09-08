<?php

namespace App\Http\Controllers;

use App\Models\Organization;
use App\Models\Requirement;
use App\Models\Workflow;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __invoke(Request $request)
    {
        $q = trim((string) $request->get('q', ''));
        $organizations = collect();
        $workflows = collect();
        $requirements = collect();
        if (strlen($q) >= 2) {
            $organizations = Organization::query()->notDeleted()->where('name', 'like', "%{$q}%")->limit(5)->get();
            $workflows = Workflow::query()->notDeleted()->where('name', 'like', "%{$q}%")->limit(5)->get();
            $requirements = Requirement::query()->notDeleted()->where('title', 'like', "%{$q}%")->limit(5)->get();
        }

        return view('search.index', compact('q', 'organizations', 'workflows', 'requirements'));
    }
}
