import { V2AppShell } from './V2AppShell';

type V2AppRoutesProps = {
  isExportBuilderOpen: boolean;
  onOpenExportBuilder: () => void;
  onCloseExportBuilder: () => void;
  isRightSidebarCollapsed: boolean;
  onToggleRightSidebar: () => void;
  onCollapseRightSidebar: () => void;
};

export function V2AppRoutes(props: V2AppRoutesProps) {
  // Route composition is intentionally simple today; extracting this boundary
  // keeps future route additions out of the shell/provider files.
  return <V2AppShell {...props} />;
}
