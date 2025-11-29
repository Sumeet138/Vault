import { PAYMENT_TEMPLATES } from "@/config/templates";
import { COLOR_PICKS } from "@/config/styling";

function TemplatePill({
  template,
  color,
}: {
  template: string;
  color?: string;
}) {
  const selectedTemplate = PAYMENT_TEMPLATES.find((t) => t.id === template);
  const selectedColor = color
    ? COLOR_PICKS.find((c) => c.id === color) || COLOR_PICKS[0]
    : null;

  return (
    <div
      className="text-[9px] md:text-[10px] px-2 py-1 gap-1 md:gap-1.5 rounded-full font-semibold text-black/80 flex flex-row items-center flex-shrink-0 bg-gray-50 backdrop-blur-sm"
      // style={{
      //   border: selectedColor
      //     ? `2.5px solid ${selectedColor.value}`
      //     : "2.5px solid #E5E7EB",
      // }}
    >
      <img
        src={selectedTemplate?.icon}
        alt={selectedTemplate?.title}
        className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0"
      />
      <div className="truncate max-w-[80px] md:max-w-[140px]">
        {selectedTemplate?.title}
      </div>
    </div>
  );
}

export default TemplatePill;
