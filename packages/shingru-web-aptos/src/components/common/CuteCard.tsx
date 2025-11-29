import { COLOR_PICKS } from "@/config/styling";
import { cnm } from "@/utils/style";
import React from "react";

function CuteCard({
  color,
  children,
  classNames,
}: {
  color: string;
  children: React.ReactNode;
  classNames?: {
    container?: string;
    content?: string;
  };
}) {
  const selectedColor =
    COLOR_PICKS.find((c) => c.id === color) || COLOR_PICKS[0];

  return (
    <div
      className={cnm(
        "w-full rounded-3xl md:rounded-4xl border border-black/5 p-1 flex flex-col bg-white shadow-supa-smooth",
        classNames?.container
      )}
    >
      <div
        className={cnm(
          " rounded-[20px] md:rounded-[1.8rem] bg-white flex-1",
          classNames?.content
        )}
        style={{
          border: `3px solid ${selectedColor.value}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default CuteCard;
