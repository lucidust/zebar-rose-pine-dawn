export function WorkspaceStripChip(props: { children: any }) {
  return (
    <div class="chip chip-left-workspaces">
      <div class="chip-body chip-left-workspaces-body">
        <div class="workspace-strip">{props.children}</div>
      </div>
    </div>
  );
}
