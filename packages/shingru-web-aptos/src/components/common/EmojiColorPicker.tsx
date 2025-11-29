import { COLOR_PICKS, EMOJI_PICKS } from "@/config/styling";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { useEffect, useRef, useState } from "react";
import CuteModal from "./CuteModal";
import CuteButton from "./CuteButton";
import { EASE_OUT_QUART } from "@/config/animation";
import MainButton from "./MainButton";

interface EmojiColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: { id: string; emoji: string }) => void;
  onColorSelect: (color: { id: string; value: string; light: string }) => void;
  selectedEmoji?: { id: string; emoji: string } | null;
  selectedColor?: { id: string; value: string; light: string } | null;
}

function EmojiColorPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  onColorSelect,
  selectedEmoji,
  selectedColor,
}: EmojiColorPickerProps) {
  const [isSurprising, setIsSurprising] = useState(false);
  const surpriseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-select first color and emoji when modal opens if nothing is selected
  useEffect(() => {
    if (isOpen && !selectedColor && !selectedEmoji) {
      onColorSelect(COLOR_PICKS[0]);
      onEmojiSelect(EMOJI_PICKS[0]);
    }
  }, [isOpen, selectedColor, selectedEmoji, onColorSelect, onEmojiSelect]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (surpriseTimeoutRef.current) {
        clearTimeout(surpriseTimeoutRef.current);
      }
    };
  }, []);

  const handleSurpriseMe = () => {
    setIsSurprising(true);

    // Generate random indices
    const randomColorIndex = Math.floor(Math.random() * COLOR_PICKS.length);
    const randomEmojiIndex = Math.floor(Math.random() * EMOJI_PICKS.length);

    // Select random color and emoji
    onColorSelect(COLOR_PICKS[randomColorIndex]);
    onEmojiSelect(EMOJI_PICKS[randomEmojiIndex]);

    // Wait for animations to complete before re-enabling the button
    if (surpriseTimeoutRef.current) {
      clearTimeout(surpriseTimeoutRef.current);
    }
    surpriseTimeoutRef.current = setTimeout(() => {
      setIsSurprising(false);
    }, 400);
  };

  return (
    <>
      <CuteModal
        onClose={onClose}
        isOpen={isOpen}
        size="md"
        withHandle
        title="Emoji & Color Picker"
        footer={
          <MainButton onClick={onClose} className="py-4 rounded-2xl w-full">
            Save
          </MainButton>
        }
      >
        <div className="flex flex-col h-full overflow-y-auto">
          <motion.div
            className="flex flex-col"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              duration: 0.3,
              bounce: 0.2,
            }}
          >
            <motion.div
              className="relative flex items-center justify-center rounded-full w-[10rem] md:w-[12rem] mx-auto aspect-square md:my-[1.5rem] my-[1rem] text-[6rem]"
              style={{
                backgroundColor: selectedColor?.value || "#F3F4F6",
              }}
              layout
              animate={{
                scale: 1,
              }}
              key={selectedColor?.id || "no-color"}
              initial={{ scale: 1.05 }}
              transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0.2,
              }}
            >
              {/* Emoji container - gentle shake on surprise */}
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={selectedEmoji?.id || "placeholder"}
                  initial={{ scale: 0.3, rotateZ: -10 }}
                  animate={{
                    scale: 1,
                    rotateZ: 0,
                  }}
                  exit={{ scale: 0.3, rotateZ: 10 }}
                  transition={{
                    type: "spring",
                    duration: 0.3,
                    bounce: 0.2,
                  }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      duration: 0.3,
                      bounce: 0.2,
                    }}
                  >
                    {selectedEmoji?.emoji || "..."}
                  </motion.span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.div
              className="bg-white pt-8 pb-4 rounded-2xl flex flex-col items-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                type: "spring",
                duration: 0.3,
                bounce: 0.2,
                delay: 0.1,
              }}
            >
              {/* Surprise Me Button */}
              <motion.div className="mb-6">
                <MainButton
                  onClick={handleSurpriseMe}
                  className="relative overflow-hidden rounded-full px-4 text-sm h-auto py-2"
                  disabled={isSurprising}
                  color="gray"
                  variant="light"
                >
                  <span className="flex items-center gap-2">
                    <motion.span
                      animate={
                        isSurprising
                          ? {
                              rotate: 720,
                            }
                          : { rotate: 0 }
                      }
                      transition={{
                        duration: 0.4,
                        ease: "easeOut",
                      }}
                    >
                      🎲
                    </motion.span>
                    Surprise me!
                  </span>
                </MainButton>
              </motion.div>

              {/* COLORS */}
              <LayoutGroup>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {COLOR_PICKS.map((color) => {
                    const isSelected = selectedColor?.id === color.id;
                    return (
                      <motion.button
                        key={color.id}
                        onClick={() => onColorSelect(color)}
                        className="w-8 h-8 rounded-full relative flex items-center justify-center"
                        style={{ backgroundColor: color.value }}
                        whileHover={{
                          scale: 1.1,
                          rotateZ: 5,
                        }}
                        whileTap={{
                          scale: 0.8,
                          rotateZ: -5,
                        }}
                        animate={
                          isSurprising && isSelected
                            ? {
                                scale: 1.08,
                              }
                            : {
                                scale: 1,
                              }
                        }
                        transition={{
                          type: "spring",
                          duration: 0.3,
                          bounce: 0.2,
                        }}
                      >
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              className="w-6 h-6 border-white border-4 rounded-full"
                              layoutId="colorSelection"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.8, opacity: 0 }}
                              transition={{
                                type: "spring",
                                duration: 0.3,
                                bounce: 0.2,
                              }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </div>
              </LayoutGroup>

              {/* EMOJIS */}
              <LayoutGroup>
                <div className="grid md:grid-cols-8 grid-cols-6 w-full gap-2 mt-8">
                  {EMOJI_PICKS.map((emoji) => {
                    const isSelected = selectedEmoji?.id === emoji.id;
                    return (
                      <motion.div key={emoji.id} className="relative">
                        <MainButton
                          onClick={() => onEmojiSelect(emoji)}
                          className={`flex items-center w-full aspect-square justify-center text-2xl relative transition-colors h-auto ${
                            isSelected
                              ? "bg-gray-200 hover:bg-gray-200"
                              : "border-2 border-transparent hover:bg-gray-100 bg-gray-50"
                          }`}
                        >
                          <motion.span
                            whileHover={{
                              scale: 1.2,
                              rotateZ: 10,
                            }}
                            whileTap={{
                              scale: 0.7,
                              rotateZ: -10,
                            }}
                            animate={
                              isSurprising && isSelected
                                ? {
                                    scale: 1.08,
                                  }
                                : {
                                    scale: 1,
                                  }
                            }
                            transition={{
                              type: "spring",
                              duration: 0.3,
                              bounce: 0.2,
                            }}
                          >
                            {emoji.emoji}
                          </motion.span>
                        </MainButton>
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              className="absolute inset-0 bg-blue-50 border-2 border-blue-400 rounded-lg"
                              layoutId="emojiSelection"
                              initial={{
                                scale: 0.5,
                                opacity: 0,
                                borderRadius: "50%",
                              }}
                              animate={{
                                scale: 1,
                                opacity: 1,
                                borderRadius: "8px",
                              }}
                              exit={{
                                scale: 0.5,
                                opacity: 0,
                                borderRadius: "50%",
                              }}
                              transition={{
                                type: "spring",
                                duration: 0.3,
                                bounce: 0.2,
                              }}
                              style={{ zIndex: -1 }}
                            />
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </LayoutGroup>
            </motion.div>
          </motion.div>
        </div>
      </CuteModal>
    </>
  );
}

export default EmojiColorPicker;
