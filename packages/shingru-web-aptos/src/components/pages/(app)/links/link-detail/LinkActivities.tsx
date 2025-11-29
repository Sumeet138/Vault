import { useState, useMemo, useRef, useEffect } from "react";
import { Activity } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { formatDateGroup, getDateKey } from "@/utils/time";
import { ActivityItem } from "../../activities/ActivityItem";
import { Activity as ActivityType } from "@/lib/api/links";
import { UserActivity } from "@/lib/api/user";
import CuteButton from "@/components/common/CuteButton";
import MainButton from "@/components/common/MainButton";
import router from "next/router";

interface LinkActivitiesProps {
  activities: ActivityType[];
  limit?: number;
  dateGrouping?: boolean;
  isShowSeeAll?: boolean;
}

// Convert Activity to UserActivity format for ActivityItem compatibility
const convertToUserActivity = (activity: ActivityType): UserActivity => {
  return {
    id: activity.id,
    type: activity.type as "PAYMENT" | "WITHDRAWAL", // Type assertion since we know these are the valid types
    timestamp: activity.timestamp,
    amount: activity.amount,
    uiAmount: activity.uiAmount,
    token: {
      symbol: activity.token.symbol,
      name: activity.token.name,
      decimals: activity.token.decimals,
      imageUrl: activity.token.imageUrl,
      mintAddress: activity.token.mintAddress,
      priceUsd: activity.token.priceUsd,
    },
    usdValue: activity.usdValue,
    link: {
      label: activity.link.label,
      emoji: activity.link.emoji,
      backgroundColor: activity.link.backgroundColor,
      tag: activity.link.tag,
      type: activity.link.type,
      amountType: activity.link.amountType,
    },
    from: activity.from,
    chain: activity.chain,
    isAnnounce: activity.isAnnounce,
    paymentInfo: activity.paymentInfo,
  };
};

function LinkActivities({
  activities,
  limit,
  dateGrouping = false,
  isShowSeeAll = false,
}: LinkActivitiesProps) {
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const previousActivitiesRef = useRef<ActivityType[]>(null);
  const isInitialLoadRef = useRef(true);

  // Track new activities for animation
  useEffect(() => {
    if (!activities || activities.length === 0) return;

    // Skip animation detection on initial load
    if (isInitialLoadRef.current) {
      isInitialLoadRef.current = false;
      previousActivitiesRef.current = activities;
      return;
    }

    // Detect new activities
    const previousActivities = previousActivitiesRef.current;
    if (previousActivities && activities.length > previousActivities.length) {
      const previousIds = new Set(previousActivities.map((a) => a.id));
      const newIds = activities
        .filter((activity) => !previousIds.has(activity.id))
        .map((a) => a.id);

      if (newIds.length > 0) {
        setNewActivityIds(new Set(newIds));

        // Clear new activity IDs after animation completes
        setTimeout(() => {
          setNewActivityIds(new Set());
        }, 800); // Match animation duration
      }
    }

    previousActivitiesRef.current = activities;
  }, [activities]);

  // Filter activities and limit if specified
  const filteredActivities = useMemo(() => {
    if (!activities) return [];

    let filtered = activities;

    // Apply limit only if specified
    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }, [activities, limit]);

  // Group activities by date if dateGrouping is enabled
  const groupedActivities = useMemo(() => {
    if (!dateGrouping || !filteredActivities.length) {
      return null;
    }

    const groups: { [key: string]: typeof filteredActivities } = {};

    filteredActivities.forEach((activity) => {
      const dateKey = getDateKey(activity.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(activity);
    });

    // Convert to array and sort by date (most recent first)
    return Object.entries(groups)
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateB).getTime() - new Date(dateA).getTime()
      )
      .map(([dateKey, activities]) => ({
        dateKey,
        dateLabel: formatDateGroup(activities[0].timestamp),
        activities: activities.sort((a, b) => b.timestamp - a.timestamp),
      }));
  }, [filteredActivities, dateGrouping]);

  return (
    <div>
      <div className="mt-4">
        <AnimatePresence mode="wait" initial={false}>
          {filteredActivities && filteredActivities.length > 0 ? (
            <motion.div
              key="activities"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex flex-col gap-1"
            >
              {dateGrouping && groupedActivities ? (
                // Render grouped activities
                <div className="space-y-6">
                  {groupedActivities.map((group) => (
                    <div key={group.dateKey} className="space-y-2">
                      <div className="px-2 py-1">
                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          {group.dateLabel}
                        </h3>
                      </div>
                      <div className="space-y-1">
                        {group.activities.map((activity) => (
                          <ActivityItem
                            key={activity.id}
                            activity={convertToUserActivity(activity)}
                            isNewActivity={newActivityIds.has(activity.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Render ungrouped activities
                filteredActivities.map((activity) => (
                  <ActivityItem
                    key={activity.id}
                    activity={convertToUserActivity(activity)}
                    isNewActivity={newActivityIds.has(activity.id)}
                  />
                ))
              )}
              {isShowSeeAll && (
                <div className="flex justify-center mt-6">
                  <Link href="/app/activities">
                    <MainButton className="px-8">See all activities</MainButton>
                  </Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="flex flex-col items-center justify-center py-8 space-y-4"
            >
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <Activity className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-base font-medium text-gray-900">
                  No activities yet
                </h3>
                <p className="text-gray-500 text-sm">
                  This link hasn&apos;t received any payments yet.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default LinkActivities;
