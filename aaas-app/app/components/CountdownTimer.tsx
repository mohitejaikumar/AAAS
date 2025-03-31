import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CountdownTimerProps {
  endTime: string | Date;
  showIcon?: boolean;
  textStyle?: object;
  compact?: boolean;
}

export const CountdownTimer = ({
  endTime,
  showIcon = true,
  textStyle = {},
  compact = false,
}: CountdownTimerProps) => {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endDate = typeof endTime === "string" ? new Date(endTime) : endTime;
      const diff = endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeRemaining("Ended");
        return;
      }

      // Calculate days, hours, minutes
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (compact) {
        if (days > 0) {
          setTimeRemaining(`${days}d`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h`);
        } else {
          setTimeRemaining(`${minutes}m`);
        }
      } else {
        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeRemaining(`${hours}h ${minutes}m left`);
        } else {
          setTimeRemaining(`${minutes}m left`);
        }
      }
    };

    // Calculate immediately and then set interval
    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [endTime, compact]);

  return (
    <View style={[styles.container, compact && styles.compactContainer]}>
      {showIcon && !isExpired && (
        <Ionicons
          name="time-outline"
          size={compact ? 12 : 16}
          color="#6b7280"
          style={styles.icon}
        />
      )}
      {showIcon && isExpired && (
        <Ionicons
          name="alert-circle-outline"
          size={compact ? 12 : 16}
          color="#ef4444"
          style={styles.icon}
        />
      )}
      <Text
        style={[
          styles.text,
          compact && styles.compactText,
          textStyle,
          isExpired ? styles.expired : {},
        ]}
        numberOfLines={1}>
        {timeRemaining}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  compactContainer: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontSize: 14,
    color: "#6b7280",
  },
  compactText: {
    fontSize: 12,
  },
  expired: {
    color: "#ef4444",
  },
});
