<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\RequirementController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkflowController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/login'));
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/share/workflow/{token}', [WorkflowController::class, 'publicShow']);
Route::get('/share/workflow/{token}/live', [WorkflowController::class, 'publicLive']);

Route::middleware('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    Route::get('/admin', DashboardController::class);
    Route::get('/dashboard', DashboardController::class);
    Route::get('/admin/settings', [AuthController::class, 'settings']);
    Route::get('/dashboard/settings', [AuthController::class, 'settings']);
    Route::post('/settings/pin', [AuthController::class, 'updatePin']);
    Route::get('/search', SearchController::class);

    Route::get('/admin/organizations', [OrganizationController::class, 'index']);
    Route::post('/admin/organizations', [OrganizationController::class, 'store'])->middleware('write');
    Route::get('/admin/organizations/{organization}', [OrganizationController::class, 'show']);
    Route::put('/admin/organizations/{organization}', [OrganizationController::class, 'update'])->middleware('write');
    Route::delete('/admin/organizations/{organization}', [OrganizationController::class, 'destroy'])->middleware('write');

    Route::post('/admin/organizations/{organization}/departments', [DepartmentController::class, 'store'])->middleware('write');
    Route::get('/admin/organizations/{organization}/departments/{department}', [DepartmentController::class, 'show']);
    Route::put('/admin/organizations/{organization}/departments/{department}', [DepartmentController::class, 'update'])->middleware('write');

    Route::post('/admin/organizations/{organization}/departments/{department}/positions', [PositionController::class, 'store'])->middleware('write');
    Route::delete('/admin/positions/{position}', [PositionController::class, 'destroy'])->middleware('write');
    Route::post('/admin/organizations/{organization}/departments/{department}/persons', [PersonController::class, 'store'])->middleware('write');
    Route::delete('/admin/persons/{person}', [PersonController::class, 'destroy'])->middleware('write');

    Route::get('/admin/workflows', [WorkflowController::class, 'index']);
    Route::post('/admin/organizations/{organization}/departments/{department}/workflows', [WorkflowController::class, 'store'])->middleware('write');
    Route::get('/admin/organizations/{organization}/departments/{department}/workflow/{workflow}', [WorkflowController::class, 'builder']);
    Route::get('/admin/organizations/{organization}/departments/{department}/workflow/{workflow}/print', [WorkflowController::class, 'print']);
    Route::get('/admin/workflows/{workflow}/full', [WorkflowController::class, 'full']);
    Route::post('/admin/workflows/{workflow}/draft', [WorkflowController::class, 'draft'])->middleware('write');
    Route::post('/admin/workflows/{workflow}/save', [WorkflowController::class, 'save'])->middleware('write');
    Route::post('/admin/workflows/{workflow}/share', [WorkflowController::class, 'share'])->middleware('write');
    Route::post('/admin/workflows/{workflow}/restore/{version}', [WorkflowController::class, 'restore'])->middleware('admin');

    Route::get('/admin/requirements', [RequirementController::class, 'index']);
    Route::post('/admin/organizations/{organization}/departments/{department}/requirements', [RequirementController::class, 'store'])->middleware('write');
    Route::put('/admin/requirements/{requirement}', [RequirementController::class, 'update'])->middleware('write');
    Route::delete('/admin/requirements/{requirement}', [RequirementController::class, 'destroy'])->middleware('write');

    Route::middleware('admin')->group(function () {
        Route::get('/admin/users', [UserController::class, 'index']);
        Route::post('/admin/users', [UserController::class, 'store']);
        Route::put('/admin/users/{user}', [UserController::class, 'update']);
        Route::delete('/admin/users/{user}', [UserController::class, 'destroy']);
        Route::get('/admin/audit-logs', [AuditLogController::class, 'index']);
    });
});
