import { cn } from "@/lib/utils";

interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const AnimatedShinyText: React.FC<ShinyTextProps> = ({
  text,
  disabled = false,
  speed = 2.5,
  className = "",
}) => {
  const animationDuration = `${speed}s`;

  return (
    <div
      className={cn("shiny-text", disabled ? "disabled" : "", className)}
      style={{ animationDuration }}
    >
      {text}
    </div>
  );
};

export default AnimatedShinyText;
