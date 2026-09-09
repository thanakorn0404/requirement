<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Organization;
use App\Models\Person;
use App\Models\Requirement;
use App\Models\Workflow;
use App\Models\WorkflowBlock;
use App\Models\WorkflowBlockResponsible;
use App\Models\WorkflowEdge;
use App\Models\WorkflowVersion;
use App\Support\AppId;
use App\Support\Audit;
use App\Support\PositionCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WorkflowController extends Controller
{
    public function index()
    {
        $workflows = Workflow::query()->notDeleted()->with(['organization', 'department'])->latest('updated_at')->get();

        return view('workflows.index', compact('workflows'));
    }

    public function store(Request $request, Organization $organization, Department $department)
    {
        abort_unless($department->organization_id === $organization->id, 404);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $workflow = Workflow::create([
            'organization_id' => $organization->id,
            'department_id' => $department->id,
            'name' => $data['name'],
            'description' => $data['description'] ?? '',
            'status' => 'draft',
            'current_version' => 0,
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);
        Audit::write($request->user(), 'CREATE', 'Workflow', $workflow->id, $organization->id, $department->id);

        return redirect($workflow->builderPath())->with('success', 'สร้างการเดินหนังสือแล้ว');
    }

    public function builder(Organization $organization, Department $department, Workflow $workflow)
    {
        abort_unless($workflow->organization_id === $organization->id && $workflow->department_id === $department->id, 404);
        $workflow->load(['blocks.responsibles.person', 'edges', 'versions']);
        $persons = Person::query()
            ->notDeleted()
            ->with('position')
            ->where('department_id', $department->id)
            ->orderBy('display_name')
            ->get();
        $requirements = Requirement::query()->notDeleted()->where('workflow_id', $workflow->id)->get();
        $graph = $this->graphPayload($workflow);
        $positionTemplates = self::positionTemplates();
        $personOptions = $persons->map(fn ($person) => [
            'id' => $person->id,
            'displayName' => $person->display_name,
            'position' => $person->position?->name,
            'assignment' => $person->description,
        ])->values()->all();

        return view('workflows.builder', compact(
            'organization',
            'department',
            'workflow',
            'persons',
            'requirements',
            'graph',
            'positionTemplates',
            'personOptions'
        ));
    }

    public function full(Workflow $workflow)
    {
        $workflow->load(['blocks.responsibles.person', 'edges']);

        return response()->json([
            'id' => $workflow->id,
            'name' => $workflow->name,
            'status' => $workflow->status,
            'current_version' => $workflow->current_version,
            'share_token' => $workflow->share_token,
            'blocks' => $workflow->blocks->map(fn ($block) => $this->serializeBlock($block)),
            'edges' => $workflow->edges->map(fn ($edge) => $this->serializeEdge($edge)),
        ]);
    }

    public function draft(Request $request, Workflow $workflow)
    {
        $this->persistGraph($request, $workflow, official: false);
        $workflow->refresh()->unsetRelation('blocks')->unsetRelation('edges');
        $workflow->load(['blocks.responsibles.person', 'edges']);

        return response()->json([
            'blocks' => $workflow->blocks->map(fn ($block) => $this->serializeBlock($block)),
            'edges' => $workflow->edges->map(fn ($edge) => $this->serializeEdge($edge)),
            'saved_at' => $workflow->lastSavedAt(),
            'saved_label' => $workflow->lastSavedLabel(),
        ]);
    }

    public function save(Request $request, Workflow $workflow)
    {
        $this->persistGraph($request, $workflow, official: true);
        $workflow->refresh()->unsetRelation('blocks')->unsetRelation('edges');
        $workflow->load(['blocks.responsibles.person', 'edges']);
        Audit::write($request->user(), 'SAVE_WORKFLOW', 'Workflow', $workflow->id, $workflow->organization_id, $workflow->department_id);

        return response()->json([
            'workflow' => [
                'id' => $workflow->id,
                'name' => $workflow->name,
                'blocks' => $workflow->blocks->map(fn ($block) => $this->serializeBlock($block)),
                'edges' => $workflow->edges->map(fn ($edge) => $this->serializeEdge($edge)),
            ],
            'saved_at' => $workflow->lastSavedAt(),
            'saved_label' => $workflow->lastSavedLabel(),
        ]);
    }

    public function restore(Request $request, Workflow $workflow, int $version)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $snapshot = WorkflowVersion::query()
            ->where('workflow_id', $workflow->id)
            ->where('version', $version)
            ->firstOrFail();

        $request->merge([
            'blocks' => $snapshot->blocks,
            'edges' => $snapshot->edges,
        ]);
        $this->persistGraph($request, $workflow, official: true);
        Audit::write($request->user(), 'RESTORE_WORKFLOW', 'Workflow', $workflow->id, $workflow->organization_id, $workflow->department_id, ['version' => $version]);

        return back()->with('success', "เรียกคืนเวอร์ชัน {$version} และสร้างเวอร์ชันใหม่แล้ว");
    }

    public function share(Request $request, Workflow $workflow)
    {
        if (! $workflow->share_token) {
            $workflow->share_token = Str::random(24);
            $workflow->save();
        }

        return response()->json([
            'shareToken' => $workflow->share_token,
            'url' => url('/share/workflow/'.$workflow->share_token),
        ]);
    }

    public function publicShow(string $token)
    {
        [$workflow, $graph] = $this->publicWorkflow($token);
        $revision = $this->publicRevision($workflow, $graph);

        return view('workflows.share', compact('workflow', 'graph', 'revision'));
    }

    public function publicLive(string $token)
    {
        [$workflow, $graph] = $this->publicWorkflow($token);

        return response()->json([
            'revision' => $this->publicRevision($workflow, $graph),
            'name' => $workflow->name,
            'department' => $workflow->department->name ?? '',
            'organization' => $workflow->organization->name ?? '',
            'updated_label' => $workflow->updated_at
                ? $workflow->updated_at->timezone('Asia/Bangkok')->format('H:i:s')
                : '',
            'blocks' => $graph['blocks'],
            'edges' => $graph['edges'],
        ])->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    }

    public function print(Organization $organization, Department $department, Workflow $workflow)
    {
        abort_unless($workflow->organization_id === $organization->id && $workflow->department_id === $department->id, 404);
        $workflow->load(['blocks.responsibles.person', 'edges', 'organization', 'department']);
        $graph = $this->graphPayload($workflow);

        return view('workflows.print', compact('organization', 'department', 'workflow', 'graph'));
    }

    private function persistGraph(Request $request, Workflow $workflow, bool $official): void
    {
        $payload = $request->validate([
            'blocks' => ['array'],
            'blocks.*.id' => ['nullable', 'string'],
            'blocks.*.clientId' => ['nullable', 'string'],
            'blocks.*.title' => ['required', 'string'],
            'blocks.*.description' => ['nullable', 'string'],
            'blocks.*.blockType' => ['nullable', 'string'],
            'blocks.*.x' => ['numeric'],
            'blocks.*.y' => ['numeric'],
            'blocks.*.width' => ['numeric'],
            'blocks.*.height' => ['numeric'],
            'blocks.*.status' => ['nullable', 'string'],
            'blocks.*.responsiblePersons' => ['array'],
            'blocks.*.responsiblePersons.*.personId' => ['nullable', 'string'],
            'blocks.*.responsiblePersons.*.displayName' => ['nullable', 'string'],
            'blocks.*.responsiblePersons.*.responsibility' => ['nullable', 'string'],
            'edges' => ['array'],
            'edges.*.id' => ['nullable', 'string'],
            'edges.*.sourceBlockId' => ['required', 'string'],
            'edges.*.targetBlockId' => ['required', 'string'],
            'edges.*.sourceHandle' => ['nullable', 'string'],
            'edges.*.targetHandle' => ['nullable', 'string'],
            'edges.*.label' => ['nullable', 'string'],
            'edges.*.animated' => ['nullable', 'boolean'],
        ]);

        $idMap = [];
        $keptBlockIds = [];

        foreach ($payload['blocks'] ?? [] as $item) {
            $incomingId = $item['id'] ?? null;
            $isTemp = ! $incomingId || str_starts_with((string) $incomingId, 'temp_');
            $block = $isTemp
                ? new WorkflowBlock(['id' => AppId::make(), 'workflow_id' => $workflow->id])
                : WorkflowBlock::query()->where('workflow_id', $workflow->id)->where('id', $incomingId)->first()
                    ?? new WorkflowBlock(['id' => AppId::make(), 'workflow_id' => $workflow->id]);

            $block->fill([
                'title' => $item['title'],
                'description' => $item['description'] ?? '',
                'block_type' => $item['blockType'] ?? 'work',
                'x' => $item['x'],
                'y' => $item['y'],
                'width' => $item['width'],
                'height' => $item['height'],
                'status' => $item['status'] ?? 'active',
                'updated_by' => $request->user()->id,
            ]);
            if (! $block->exists) {
                $block->created_by = $request->user()->id;
            }
            $block->save();
            $idMap[$item['clientId'] ?? $incomingId ?? $block->id] = $block->id;
            $idMap[$block->id] = $block->id;
            $keptBlockIds[] = $block->id;

            WorkflowBlockResponsible::query()->where('block_id', $block->id)->delete();
            foreach ($item['responsiblePersons'] ?? [] as $person) {
                $personId = $this->resolvePersonId($workflow, $person, $request->user()->id);
                if (! $personId) {
                    continue;
                }
                WorkflowBlockResponsible::create([
                    'block_id' => $block->id,
                    'person_id' => $personId,
                    'responsibility' => $person['responsibility'] ?? '',
                ]);
            }
        }

        WorkflowBlock::query()
            ->where('workflow_id', $workflow->id)
            ->whereNotIn('id', $keptBlockIds ?: ['__none__'])
            ->get()
            ->each(function (WorkflowBlock $block) {
                $block->status = 'deleted';
                $block->save();
                $block->delete();
            });

        WorkflowEdge::query()->where('workflow_id', $workflow->id)->delete();
        foreach ($payload['edges'] ?? [] as $item) {
            $source = $idMap[$item['sourceBlockId']] ?? $item['sourceBlockId'];
            $target = $idMap[$item['targetBlockId']] ?? $item['targetBlockId'];
            WorkflowEdge::create([
                'workflow_id' => $workflow->id,
                'source_block_id' => $source,
                'target_block_id' => $target,
                'source_handle' => $item['sourceHandle'] ?? 'bottom',
                'target_handle' => $item['targetHandle'] ?? 'top',
                'type' => 'smoothstep',
                'label' => $item['label'] ?? '',
                'animated' => (bool) ($item['animated'] ?? false),
            ]);
        }

        $workflow->updated_by = $request->user()->id;
        if ($official) {
            $workflow->load(['blocks.responsibles.person', 'edges']);
            $next = ($workflow->current_version ?? 0) + 1;
            WorkflowVersion::create([
                'workflow_id' => $workflow->id,
                'version' => $next,
                'name' => 'Version '.$next,
                'blocks' => $workflow->blocks->map(fn ($block) => $this->serializeBlock($block))->values()->all(),
                'edges' => $workflow->edges->map(fn ($edge) => $this->serializeEdge($edge))->values()->all(),
                'created_by' => $request->user()->id,
                'note' => '',
                'created_at' => now(),
            ]);
            $workflow->current_version = $next;
            $workflow->status = 'review';
        }
        $workflow->save();
    }

    public static function positionTemplates(): array
    {
        return PositionCatalog::templates();
    }

    private function resolvePersonId(Workflow $workflow, array $person, string $userId): ?string
    {
        $id = $person['personId'] ?? null;
        if ($id && ! str_starts_with((string) $id, 'custom_') && Person::query()->whereKey($id)->exists()) {
            return $id;
        }

        $name = trim((string) ($person['displayName'] ?? data_get($person, 'person.displayName') ?? ''));
        if ($name === '') {
            return null;
        }

        $existing = Person::query()->notDeleted()
            ->where('department_id', $workflow->department_id)
            ->where('display_name', $name)
            ->first();
        if ($existing) {
            return $existing->id;
        }

        $parts = preg_split('/\s+/u', $name, 2) ?: [$name];
        $created = Person::create([
            'organization_id' => $workflow->organization_id,
            'department_id' => $workflow->department_id,
            'position_id' => null,
            'first_name' => $parts[0] ?: $name,
            'last_name' => $parts[1] ?? '',
            'display_name' => $name,
            'phone' => '',
            'email' => '',
            'description' => '',
            'status' => 'active',
            'created_by' => $userId,
            'updated_by' => $userId,
        ]);

        return $created->id;
    }

    private function publicWorkflow(string $token): array
    {
        $workflow = Workflow::query()->notDeleted()->where('share_token', $token)->firstOrFail();
        $workflow->load(['blocks.responsibles.person', 'edges', 'organization', 'department']);

        return [$workflow, $this->graphPayload($workflow)];
    }

    private function publicRevision(Workflow $workflow, array $graph): string
    {
        return hash('sha256', json_encode([
            $workflow->updated_at?->getTimestamp(),
            $workflow->name,
            $graph,
        ], JSON_UNESCAPED_UNICODE));
    }

    private function graphPayload(Workflow $workflow): array
    {
        return [
            'blocks' => $workflow->blocks->map(fn ($block) => $this->serializeBlock($block))->values()->all(),
            'edges' => $workflow->edges->map(fn ($edge) => $this->serializeEdge($edge))->values()->all(),
        ];
    }

    private function serializeBlock(WorkflowBlock $block): array
    {
        return [
            'id' => $block->id,
            'title' => $block->title,
            'description' => $block->description,
            'blockType' => $block->block_type,
            'x' => $block->x,
            'y' => $block->y,
            'width' => $block->width,
            'height' => $block->height,
            'status' => $block->status,
            'responsiblePersons' => $block->responsibles->map(fn ($item) => [
                'personId' => $item->person_id,
                'responsibility' => $item->responsibility,
                'person' => $item->person ? [
                    'id' => $item->person->id,
                    'displayName' => $item->person->display_name,
                ] : null,
            ])->values(),
        ];
    }

    private function serializeEdge(WorkflowEdge $edge): array
    {
        return [
            'id' => $edge->id,
            'sourceBlockId' => $edge->source_block_id,
            'targetBlockId' => $edge->target_block_id,
            'sourceHandle' => $edge->source_handle,
            'targetHandle' => $edge->target_handle,
            'type' => $edge->type,
            'label' => $edge->label,
            'animated' => $edge->animated,
        ];
    }
}
