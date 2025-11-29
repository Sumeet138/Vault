import { Package, FileText } from "lucide-react";
import { formatFileSize } from "@/utils/file";

interface DeliverableFile {
  id?: string;
  filename: string;
  size: number;
}

interface DeliverablesListProps {
  deliverables: DeliverableFile[];
}

export default function DeliverablesList({
  deliverables,
}: DeliverablesListProps) {
  if (!deliverables || deliverables.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-[1.6rem] p-4 mt-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
        <Package className="w-4 h-4 text-gray-600" />
        You&apos;ll receive these deliverables:
      </div>
      <div className="space-y-2">
        {deliverables.map((file: DeliverableFile, index: number) => (
          <div
            key={file.id || index}
            className="flex items-center gap-3 text-sm p-2 rounded-lg bg-gray-50"
          >
            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="font-medium text-gray-900 flex-1 truncate">
              {file.filename}
            </span>
            <span className="text-gray-500 text-xs">
              {formatFileSize(file.size)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
