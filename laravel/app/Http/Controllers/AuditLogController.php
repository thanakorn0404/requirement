<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $query = AuditLog::query()->with('actor')->latest('created_at');
        if ($action = $request->get('action')) {
            $query->where('action', $action);
        }
        $logs = $query->paginate(40)->withQueryString();

        return view('audit.index', compact('logs'));
    }
}
