import { PlusIcon } from "lucide-react";
import { cnm } from "@/utils/style";
import CuteButton from "@/components/common/CuteButton";
import { motion, Variants } from "motion/react";
import { FiEdit2 } from "react-icons/fi";
import MainButton from "@/components/common/MainButton";
import { getTransitionConfig } from "@/config/animation";

interface AddProfileImageButtonProps {
  onPress: () => void;
  type?: "emoji-and-color" | "image";
  emoji?: string;
  backgroundColor?: string;
  imageUrl?: string;
  className?: string;
}

const containerVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.05,
  },
};

const pencilIconVariants: Variants = {
  rest: {
    opacity: 1,
    scale: 1,
  },
  hover: {
    opacity: 1,
    scale: 1,
  },
};

export function AddProfileImageButton({
  onPress,
  type = "emoji-and-color",
  emoji,
  backgroundColor,
  imageUrl,
  className,
}: AddProfileImageButtonProps) {
  const showPlaceholder =
    type === "emoji-and-color" ? !emoji && !backgroundColor : !imageUrl;

  return (
    <motion.div
      onClick={onPress}
      initial="rest"
      whileHover="hover"
      whileTap={{
        scale: 0.95,
      }}
      className="relative cursor-pointer"
    >
      <div
        className={cnm(
          "text-[8rem] size-[14rem] flex items-center justify-center pt-0 rounded-full mx-auto overflow-hidden",
          showPlaceholder && "bg-primary-100",
          className
        )}
        style={
          !showPlaceholder && type === "emoji-and-color"
            ? { backgroundColor }
            : type === "image"
            ? { backgroundImage: `url(${imageUrl})` }
            : undefined
        }
      >
        {showPlaceholder ? (
          <PlusIcon className="size-32 text-primary-600 opacity-60" />
        ) : type === "emoji-and-color" ? (
          <span>{emoji}</span>
        ) : (
          <div className="w-full h-full bg-cover bg-center" />
        )}
      </div>
      <motion.div
        className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full bg-white shadow-supa-smooth shadow-black/10"
        variants={{
          rest: { scale: 1 },
          hover: { scale: 1.15 },
        }}
        transition={getTransitionConfig("SPRING_BOUNCE_ONE")}
      >
        <motion.div
          variants={{
            rest: { color: "rgb(107, 114, 128)" },
            hover: { color: "rgb(0, 0, 0)" },
          }}
          transition={{ duration: 0.2 }}
        >
          <FiEdit2 className="h-4 w-4" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
