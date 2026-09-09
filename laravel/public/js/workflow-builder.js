const POSITION_TEMPLATES = window.WORKFLOW.positionTemplates || [
  { key: "central-admin", title: "ธุรการกลาง" },
  { key: "dept-admin", title: "ธุรการกอง" },
  { key: "officer", title: "เจ้าหน้าที่" },
  { key: "unit-head", title: "หัวหน้างาน" },
  { key: "unit-admin", title: "ธุรการงาน" },
  { key: "division-head", title: "หัวหน้าฝ่าย" },
  { key: "director", title: "ผู้อำนวยการกอง" },
  { key: "clerk", title: "ปลัด" },
  { key: "deputy-mayor", title: "รองนายก" },
  { key: "mayor", title: "นายก" },
];

const state = {
  blocks: structuredClone(window.WORKFLOW.blocks || []),
  edges: structuredClone(window.WORKFLOW.edges || []),
  persons: structuredClone(window.WORKFLOW.persons || []),
  selected: null,
  selectedEdge: null,
  dirty: false,
  connecting: null,
};

const canvas = document.getElementById("canvas");
const edgesSvg = document.getElementById("edges");
const props = document.getElementById("props");
const saveState = document.getElementById("save-state");
const csrf = window.WORKFLOW.csrf;
const canWrite = window.WORKFLOW.canWrite;
const printMode = !!window.WORKFLOW.printMode;

function uid() {
  return "temp_" + crypto.randomUUID();
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function personName(entry) {
  return entry?.person?.displayName || entry?.displayName || entry?.personId || "";
}

function positionTone(title) {
  const map = {
    นายก: "tone-mayor",
    รองนายก: "tone-mayor",
    ปลัด: "tone-clerk",
    ผู้อำนวยการกอง: "tone-director",
    หัวหน้าฝ่าย: "tone-head",
    หัวหน้างาน: "tone-head",
    ธุรการกลาง: "tone-admin",
    ธุรการกอง: "tone-admin",
    ธุรการงาน: "tone-admin",
    เจ้าหน้าที่: "tone-staff",
  };
  return map[title] || "tone-admin";
}

function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "•";
  return parts.slice(0, 2).map((part) => part[0]).join("");
}

let draftTimer;
let mutation = 0;

function markDirty() {
  state.dirty = true;
  mutation += 1;
  if (saveState) saveState.textContent = "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก";
  scheduleDraft();
}

function setSavedLabel(label) {
  if (saveState && label) saveState.textContent = label;
}

function scheduleDraft() {
  if (!canWrite) return;
  clearTimeout(draftTimer);
  draftTimer = setTimeout(persistDraft, 1200);
}

function persistNow() {
  clearTimeout(draftTimer);
  persistDraft();
}

async function persistDraft() {
  if (!canWrite || !state.dirty) return;
  const at = mutation;
  if (saveState) saveState.textContent = "กำลังบันทึกร่าง";
  const res = await fetch(`/admin/workflows/${window.WORKFLOW.id}/draft`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf, Accept: "application/json" },
    body: JSON.stringify(payload()),
  });
  if (at !== mutation) {
    scheduleDraft();
    return;
  }
  if (res.ok) {
    const data = await res.json();
    if (at !== mutation) {
      scheduleDraft();
      return;
    }
    const selected = state.selected;
    state.blocks = data.blocks;
    state.edges = data.edges;
    state.dirty = false;
    state.selected = selected;
    setSavedLabel(data.saved_label);
    render();
  } else if (saveState) {
    saveState.textContent = "บันทึกร่างไม่สำเร็จ";
  }
}

function payload() {
  return {
    blocks: state.blocks.map((block) => ({
      id: String(block.id).startsWith("temp_") ? undefined : block.id,
      clientId: block.id,
      title: block.title,
      description: block.description || "",
      blockType: block.blockType || "position",
      x: block.x,
      y: block.y,
      width: block.width || 260,
      height: block.height || 180,
      status: block.status || "active",
      responsiblePersons: (block.responsiblePersons || []).map((person) => ({
        personId: person.personId,
        displayName: personName(person),
        responsibility: person.responsibility || "",
      })),
    })),
    edges: state.edges.map((edge) => ({
      id: String(edge.id || "").startsWith("temp_") ? undefined : edge.id,
      sourceBlockId: edge.sourceBlockId,
      targetBlockId: edge.targetBlockId,
      sourceHandle: edge.sourceHandle || "bottom",
      targetHandle: edge.targetHandle || "top",
      label: edge.label || "",
      animated: Boolean(edge.animated),
    })),
  };
}

async function saveOfficial() {
  if (!canWrite) return;
  const at = mutation;
  if (saveState) saveState.textContent = "กำลังบันทึก";
  const res = await fetch(`/admin/workflows/${window.WORKFLOW.id}/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-TOKEN": csrf, Accept: "application/json" },
    body: JSON.stringify(payload()),
  });
  if (at !== mutation) return;
  if (res.ok) {
    const data = await res.json();
    const selected = state.selected;
    state.blocks = data.workflow.blocks;
    state.edges = data.workflow.edges;
    state.dirty = false;
    state.selected = selected;
    setSavedLabel(data.saved_label);
    window.stsToast?.("บันทึกการเดินหนังสือแล้ว");
    render();
  } else if (saveState) {
    saveState.textContent = "บันทึกไม่สำเร็จ";
  }
}

function createBlock(title, description = "", extra = {}) {
  const block = {
    id: uid(),
    title,
    description,
    blockType: extra.blockType || "position",
    x: extra.x ?? 80 + (state.blocks.length % 4) * 300,
    y: extra.y ?? 80 + Math.floor(state.blocks.length / 4) * 220,
    width: 260,
    height: 180,
    status: "active",
    responsiblePersons: extra.responsiblePersons || [],
  };
  state.blocks.push(block);
  state.selected = block.id;
  markDirty();
  render();
}

function addPersonToBlock(block, person) {
  if (!block || !person) return false;
  const personId = person.id || person.personId;
  const displayName = person.displayName || personName(person);
  if (!personId && !displayName) return false;
  block.responsiblePersons = block.responsiblePersons || [];
  const exists = block.responsiblePersons.some((item) => {
    if (personId && item.personId === personId) return true;
    return personName(item) === displayName;
  });
  if (exists) return false;
  block.responsiblePersons.push({
    personId: personId || "custom_" + uid(),
    displayName,
    responsibility: person.responsibility || person.assignment || "",
    person: { id: personId, displayName },
  });
  if (!state.persons.some((item) => item.id === personId) && displayName) {
    state.persons.push({ id: personId || "custom_" + uid(), displayName });
  }
  return true;
}

async function removeBlock(blockId) {
  const ok = await (window.stsConfirm
    ? window.stsConfirm("ลบบล็อคนี้และเส้นเชื่อมที่เกี่ยวข้องหรือไม่?", "ลบบล็อคตำแหน่ง")
    : Promise.resolve(window.confirm("ลบบล็อคนี้หรือไม่?")));
  if (!ok) return;
  state.blocks = state.blocks.filter((item) => item.id !== blockId);
  state.edges = state.edges.filter((edge) => edge.sourceBlockId !== blockId && edge.targetBlockId !== blockId);
  if (state.selected === blockId) state.selected = null;
  state.selectedEdge = null;
  markDirty();
  persistNow();
  render();
  window.stsToast?.("ลบบล็อคแล้ว");
}

window.addBlock = function addBlock() {
  const dialog = document.getElementById("add-block");
  const title = document.getElementById("add-block-title");
  const desc = document.getElementById("add-block-desc");
  if (!dialog) return;
  if (title) title.value = title.options?.[1]?.value || "";
  if (desc) desc.value = "";
  dialog.showModal();
  title?.focus();
};

document.getElementById("add-block-form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = document.getElementById("add-block-title")?.value.trim();
  const description = document.getElementById("add-block-desc")?.value.trim() || "";
  if (!title) return;
  createBlock(title, description, { blockType: "position" });
  document.getElementById("add-block")?.close();
});

function blockEl(block) {
  const el = document.createElement("div");
  el.className = "wf-node " + positionTone(block.title) + (state.selected === block.id ? " selected" : "");
  el.style.position = "absolute";
  el.style.left = block.x + "px";
  el.style.top = block.y + "px";
  el.style.width = (block.width || 260) + "px";
  el.style.zIndex = state.selected === block.id ? "4" : "3";
  el.dataset.id = block.id;
  const people = block.responsiblePersons || [];
  const peopleHtml = people.length
    ? people.map((person) => `
        <div class="block-person">
          <span class="block-avatar">${esc(initials(personName(person)))}</span>
          <div class="min-w-0">
            <div class="block-person-name">${esc(personName(person))}</div>
            <div class="block-person-role">${esc(person.responsibility || "ผู้รับผิดชอบ")}</div>
          </div>
        </div>
      `).join("")
    : `<div class="wf-drop">${canWrite ? "ลากชื่อบุคลากรมาวางที่นี่" : "ยังไม่มีผู้รับผิดชอบ"}</div>`;
  el.innerHTML = `
    <div class="handle top" data-handle="top"></div>
    <div class="wf-node-card">
      <div class="wf-node-head">
        <div class="min-w-0">
          <span class="wf-node-kicker">ตำแหน่ง</span>
          <div class="wf-node-title">${esc(block.title)}</div>
          ${block.description ? `<div class="wf-node-desc">${esc(block.description)}</div>` : ""}
        </div>
        ${canWrite ? `<button type="button" class="wf-node-del" data-block-del aria-label="ลบบล็อค">✕</button>` : ""}
      </div>
      <div class="wf-node-body">${peopleHtml}</div>
    </div>
    <div class="handle bottom" data-handle="bottom"></div>
  `;
  if (!printMode) {
    el.addEventListener("mousedown", (event) => startDrag(event, block));
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      if (event.target.closest("[data-block-del]")) return;
      state.selected = block.id;
      state.selectedEdge = null;
      render();
    });
  } else {
    el.style.cursor = "default";
  }
  el.querySelector("[data-block-del]")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeBlock(block.id);
  });
  el.querySelector("[data-block-del]")?.addEventListener("mousedown", (event) => {
    event.stopPropagation();
  });
  el.querySelectorAll(".handle").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      startConnect(event, block, handle.dataset.handle || "bottom");
    });
    handle.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  });
  return el;
}

let drag = null;
let connectDrag = null;

function handlePoint(block, handleName) {
  const box = blockBox(block);
  const x = box.x + box.w / 2;
  if (handleName === "top") return { x, y: box.y };
  return { x, y: box.y + box.h };
}

function startConnect(event, block, handleName) {
  if (!canWrite || event.button !== 0) return;
  connectDrag = {
    fromId: block.id,
    fromHandle: handleName,
    pointerId: event.pointerId,
  };
  try {
    event.currentTarget.setPointerCapture(event.pointerId);
  } catch (error) {
    // ignore browsers that reject capture
  }
  drawConnectPreview(event);
}

function drawConnectPreview(event) {
  const source = state.blocks.find((item) => item.id === connectDrag?.fromId);
  if (!source) return;
  drawEdges();
  const from = handlePoint(source, connectDrag.fromHandle);
  const to = canvasPoint(event);
  const svg = edgesLayer();
  if (!svg) return;
  const guessTo = connectDrag.fromHandle === "bottom" ? "top" : "bottom";
  const curve = edgeCurve(from, to, connectDrag.fromHandle, guessTo);
  svg.appendChild(svgEl("path", { class: "wf-edge-preview", d: curve.d, fill: "none" }));

  const under = document.elementFromPoint(event.clientX, event.clientY);
  const target = under?.closest(".wf-node");
  canvas?.querySelectorAll(".wf-node.is-drop-target").forEach((el) => el.classList.remove("is-drop-target"));
  if (target && target.dataset.id !== connectDrag.fromId) target.classList.add("is-drop-target");
}

function finishConnect(event) {
  if (!connectDrag) return;
  const from = connectDrag;
  connectDrag = null;
  canvas?.querySelectorAll(".wf-node.is-drop-target").forEach((el) => el.classList.remove("is-drop-target"));
  const sourceEl = canvas?.querySelector(`.wf-node[data-id="${from.fromId}"]`);
  if (sourceEl) sourceEl.style.pointerEvents = "none";
  const hit = document.elementFromPoint(event.clientX, event.clientY);
  if (sourceEl) sourceEl.style.pointerEvents = "";
  const target = hit?.closest(".wf-node");
  if (!target || target.dataset.id === from.fromId) {
    drawEdges();
    return;
  }
  const exists = state.edges.some((edge) => edge.sourceBlockId === from.fromId && edge.targetBlockId === target.dataset.id);
  if (!exists) {
    const toHandle = hit?.closest("[data-handle]")?.dataset.handle || (from.fromHandle === "bottom" ? "top" : "bottom");
    state.edges.push({
      id: uid(),
      sourceBlockId: from.fromId,
      targetBlockId: target.dataset.id,
      sourceHandle: from.fromHandle,
      targetHandle: toHandle,
      label: "",
    });
    markDirty();
  }
  render();
}

function startDrag(event, block) {
  if (!canWrite || connectDrag || event.target.closest(".handle") || event.target.closest("[data-block-del]")) return;
  const point = canvasPoint(event);
  drag = { id: block.id, dx: point.x - block.x, dy: point.y - block.y };
}

window.addEventListener("mousemove", (event) => {
  if (!drag || !canvas) return;
  const block = state.blocks.find((item) => item.id === drag.id);
  if (!block) return;
  const point = canvasPoint(event);
  block.x = Math.max(0, point.x - drag.dx);
  block.y = Math.max(0, point.y - drag.dy);
  render();
});
window.addEventListener("mouseup", () => {
  if (drag) markDirty();
  drag = null;
});

const wrap = document.getElementById("canvas-wrap");

if (canvas && !printMode) {
  canvas.addEventListener("click", (event) => {
    if (connectDrag || paletteDrag) return;
    if (event.target.closest(".wf-edge")) return;
    state.selected = null;
    state.selectedEdge = null;
    render();
  });
}

function dropAtEvent(event, payload) {
  if (!canWrite || !payload) return;
  const point = canvasPoint(event);
  const target = event.target.closest(".wf-node");

  if (payload.type === "position" && payload.data?.title) {
    createBlock(payload.data.title, "", { x: Math.max(0, point.x - 40), y: Math.max(0, point.y - 20), blockType: "position" });
    return;
  }

  if (payload.type === "person" && payload.data) {
    if (target) {
      const block = state.blocks.find((item) => item.id === target.dataset.id);
      if (addPersonToBlock(block, payload.data)) {
        state.selected = block.id;
        markDirty();
        render();
      }
      return;
    }
    window.stsToast?.("ลากชื่อไปวางในบล็อคตำแหน่งบนแผนผัง");
  }
}

let paletteDrag = null;

function startPaletteDrag(event, payload, label) {
  event.currentTarget.setPointerCapture?.(event.pointerId);
  const ghost = document.createElement("div");
  ghost.className = "palette-ghost";
  ghost.textContent = label;
  ghost.style.left = event.clientX + 12 + "px";
  ghost.style.top = event.clientY + 12 + "px";
  document.body.appendChild(ghost);
  paletteDrag = {
    payload,
    startX: event.clientX,
    startY: event.clientY,
    moved: false,
    ghost,
  };
}

function finishPaletteDrag(event) {
  if (!paletteDrag) return;
  const current = paletteDrag;
  paletteDrag = null;
  current.ghost?.remove();
  const overCanvas = wrap?.contains(event.target) || canvas?.contains(event.target);
  if (current.moved && overCanvas) {
    dropAtEvent(event, current.payload);
    return;
  }
  if (!current.moved && current.payload.type === "position") {
    createBlock(current.payload.data.title, "", { blockType: "position" });
  }
}

window.addEventListener("pointermove", (event) => {
  if (connectDrag) {
    event.preventDefault();
    drawConnectPreview(event);
    return;
  }
  if (!paletteDrag) return;
  const dx = event.clientX - paletteDrag.startX;
  const dy = event.clientY - paletteDrag.startY;
  if (!paletteDrag.moved && Math.hypot(dx, dy) > 6) {
    paletteDrag.moved = true;
  }
  if (paletteDrag.moved) {
    event.preventDefault();
  }
  if (paletteDrag.ghost) {
    paletteDrag.ghost.style.left = event.clientX + 12 + "px";
    paletteDrag.ghost.style.top = event.clientY + 12 + "px";
  }
}, { passive: false });

window.addEventListener("pointerup", (event) => {
  finishConnect(event);
  finishPaletteDrag(event);
});
window.addEventListener("pointercancel", (event) => {
  if (connectDrag) {
    connectDrag = null;
    canvas?.querySelectorAll(".wf-node.is-drop-target").forEach((el) => el.classList.remove("is-drop-target"));
    drawEdges();
  }
  finishPaletteDrag(event);
});

async function removeEdge(edgeId) {
  if (!canWrite) return;
  const ok = await (window.stsConfirm
    ? window.stsConfirm("ลบเส้นเชื่อมนี้หรือไม่?", "ลบเส้นเชื่อม")
    : Promise.resolve(window.confirm("ลบเส้นเชื่อมนี้หรือไม่?")));
  if (!ok) return;
  state.edges = state.edges.filter((item) => item.id !== edgeId);
  if (state.selectedEdge === edgeId) state.selectedEdge = null;
  markDirty();
  persistNow();
  render();
  window.stsToast?.("ลบเส้นเชื่อมแล้ว");
}

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

function edgeCurve(from, to, fromHandle, toHandle) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bend = Math.max(42, Math.min(130, Math.abs(dy) * 0.42 + 28));
  const fromDir = fromHandle === "top" ? -1 : 1;
  const toDir = toHandle === "top" ? -1 : 1;
  let c1 = { x: from.x, y: from.y + fromDir * bend };
  let c2 = { x: to.x, y: to.y + toDir * bend };
  if (Math.abs(dy) < 48) {
    const side = dx === 0 ? 1 : Math.sign(dx);
    const pull = Math.min(90, Math.max(36, Math.abs(dx) * 0.28));
    c1.x = from.x + side * pull;
    c2.x = to.x - side * pull;
  }
  return {
    d: `M ${from.x} ${from.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${to.x} ${to.y}`,
    mid: cubicPoint(from, c1, c2, to, 0.5),
    c1,
    c2,
    from,
    to,
  };
}

function edgeArrow(curve, fill) {
  const dx = curve.to.x - curve.c2.x;
  const dy = curve.to.y - curve.c2.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tip = curve.to;
  const back = { x: tip.x - ux * 11, y: tip.y - uy * 11 };
  const px = -uy * 4.4;
  const py = ux * 4.4;
  return svgEl("path", {
    class: "wf-edge-arrow",
    d: `M ${tip.x} ${tip.y} L ${back.x + px} ${back.y + py} L ${back.x - px} ${back.y - py} Z`,
    fill,
  });
}

function svgEl(name, attrs = {}) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null || value === "") return;
    el.setAttribute(key, String(value));
  });
  return el;
}

function edgesLayer() {
  let svg = document.getElementById("edges");
  if (!svg && canvas) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = "edges";
    svg.setAttribute("class", "edge-layer");
    canvas.prepend(svg);
  }
  return svg;
}

function layerSize() {
  if (printMode && canvas) {
    return {
      w: Math.max(420, canvas.offsetWidth || 1800),
      h: Math.max(320, canvas.offsetHeight || 1200),
    };
  }
  return { w: 1800, h: 1200 };
}

function sizePrintCanvas() {
  if (!printMode || !canvas) return;
  const nodes = [...canvas.querySelectorAll(".wf-node")];
  if (!nodes.length) return;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = 0;
  let maxY = 0;
  nodes.forEach((el) => {
    minX = Math.min(minX, el.offsetLeft);
    minY = Math.min(minY, el.offsetTop);
    maxX = Math.max(maxX, el.offsetLeft + el.offsetWidth);
    maxY = Math.max(maxY, el.offsetTop + el.offsetHeight);
  });
  const pad = 48;
  const dx = pad - (Number.isFinite(minX) ? minX : 0);
  const dy = pad - (Number.isFinite(minY) ? minY : 0);
  nodes.forEach((el) => {
    el.style.left = `${el.offsetLeft + dx}px`;
    el.style.top = `${el.offsetTop + dy}px`;
  });
  canvas.style.transform = "none";
  canvas.style.zoom = "";
  canvas.style.setProperty("min-width", "0", "important");
  canvas.style.setProperty("min-height", "0", "important");
  canvas.style.width = `${maxX + dx + pad}px`;
  canvas.style.height = `${maxY + dy + pad}px`;
}

function blockBox(block) {
  const el = canvas?.querySelector(`.wf-node[data-id="${block.id}"]`);
  return {
    x: el ? el.offsetLeft : block.x,
    y: el ? el.offsetTop : block.y,
    w: el?.offsetWidth || block.width || 260,
    h: el?.offsetHeight || block.height || 160,
  };
}

function drawEdges() {
  const svg = edgesLayer();
  if (!svg) return;
  const size = layerSize();
  svg.innerHTML = "";
  svg.setAttribute("width", String(size.w));
  svg.setAttribute("height", String(size.h));
  svg.setAttribute("viewBox", `0 0 ${size.w} ${size.h}`);
  svg.style.width = size.w + "px";
  svg.style.height = size.h + "px";

  state.edges.forEach((edge) => {
    const source = state.blocks.find((item) => item.id === edge.sourceBlockId);
    const target = state.blocks.find((item) => item.id === edge.targetBlockId);
    if (!source || !target) return;
    const from = handlePoint(source, edge.sourceHandle || "bottom");
    const to = handlePoint(target, edge.targetHandle || "top");
    const curve = edgeCurve(from, to, edge.sourceHandle || "bottom", edge.targetHandle || "top");
    const selected = state.selectedEdge === edge.id;
    const group = svgEl("g", {
      class: selected ? "wf-edge is-on" : "wf-edge",
      "data-edge-id": edge.id,
    });
    group.appendChild(svgEl("path", { class: "wf-edge-glow", d: curve.d, fill: "none" }));
    group.appendChild(svgEl("path", { class: "wf-edge-hit", d: curve.d, fill: "none" }));
    group.appendChild(svgEl("path", { class: "wf-edge-line", d: curve.d, fill: "none" }));
    group.appendChild(edgeArrow(curve, selected ? "#e11d2e" : "#be123c"));

    if (canWrite) {
      const btn = svgEl("g", {
        class: "wf-edge-del",
        transform: `translate(${curve.mid.x} ${curve.mid.y})`,
        role: "button",
        "aria-label": "ลบเส้นเชื่อม",
      });
      btn.appendChild(svgEl("circle", { r: "11", cx: "0", cy: "0" }));
      btn.appendChild(svgEl("path", { d: "M -3.6 -3.6 L 3.6 3.6 M 3.6 -3.6 L -3.6 3.6", fill: "none" }));
      btn.addEventListener("pointerdown", (event) => event.stopPropagation());
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeEdge(edge.id);
      });
      group.appendChild(btn);
      group.addEventListener("click", (event) => {
        event.stopPropagation();
        if (event.target.closest(".wf-edge-del")) return;
        state.selected = null;
        state.selectedEdge = edge.id;
        render();
      });
    }

    svg.appendChild(group);
  });
}

function renderProps() {
  if (!props) return;
  const block = state.blocks.find((item) => item.id === state.selected);
  if (!block) {
    if (state.selectedEdge && canWrite) {
      props.innerHTML = `
        <p class="mb-1 font-semibold text-sts-deep">เส้นเชื่อม</p>
        <p class="muted">คลิกปุ่ม ✕ บนเส้น หรือกด Delete เพื่อลบเส้นนี้</p>
        <button type="button" class="btn ghost mt-4" id="p-del-edge">ลบเส้นเชื่อมนี้</button>
      `;
      document.getElementById("p-del-edge")?.addEventListener("click", () => removeEdge(state.selectedEdge));
      return;
    }
    props.innerHTML = `
      <p class="mb-1 font-semibold text-sts-deep">รายละเอียดบล็อค</p>
      <p class="muted">เลือกบล็อคตำแหน่งบนแผนผังเพื่อแก้ไข และเพิ่มชื่อผู้รับผิดชอบ</p>
    `;
    return;
  }
  const people = block.responsiblePersons || [];
  const peopleHtml = people.map((person, index) => `
    <div class="block-person mt-3">
      <span class="block-avatar">${esc(initials(personName(person)))}</span>
      <div class="min-w-0 flex-1">
        <div class="block-person-name">${esc(personName(person))}</div>
        <input class="input mt-2" data-resp="${index}" value="${esc(person.responsibility || "")}" placeholder="หน้าที่ / ความรับผิดชอบ" ${canWrite ? "" : "disabled"}>
        ${canWrite ? `<button type="button" class="btn ghost mt-2" data-remove="${index}">ลบออกจากบล็อค</button>` : ""}
      </div>
    </div>
  `).join("");
  const personOptions = state.persons.map((person) => `<option value="${esc(person.id)}">${esc(person.displayName)}</option>`).join("");
  const positionOptions = POSITION_TEMPLATES.map((item) => `<option value="${esc(item.title)}" ${item.title === block.title ? "selected" : ""}>${esc(item.title)}</option>`).join("");

  props.innerHTML = `
    <p class="text-xs font-semibold tracking-wide text-sts">แก้ไขบล็อคตำแหน่ง</p>
    <label>ตำแหน่ง</label>
    <select class="input" id="p-title" ${canWrite ? "" : "disabled"}>
      ${positionOptions}
      ${POSITION_TEMPLATES.some((item) => item.title === block.title) ? "" : `<option value="${esc(block.title)}" selected>${esc(block.title)}</option>`}
    </select>
    <label>รายละเอียด</label>
    <textarea class="input" id="p-desc" ${canWrite ? "" : "disabled"}>${esc(block.description || "")}</textarea>
    <div class="mt-5 font-semibold text-sts-deep">ผู้รับผิดชอบในบล็อค</div>
    ${peopleHtml || '<p class="muted mt-2">ยังไม่มีชื่อในบล็อคนี้</p>'}
    ${canWrite ? `
      <label class="mt-5">เพิ่มจากรายชื่อบุคลากร</label>
      <div class="flex gap-2">
        <select class="input" id="p-add-person"><option value="">เลือกบุคลากร</option>${personOptions}</select>
        <button type="button" class="btn secondary shrink-0" id="p-add-existing">เพิ่ม</button>
      </div>
      <label>หรือพิมพ์ชื่อเพิ่มเอง</label>
      <div class="flex gap-2">
        <input class="input" id="p-add-name" placeholder="เช่น นางสาว...">
        <button type="button" class="btn secondary shrink-0" id="p-add-custom">เพิ่ม</button>
      </div>
      <button type="button" class="btn ghost mt-5" id="p-del">ลบบล็อคนี้</button>
    ` : ""}
  `;

  document.getElementById("p-title")?.addEventListener("change", (event) => {
    block.title = event.target.value;
    block.blockType = "position";
    markDirty();
    render();
  });
  document.getElementById("p-desc")?.addEventListener("change", (event) => {
    block.description = event.target.value;
    markDirty();
  });
  props.querySelectorAll("[data-resp]").forEach((input) => {
    input.addEventListener("change", () => {
      const index = Number(input.dataset.resp);
      if (block.responsiblePersons[index]) {
        block.responsiblePersons[index].responsibility = input.value;
        markDirty();
      }
    });
  });
  props.querySelectorAll("[data-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.remove);
      block.responsiblePersons.splice(index, 1);
      markDirty();
      render();
    });
  });
  document.getElementById("p-add-existing")?.addEventListener("click", () => {
    const select = document.getElementById("p-add-person");
    const person = state.persons.find((item) => item.id === select.value);
    if (!person) return;
    if (addPersonToBlock(block, person)) {
      markDirty();
      render();
    }
  });
  document.getElementById("p-add-custom")?.addEventListener("click", () => {
    const input = document.getElementById("p-add-name");
    const name = input?.value.trim();
    if (!name) return;
    const existing = state.persons.find((item) => item.displayName === name);
    if (addPersonToBlock(block, existing || { displayName: name })) {
      markDirty();
      render();
    }
  });
  document.getElementById("p-del")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    removeBlock(block.id);
  });
}

function render() {
  if (!canvas) return;
  canvas.querySelectorAll(".wf-node").forEach((el) => el.remove());
  state.blocks.forEach((block) => canvas.appendChild(blockEl(block)));
  if (printMode) sizePrintCanvas();
  drawEdges();
  renderProps();
}

document.getElementById("btn-save")?.addEventListener("click", saveOfficial);
document.getElementById("btn-share")?.addEventListener("click", async () => {
  const res = await fetch(`/admin/workflows/${window.WORKFLOW.id}/share`, {
    method: "POST",
    headers: { "X-CSRF-TOKEN": csrf, Accept: "application/json" },
  });
  const data = await res.json();
  const input = document.getElementById("share-url");
  const dialog = document.getElementById("share-dialog");
  if (input) input.value = data.url;
  dialog?.showModal();
});
document.getElementById("copy-share")?.addEventListener("click", async () => {
  const url = document.getElementById("share-url")?.value;
  if (!url) return;
  await navigator.clipboard.writeText(url);
  window.stsToast?.("คัดลอกลิงก์แล้ว");
});

document.querySelectorAll("[data-position]").forEach((el) => {
  el.addEventListener("pointerdown", (event) => {
    if (!canWrite || event.button !== 0) return;
    try {
      startPaletteDrag(event, { type: "position", data: JSON.parse(el.dataset.position) }, el.textContent.trim());
    } catch (error) {
      console.error(error);
    }
  });
});
document.querySelectorAll("[data-person]").forEach((el) => {
  el.addEventListener("pointerdown", (event) => {
    if (!canWrite || event.button !== 0) return;
    try {
      startPaletteDrag(event, { type: "person", data: JSON.parse(el.dataset.person) }, el.textContent.trim());
    } catch (error) {
      console.error(error);
    }
  });
});

window.addEventListener("keydown", (event) => {
  if (printMode) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    saveOfficial();
  }
  if ((event.key === "Delete" || event.key === "Backspace") && canWrite) {
    const tag = (event.target?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (state.selectedEdge) {
      event.preventDefault();
      removeEdge(state.selectedEdge);
      return;
    }
    if (state.selected) {
      event.preventDefault();
      removeBlock(state.selected);
    }
  }
});

render();

function startLiveWatch() {
  const url = window.WORKFLOW.liveUrl;
  if (!url || canWrite || printMode) return;

  let revision = window.WORKFLOW.revision || "";
  let ticking = false;

  const applyLive = (data) => {
    if (!data?.revision || data.revision === revision) return;
    revision = data.revision;
    state.blocks = structuredClone(data.blocks || []);
    state.edges = structuredClone(data.edges || []);
    render();
    const live = document.getElementById("live-state");
    if (live) live.textContent = data.updated_label ? `อัปเดตสด · ${data.updated_label}` : "เพิ่งอัปเดต";
    const title = document.getElementById("share-title");
    if (title && data.department) title.textContent = data.department;
    const sub = document.getElementById("share-sub");
    if (sub && (data.organization || data.name)) {
      sub.textContent = [data.organization, data.name].filter(Boolean).join(" · ");
    }
  };

  const tick = async () => {
    if (document.hidden || ticking) return;
    ticking = true;
    try {
      const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
      if (res.ok) applyLive(await res.json());
    } catch (_) {
      const live = document.getElementById("live-state");
      if (live) live.textContent = "รอการเชื่อมต่ออีกครั้ง";
    } finally {
      ticking = false;
    }
  };

  setInterval(tick, 2000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) tick();
  });
}

startLiveWatch();

function printTextWidth(text, font) {
  const ctx = printTextWidth.ctx || (printTextWidth.ctx = document.createElement("canvas").getContext("2d"));
  ctx.font = font;
  return ctx.measureText(String(text || "")).width;
}

function wrapPrintText(text, font, maxWidth) {
  const source = String(text || "").trim();
  if (!source) return [];
  const lines = [];
  let current = "";
  for (const ch of source) {
    const trial = current + ch;
    if (current && printTextWidth(trial, font) > maxWidth) {
      lines.push(current);
      current = ch;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function printAccent(node) {
  if (node.classList.contains("tone-mayor")) return "#3f0d12";
  if (node.classList.contains("tone-clerk")) return "#e11d2e";
  if (node.classList.contains("tone-director") || node.classList.contains("tone-head")) return "#be123c";
  if (node.classList.contains("tone-staff")) return "#a8a29e";
  return "#f43f5e";
}

function appendPrintText(parent, lines, x, y, font, fill, size, weight, lineHeight) {
  lines.forEach((line, index) => {
    const el = svgEl("text", {
      x: String(x),
      y: String(y + index * lineHeight),
      fill,
      "font-size": String(size),
      "font-weight": String(weight),
      "font-family": "'Noto Sans Thai', sans-serif",
    });
    el.textContent = line;
    parent.appendChild(el);
  });
  return lines.length * lineHeight;
}

function appendPrintCard(svg, node) {
  const x = node.offsetLeft;
  const y = node.offsetTop;
  const w = node.offsetWidth;
  const h = node.offsetHeight;
  const block = state.blocks.find((item) => item.id === node.dataset.id);
  const g = svgEl("g", { class: "print-card", transform: `translate(${x} ${y})` });
  g.appendChild(svgEl("rect", {
    x: "0",
    y: "0",
    width: String(w),
    height: String(h),
    rx: "18",
    ry: "18",
    fill: "#ffffff",
    stroke: "#edd6da",
    "stroke-width": "1",
  }));
  g.appendChild(svgEl("path", {
    d: `M 18 0 H 6 Q 0 0 0 6 V ${h - 6} Q 0 ${h} 6 ${h} H 18 Z`,
    fill: printAccent(node),
  }));

  const innerX = 16;
  const innerW = w - 28;
  let cursorY = 20;
  const kickerFont = "700 11px 'Noto Sans Thai', sans-serif";
  const kicker = "ตำแหน่ง";
  const kickerW = printTextWidth(kicker, kickerFont) + 16;
  g.appendChild(svgEl("rect", {
    x: String(innerX),
    y: String(cursorY - 13),
    width: String(kickerW),
    height: "18",
    rx: "9",
    ry: "9",
    fill: "#fff1f2",
  }));
  appendPrintText(g, [kicker], innerX + 8, cursorY, kickerFont, "#be123c", 11, 700, 16);
  cursorY += 22;

  const titleLines = wrapPrintText(block?.title || "", "800 18px 'Noto Sans Thai', sans-serif", innerW);
  cursorY += appendPrintText(g, titleLines, innerX, cursorY, "800 18px 'Noto Sans Thai', sans-serif", "#3f0d12", 18, 800, 26);
  if (block?.description) {
    cursorY += 4;
    const descLines = wrapPrintText(block.description, "400 12px 'Noto Sans Thai', sans-serif", innerW);
    cursorY += appendPrintText(g, descLines.slice(0, 3), innerX, cursorY, "400 12px 'Noto Sans Thai', sans-serif", "#78716c", 12, 400, 18);
  }

  const people = block?.responsiblePersons || [];
  cursorY += 10;
  people.forEach((person) => {
    if (cursorY > h - 36) return;
    const name = personName(person);
    g.appendChild(svgEl("rect", {
      x: String(innerX - 2),
      y: String(cursorY - 8),
      width: String(innerW + 4),
      height: "36",
      rx: "10",
      ry: "10",
      fill: "#ffffff",
      stroke: "#f1d5d9",
      "stroke-width": "1",
    }));
    g.appendChild(svgEl("circle", {
      cx: String(innerX + 16),
      cy: String(cursorY + 10),
      r: "14",
      fill: "#e11d2e",
    }));
    const ini = initials(name);
    appendPrintText(g, [ini], innerX + 16, cursorY + 14, "700 9px 'Noto Sans Thai', sans-serif", "#ffffff", 9, 700, 12);
    const nameEl = g.lastChild;
    if (nameEl) nameEl.setAttribute("text-anchor", "middle");
    appendPrintText(g, wrapPrintText(name, "700 12px 'Noto Sans Thai', sans-serif", innerW - 44).slice(0, 1), innerX + 36, cursorY + 6, "700 12px 'Noto Sans Thai', sans-serif", "#3f0d12", 12, 700, 16);
    appendPrintText(g, wrapPrintText(person.responsibility || "ผู้รับผิดชอบ", "400 11px 'Noto Sans Thai', sans-serif", innerW - 44).slice(0, 1), innerX + 36, cursorY + 20, "400 11px 'Noto Sans Thai', sans-serif", "#78716c", 11, 400, 14);
    cursorY += 42;
  });

  g.appendChild(svgEl("circle", { cx: String(w / 2), cy: "0", r: "7", fill: "#e11d2e", stroke: "#ffffff", "stroke-width": "2" }));
  g.appendChild(svgEl("circle", { cx: String(w / 2), cy: String(h), r: "7", fill: "#e11d2e", stroke: "#ffffff", "stroke-width": "2" }));
  svg.appendChild(g);
}

function clonePrintEdges(svg) {
  canvas.querySelectorAll(".wf-edge").forEach((group) => {
    const copy = group.cloneNode(true);
    copy.querySelectorAll(".wf-edge-hit, .wf-edge-del").forEach((el) => el.remove());
    copy.querySelectorAll(".wf-edge-line").forEach((el) => {
      el.setAttribute("stroke", "#be123c");
      el.setAttribute("stroke-width", "2.75");
      el.setAttribute("fill", "none");
      el.setAttribute("stroke-linecap", "round");
      el.setAttribute("stroke-linejoin", "round");
    });
    copy.querySelectorAll(".wf-edge-glow").forEach((el) => {
      el.setAttribute("stroke", "#fda4af");
      el.setAttribute("stroke-width", "8");
      el.setAttribute("fill", "none");
      el.setAttribute("stroke-linecap", "round");
      el.setAttribute("opacity", "0.32");
    });
    copy.querySelectorAll(".wf-edge-arrow").forEach((el) => {
      el.setAttribute("fill", "#be123c");
    });
    svg.appendChild(copy);
  });
}

function buildPrintDiagram() {
  const stage = document.getElementById("print-stage");
  if (!printMode || !canvas || !stage) return;
  sizePrintCanvas();
  drawEdges();
  const width = Math.max(1, canvas.offsetWidth);
  const height = Math.max(1, canvas.offsetHeight);
  const svg = svgEl("svg", {
    class: "print-diagram",
    viewBox: `0 0 ${width} ${height}`,
    preserveAspectRatio: "xMinYMin meet",
    overflow: "visible",
  });
  const availW = 1040;
  const availH = 540;
  const scale = Math.min(1, availW / width, availH / height);
  svg.setAttribute("width", String(Math.round(width * scale)));
  svg.setAttribute("height", String(Math.round(height * scale)));
  clonePrintEdges(svg);
  canvas.querySelectorAll(".wf-node").forEach((node) => appendPrintCard(svg, node));
  stage.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "print-diagram-wrap";
  wrap.appendChild(svg);
  stage.appendChild(wrap);
}

if (printMode) {
  const startPrint = () => {
    buildPrintDiagram();
    const skip = new URLSearchParams(location.search).get("autoprint") === "0";
    if (!skip) window.setTimeout(() => window.print(), 200);
  };
  const ready = document.fonts?.ready || Promise.resolve();
  ready.then(() => requestAnimationFrame(() => requestAnimationFrame(startPrint)));
  document.getElementById("btn-print-pdf")?.addEventListener("click", () => {
    if (!document.querySelector(".print-diagram")) buildPrintDiagram();
    window.print();
  });
}
