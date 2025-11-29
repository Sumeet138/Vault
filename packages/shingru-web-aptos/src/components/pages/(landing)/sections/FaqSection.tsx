"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/solid";
import BlueCloud from "@/components/icons/BlueCloud";

const faqs = [
  {
    question: "How does VAULT work?",
    answer:
      "When you create a VAULT link, we use stealth address implementation to generate a unique address for every payment. It's like having endless private mailboxes that all deliver to you, and no one knows they're linked.",
  },
  {
    question: "How much does VAULT cost?",
    answer:
      "VAULT is free to use. We may introduce premium features in the future, but the core functionality will always be free.",
  },
  {
    question: "Do VAULT have a token?",
    answer:
      "No, VAULT doesn't have a token. We're focused on building the product.",
  },
  {
    question: "How private is VAULT really?",
    answer:
      "VAULT is designed to be as private as possible. We use stealth addresses to ensure that your transactions cannot be linked to your real-world identity.",
  },
];

const AccordionItem = ({
  faq,
  isOpen,
  onClick,
}: {
  faq: { question: string; answer: string };
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <div
      className={`relative transition-colors duration-300 ease-out overflow-hidden ${isOpen ? "bg-gray-100 rounded-3xl" : "bg-transparent"
        }`}
    >
      {/* <motion.div
        className="absolute -top-8 -left-8 z-0"
        initial={{ opacity: 0, scale: 0.5, y: 20, x: -20, rotate: 15 }}
        animate={{
          opacity: isOpen ? 1 : 0,
          scale: isOpen ? 1 : 0.5,
          y: isOpen ? 0 : 20,
          x: isOpen ? 0 : -20,
          rotate: isOpen ? 0 : 15,
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <BlueCloud className="w-28 h-28" />
      </motion.div> */}
      <button
        onClick={onClick}
        className="w-full p-5 md:p-6 text-left flex justify-between items-center cursor-pointer relative z-10"
      >
        <h3
          className={`flex-1 text-xl font-semibold transition-colors duration-300 pr-4 ${isOpen ? "text-primary-700" : "text-gray-900"
            }`}
        >
          {faq.question}
        </h3>
        <div className="transition-transform duration-300">
          {isOpen ? (
            <MinusIcon className="h-6 w-6 text-primary-600" />
          ) : (
            <PlusIcon className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{
              duration: 0.4,
              ease: [0.04, 0.62, 0.23, 0.98],
            }}
          >
            <div className="p-5 md:p-6 pt-0 text-base text-gray-700 relative z-10 font-medium">
              <p>{faq.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleItemClick = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className=" min-h-screen px-5 md:px-12 w-full flex flex-col items-center">
      <div className="max-w-6xl py-24 sm:py-32 lg:grid lg:grid-cols-12 lg:gap-8 w-full">
        <div className="lg:col-span-5">
          <h2 className="text-4xl font-bold leading-10 tracking-tight text-gray-900">
            Frequently Asked
            <br />
            Questions
          </h2>
        </div>
        <div className="mt-10 lg:col-span-7 lg:mt-0">
          <div className="space-y-4 w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                faq={faq}
                isOpen={openIndex === index}
                onClick={() => handleItemClick(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
