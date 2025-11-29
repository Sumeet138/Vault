import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

function AddLinkButton() {
  const router = useRouter();

  const handleCreateLink = () => {
    router.push("/app/create-link");
  };

  return (
    <motion.div
      className="mobile-size-child bottom-[12.4rem] z-50"
      initial={{
        opacity: 0,
        scale: 0.8,
        y: 20,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        mass: 0.8,
        delay: 0.2,
      }}
    >
      <div className="absolute right-4">
        <motion.button
          onClick={handleCreateLink}
          className="border-4 border-white p-2 w-fit h-fit shadow-xl shadow-black/10 rounded-full bg-primary relative overflow-hidden cursor-pointer"
          whileHover={{
            scale: 1.05,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 15,
              mass: 1,
            },
          }}
          whileTap={{
            scale: 0.95,
            transition: {
              type: "spring",
              stiffness: 800,
              damping: 15,
              mass: 0.5,
              velocity: 1,
            },
          }}
          animate={{
            scale: 1,
          }}
          initial={{ scale: 1 }}
        >
          <motion.div
            whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
            whileTap={{ scale: 0.95, transition: { duration: 0.1 } }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <PlusIcon className="w-14 h-14 text-black" />
          </motion.div>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default AddLinkButton;
