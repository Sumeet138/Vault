import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { cnm } from "@/utils/style";
import { format } from "date-fns";
import { UserActivity } from "@/lib/api/user";
import TokenAvatar from "@/components/common/TokenAvatar";
import Link from "next/link";
import { COLOR_PICKS, EMOJI_PICKS } from "@/config/styling";
import CuteModal from "@/components/common/CuteModal";
import {
  getExplorerTxLink,
  getExplorerAccountLink,
  shortenId,
} from "@/utils/misc";
import { formatUiNumber } from "@/utils/formatting";
import Image from "next/image";
import {
  ChevronDownIcon,
  Mail,
  MessageCircle,
  StickyNote,
  User as UserIcon,
  type LucideIcon,
} from "lucide-react";

interface ActivityItemProps {
  activity: UserActivity;
  isNewActivity?: boolean;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isNewActivity = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [txHashExpanded, setTxHashExpanded] = useState(false);
  const { link } = activity;
  const userDetailPills = useMemo(() => {
    const collectedData = activity.paymentInfo?.collectedData || [];

    const detailMap: Array<{
      id: string;
      value: string;
      Icon: LucideIcon;
    }> = collectedData
      .filter((data: { type: string; value: string }) => data.value) // Only include if value is available
      .map((data: { type: string; value: string }) => {
        switch (data.type) {
          case "name":
            return {
              id: "name",
              value: data.value,
              Icon: UserIcon,
            };
          case "email":
            return {
              id: "email",
              value: data.value,
              Icon: Mail,
            };
          case "telegram":
            return {
              id: "telegram",
              value: data.value,
              Icon: MessageCircle,
            };
          case "note":
            return {
              id: "note",
              value:
                data.value.length > 20
                  ? `${data.value.substring(0, 20)}...`
                  : data.value,
              Icon: StickyNote,
            };
          default:
            return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (a?.id === "note") return -1;
        if (b?.id === "note") return 1;
        return 0;
      }) as Array<{
      id: string;
      value: string;
      Icon: LucideIcon;
    }>;

    return detailMap;
  }, [activity.paymentInfo?.collectedData]);

  const paymentDetails = useMemo(() => {
    const collectedData = activity.paymentInfo?.collectedData || [];

    const details = collectedData
      .filter((data: { type: string; value: string }) => data.value)
      .map((data: { type: string; value: string }) => {
        switch (data.type) {
          case "name":
            return {
              id: "name",
              label: "Name",
              value: data.value,
              Icon: UserIcon,
            };
          case "email":
            return {
              id: "email",
              label: "Email",
              value: data.value,
              Icon: Mail,
            };
          case "telegram":
            return {
              id: "telegram",
              label: "Telegram",
              value: data.value,
              Icon: MessageCircle,
            };
          case "note":
            return {
              id: "note",
              label: "Note",
              value: data.value,
              Icon: StickyNote,
            };
          default:
            return null;
        }
      })
      .filter(Boolean) as Array<{
      id: string;
      label: string;
      value: string;
      Icon: LucideIcon;
    }>;

    return details;
  }, [activity.paymentInfo?.collectedData]);

  return (
    <>
      <motion.div
        key={activity.id}
        layout
        initial={
          isNewActivity
            ? {
                opacity: 0,
                y: -20,
                scale: 0.95,
                rotateX: -15,
              }
            : false
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.6,
          delay: isNewActivity ? 0.1 : 0,
        }}
        style={{
          transformPerspective: 1000,
        }}
      >
        <button
          className="p-0 h-fit bg-white w-full hover:bg-gray-50 transition-colors rounded-2xl cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="rounded-[1.2rem] h-fit flex flex-col w-full bg-white">
            <div className="px-4 pt-4 pb-1">
              <div className="flex flex-row items-start gap-3 md:gap-4 w-full">
                <div className="relative">
                  {activity.type === "PAYMENT" && (
                    <div className="absolute p-1 bg-success-500 flex items-center justify-center aspect-square rounded-full border-2 border-white -top-[0.4rem] -left-[0.4rem] z-10">
                      <Image
                        src="/assets/icons/arrow-up.svg"
                        alt="IN"
                        width={12}
                        height={12}
                        className="w-3 h-3 rotate-180"
                      />
                    </div>
                  )}
                  {activity.type === "WITHDRAWAL" && (
                    <div className="absolute p-1 bg-danger-600 flex items-center justify-center aspect-square rounded-full border-2 border-white -top-[0.5rem] -left-[0.4rem] z-10">
                      <Image
                        src="/assets/icons/arrow-up.svg"
                        alt="OUT"
                        width={12}
                        height={12}
                        className="w-3 h-3"
                      />
                    </div>
                  )}
                  <TokenAvatar
                    imageUrl={activity.token.imageUrl}
                    symbol={activity.token.symbol}
                    variant="default"
                    className="w-10 h-10 relative z-0"
                  />
                </div>

                <div className="flex flex-col flex-1 -translate-y-1">
                  <div className="flex flex-row items-center gap-1">
                    <div className="text-gray-500 text-xs">
                      {activity.type === "PAYMENT" && "Received from"}
                      {activity.type === "WITHDRAWAL" && "Sent to"}
                    </div>
                    {activity.type === "WITHDRAWAL" &&
                    (activity as any).toUser ? (
                      <div className="text-gray-800 font-semibold text-xs">
                        @{(activity as any).toUser.username}
                      </div>
                    ) : activity.type === "WITHDRAWAL" &&
                      activity.destinationPubkey ? (
                      <div className="text-gray-800 font-semibold text-xs">
                        {shortenId(activity.destinationPubkey)}
                      </div>
                    ) : activity.type === "PAYMENT" &&
                      !link &&
                      (activity as any).fromUser ? (
                      <div className="text-gray-800 font-semibold text-xs">
                        @{(activity as any).fromUser.username}
                      </div>
                    ) : activity.type === "PAYMENT" &&
                      !link &&
                      (activity as any).from ? (
                      <div className="text-gray-800 font-semibold text-xs">
                        {shortenId((activity as any).from)}
                      </div>
                    ) : null}
                    {link && (
                      <Link
                        href={"/app/activities"}
                        className="flex flex-row items-center gap-1 text-[10px] py-[2px] rounded-full px-2 font-medium"
                        style={{
                          backgroundColor:
                            COLOR_PICKS.find(
                              (color) => color.id === link.backgroundColor
                            )?.light || "#00000005",
                          color:
                            COLOR_PICKS.find(
                              (color) => color.id === link.backgroundColor
                            )?.value || "#000000",
                        }}
                      >
                        <div>
                          {
                            EMOJI_PICKS.find((emoji) => emoji.id === link.emoji)
                              ?.emoji
                          }
                        </div>
                        <div>{link.label}</div>
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-row items-center gap-2 justify-between w-full">
                    <span className="font-semibold text-md">
                      {activity.token.name}
                    </span>
                  </div>
                </div>

                <div
                  className={cnm(
                    "font-bold text-right",
                    activity.type === "PAYMENT"
                      ? "text-success-600"
                      : "text-danger-600"
                  )}
                >
                  <span className="mr-[2px] text-base md:text-lg">
                    {activity.type === "PAYMENT" ? "+" : "-"}
                  </span>
                  <span className="text-sm md:text-base">
                    {formatUiNumber(activity.uiAmount, "", {
                      maxDecimals: 4,
                    })}{" "}
                    {activity.token.symbol}
                  </span>
                </div>
              </div>
            </div>

            {userDetailPills.length > 0 && (
              <div className="pb-4">
                <div
                  style={{
                    mask: "linear-gradient(90deg, transparent 0%, rgba(0,0,0,1) 5%, rgba(0,0,0,1) 95%, transparent 100%)",
                  }}
                  className="flex px-4 items-center gap-2 overflow-x-auto"
                >
                  {userDetailPills.map((pill) => (
                    <span
                      key={pill.id}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
                    >
                      <pill.Icon className="h-3.5 w-3.5" />
                      {pill.value}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </button>
      </motion.div>

      <CuteModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="lg"
        withHandle
      >
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex flex-row items-start gap-1 w-full">
            <div className="relative my-auto">
              <TokenAvatar
                imageUrl={activity.token.imageUrl}
                symbol={activity.token.symbol}
                variant="default"
                className="w-12 h-12"
              />
              {activity.type === "PAYMENT" && (
                <div className="absolute p-1 bg-success-500 flex items-center justify-center aspect-square rounded-full border-2 border-white -top-1.5 -left-1.5">
                  <Image
                    src="/assets/icons/arrow-up.svg"
                    alt="IN"
                    width={12}
                    height={12}
                    className="rotate-180"
                  />
                </div>
              )}
              {activity.type === "WITHDRAWAL" && (
                <div className="absolute p-1 bg-danger-600 flex items-center justify-center aspect-square rounded-full border-2 border-white -top-1.5 -left-1.5">
                  <Image
                    src="/assets/icons/arrow-up.svg"
                    alt="OUT"
                    width={12}
                    height={12}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <div className="flex flex-row items-center gap-1.5 text-sm">
                <div className="font-semibold text-gray-800">
                  {activity.type === "PAYMENT" && "Received from"}
                  {activity.type === "WITHDRAWAL" && "Sent to"}
                </div>
                {link ? (
                  <Link
                    href={"/app/activities"}
                    className="flex flex-row items-center gap-1 text-xs py-[0.14rem] rounded-full px-[0.4rem] pr-[0.5rem] font-medium"
                    style={{
                      backgroundColor:
                        COLOR_PICKS.find(
                          (color) => color.id === link.backgroundColor
                        )?.light || "#00000005",
                      color:
                        COLOR_PICKS.find(
                          (color) => color.id === link.backgroundColor
                        )?.value || "#000000",
                    }}
                  >
                    <div>
                      {
                        EMOJI_PICKS.find((emoji) => emoji.id === link.emoji)
                          ?.emoji
                      }
                    </div>
                    <div>{link.label}</div>
                  </Link>
                ) : activity.type === "PAYMENT" &&
                  (activity as any).fromUser ? (
                  <div className="font-semibold text-sm text-gray-800">
                    @{(activity as any).fromUser.username}
                  </div>
                ) : activity.type === "PAYMENT" && (activity as any).from ? (
                  <Link
                    href={getExplorerAccountLink(
                      (activity as any).from,
                      activity.chain as "IOTA_TESTNET" | "IOTA_MAINNET"
                    )}
                    target="_blank"
                    className="font-semibold text-sm text-gray-800 hover:underline"
                  >
                    {shortenId((activity as any).from)}
                  </Link>
                ) : activity.type === "WITHDRAWAL" &&
                  (activity as any).toUser ? (
                  <div className="font-semibold text-sm text-gray-800">
                    @{(activity as any).toUser.username}
                  </div>
                ) : (
                  activity.destinationPubkey && (
                    <Link
                      href={getExplorerAccountLink(
                        activity.destinationPubkey,
                        activity.chain as "IOTA_TESTNET" | "IOTA_MAINNET"
                      )}
                      target="_blank"
                      className="font-semibold text-sm text-gray-800 hover:underline"
                    >
                      {shortenId(activity.destinationPubkey)}
                    </Link>
                  )
                )}
              </div>

              <div className="text-gray-400 text-xs mt-0.5">
                {format(
                  new Date(activity.timestamp * 1000),
                  "MMM d yyyy • h:mm a"
                )
                  .replace("AM", "am")
                  .replace("PM", "pm")}
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div className="flex flex-col items-center gap-2 py-6 md:py-8 bg-gray-50 rounded-3xl">
            {/* Main Amount */}
            <div className="flex flex-col items-center">
              <div
                className={cnm(
                  "text-4xl md:text-5xl leading-none font-bold tracking-tight",
                  activity.type === "PAYMENT" && "text-success-600",
                  activity.type === "WITHDRAWAL" && "text-danger-600"
                )}
              >
                {activity.type === "PAYMENT" && "$"}
                {activity.type === "WITHDRAWAL" && "-$"}
                {formatUiNumber(activity.usdValue, "", {
                  maxDecimals: 2,
                })}
              </div>

              {/* Token Amount */}
              <div className="flex items-center gap-1.5 mt-2.5">
                {activity.token.imageUrl && (
                  <TokenAvatar
                    imageUrl={activity.token.imageUrl}
                    symbol={activity.token.symbol}
                    variant="default"
                    size="sm"
                  />
                )}
                <span className="font-semibold text-gray-700">
                  {formatUiNumber(activity.uiAmount, "", {
                    maxDecimals: 4,
                  })}{" "}
                  {activity.token.symbol}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl">
            {/* Transaction Hash(es) */}
            <div className="flex flex-row items-center justify-between px-5 py-4 bg-gray-50 rounded-xl">
              {(activity as any).txHashes &&
              (activity as any).txHashes.length > 1 ? (
                <>
                  <div className="text-gray-400 text-sm">Tx Hashes</div>
                  <div className="flex flex-col items-end gap-2 max-w-[60%]">
                    {(activity as any).txHashes
                      .slice(
                        0,
                        txHashExpanded ? (activity as any).txHashes.length : 3
                      )
                      .map((txHash: string, index: number) => (
                        <Link
                          key={index}
                          href={getExplorerTxLink(
                            txHash,
                            activity.chain
                          )}
                          target="_blank"
                          className="hover:underline text-gray-600 font-semibold text-sm text-right"
                        >
                          {shortenId(txHash, 3, 3)}
                        </Link>
                      ))}
                    {(activity as any).txHashes.length > 3 && (
                      <motion.button
                        onClick={() => setTxHashExpanded(!txHashExpanded)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>
                          {txHashExpanded
                            ? "Show less"
                            : `Show ${
                                (activity as any).txHashes.length - 3
                              } more`}
                        </span>
                        <motion.div
                          animate={{ rotate: txHashExpanded ? 180 : 0 }}
                          transition={{
                            duration: 0.2,
                            ease: "easeInOut",
                          }}
                        >
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </motion.div>
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (activity as any).items &&
                (activity as any).items.length > 1 ? (
                <>
                  <div className="text-gray-400 text-sm">Tx Hash</div>
                  <div className="flex flex-col items-end gap-2 max-w-[60%]">
                    {(activity as any).items
                      .slice(
                        0,
                        txHashExpanded ? (activity as any).items.length : 3
                      )
                      .map((item: any, index: number) => (
                        <Link
                          key={index}
                          href={getExplorerTxLink(
                            item.txHash,
                            activity.chain
                          )}
                          target="_blank"
                          className="hover:underline text-gray-600 font-semibold text-sm text-right"
                        >
                          {shortenId(item.txHash)}
                        </Link>
                      ))}
                    {(activity as any).items.length > 3 && (
                      <motion.button
                        onClick={() => setTxHashExpanded(!txHashExpanded)}
                        className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 group"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span>
                          {txHashExpanded
                            ? "Show less"
                            : `Show ${(activity as any).items.length - 3} more`}
                        </span>
                        <motion.div
                          animate={{ rotate: txHashExpanded ? 180 : 0 }}
                          transition={{
                            duration: 0.2,
                            ease: "easeInOut",
                          }}
                        >
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </motion.div>
                      </motion.button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-gray-400 text-sm">Tx Hash</div>
                  {(activity as any).txHash ||
                  ((activity as any).txHashes &&
                    (activity as any).txHashes[0]) ||
                  ((activity as any).items &&
                    (activity as any).items[0]?.txHash) ? (
                    <Link
                      href={getExplorerTxLink(
                        (activity as any).txHash ||
                          ((activity as any).txHashes &&
                            (activity as any).txHashes[0]) ||
                          ((activity as any).items &&
                            (activity as any).items[0]?.txHash),
                        activity.chain
                      )}
                      target="_blank"
                      className="hover:underline text-gray-600 font-semibold text-sm"
                    >
                      {shortenId(
                        (activity as any).txHash ||
                          ((activity as any).txHashes &&
                            (activity as any).txHashes[0]) ||
                          ((activity as any).items &&
                            (activity as any).items[0]?.txHash),
                        3,
                        3
                      )}
                    </Link>
                  ) : (
                    <span className="text-gray-500 font-semibold text-sm">
                      N/A
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Link */}
            {link && (
              <div className="flex flex-row items-center justify-between px-5 py-4">
                <div className="text-gray-400 text-sm">Link</div>
                <div className="flex items-center gap-1.5">
                  <div>
                    {
                      EMOJI_PICKS.find((emoji) => emoji.id === link.emoji)
                        ?.emoji
                    }
                  </div>
                  <div className="text-gray-600 font-semibold text-sm">
                    {link.label}
                  </div>
                </div>
              </div>
            )}

            {/* From/To Information */}
            {activity.type === "PAYMENT" && (activity as any).fromUser ? (
              <div
                className={`flex flex-row items-center justify-between px-5 py-4 ${
                  link ? "bg-gray-50 rounded-xl" : "rounded-xl"
                }`}
              >
                <div className="text-gray-400 text-sm">From</div>
                <div className="text-gray-600 font-semibold text-sm">
                  @{(activity as any).fromUser.username}
                </div>
              </div>
            ) : activity.type === "PAYMENT" && (activity as any).from ? (
              <div
                className={`flex flex-row items-center justify-between px-5 py-4 ${
                  link ? "bg-gray-50 rounded-xl" : "rounded-xl"
                }`}
              >
                <div className="text-gray-400 text-sm">From</div>
                <Link
                  href={getExplorerAccountLink(
                    (activity as any).from,
                    activity.chain as "IOTA_TESTNET" | "IOTA_MAINNET"
                  )}
                  target="_blank"
                  className="text-gray-600 font-semibold text-sm hover:underline"
                >
                  {shortenId((activity as any).from)}
                </Link>
              </div>
            ) : activity.type === "WITHDRAWAL" && (activity as any).toUser ? (
              <div
                className={`flex flex-row items-center justify-between px-5 py-4 ${
                  link ? "bg-gray-50 rounded-xl" : "rounded-xl"
                }`}
              >
                <div className="text-gray-400 text-sm">To</div>
                <div className="text-gray-600 font-semibold text-sm">
                  @{(activity as any).toUser.username}
                </div>
              </div>
            ) : activity.destinationPubkey ? (
              <div
                className={`flex flex-row items-center justify-between px-5 py-4 ${
                  link ? "bg-gray-50 rounded-xl" : "rounded-xl"
                }`}
              >
                <div className="text-gray-400 text-sm">
                  {activity.type === "WITHDRAWAL" ? "To" : "From"}
                </div>
                <Link
                  href={getExplorerAccountLink(
                    activity.destinationPubkey,
                    activity.chain as "IOTA_TESTNET" | "IOTA_MAINNET"
                  )}
                  target="_blank"
                  className="text-gray-600 font-semibold text-sm hover:underline"
                >
                  {shortenId(activity.destinationPubkey)}
                </Link>
              </div>
            ) : null}

            {/* Network */}
            <div
              className={`flex flex-row items-center justify-between px-5 py-4 rounded-xl ${
                link &&
                ((activity.type === "PAYMENT" &&
                  ((activity as any).fromUser || (activity as any).from)) ||
                  (activity.type === "WITHDRAWAL" &&
                    (activity as any).toUser) ||
                  activity.destinationPubkey)
                  ? "bg-white"
                  : "bg-gray-50"
              }`}
            >
              <div className="text-gray-400 text-sm">Chain</div>
              <div className="flex items-center gap-1.5">
                <Image
                  src="/assets/chains/aptos.svg"
                  alt={activity.chain}
                  width={14}
                  height={14}
                  className="w-4 h-4"
                />
                <span className="text-gray-600 font-semibold text-sm">
                  APTOS
                </span>
              </div>
            </div>
          </div>

          {paymentDetails.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="text-gray-500 text-sm font-medium px-1">
                Payment Information
              </div>
              <div className="bg-gray-50 rounded-xl divide-y divide-gray-200/80">
                {paymentDetails.map((detail) => {
                  if (detail.id === "note" && detail.value.length > 100) {
                    return (
                      <div key={detail.id} className="p-4">
                        <div className="flex items-center gap-2.5 text-gray-500 text-sm">
                          <detail.Icon className="h-4 w-4" />
                          <span>{detail.label}</span>
                        </div>
                        <div className="pt-2">
                          <div className="relative">
                            <motion.div
                              initial={false}
                              animate={{
                                height: noteExpanded ? "auto" : "3.5rem",
                              }}
                              transition={{
                                height: {
                                  duration: 0.4,
                                  ease: [0.4, 0, 0.2, 1],
                                },
                              }}
                              className="overflow-hidden"
                            >
                              <div className="text-gray-800 font-medium text-sm break-words leading-relaxed">
                                {detail.value}
                              </div>
                            </motion.div>

                            {!noteExpanded && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent pointer-events-none"
                              />
                            )}
                          </div>

                          <motion.button
                            onClick={() => setNoteExpanded(!noteExpanded)}
                            className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 group pt-1"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>
                              {noteExpanded ? "Show less" : "Show more"}
                            </span>
                            <motion.div
                              animate={{ rotate: noteExpanded ? 180 : 0 }}
                              transition={{
                                duration: 0.2,
                                ease: "easeInOut",
                              }}
                            >
                              <ChevronDownIcon className="w-3.5 h-3.5" />
                            </motion.div>
                          </motion.button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={detail.id}
                      className="flex flex-row items-start justify-between p-4"
                    >
                      <div className="flex items-center gap-2.5 text-gray-500 text-sm">
                        <detail.Icon className="h-4 w-4" />
                        <span>{detail.label}</span>
                      </div>
                      <div className="text-gray-800 font-medium text-sm text-right max-w-[60%] break-words">
                        {detail.value}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CuteModal>
    </>
  );
};

export default ActivityItem;
