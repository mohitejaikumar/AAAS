import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { useAaasContract } from "../hooks/useAaasContract";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { CountdownTimer } from "../components/CountdownTimer";

// Define Challenge interface
interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  start_time: string;
  end_time: string;
  total_participants: number;
  total_votes: number;
  money_pool: number;
  money_per_participant: number;
  treasury_account: string;
  is_private: boolean;
  private_group: string[];
}

export default function ChallengesScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const { isConnected, userPublickey } = useWallet();
  const { fetchChallenges } = useAaasContract();
  const router = useRouter();

  // Fetch challenges from the contract
  const loadChallenges = async () => {
    try {
      setIsLoading(true);
      const challengesList = await fetchChallenges();
      setChallenges(challengesList);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to load challenges. Please try again later.",
        [{ text: "Reload", onPress: () => loadChallenges() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh challenges
  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadChallenges();
    } catch (error) {
      console.error("Error refreshing challenges:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load challenges when component mounts
  useEffect(() => {
    loadChallenges();
  }, []);

  const navigateToChallenge = (challengeId: string) => {
    router.push(`/(stack)/challenge-details/${challengeId}`);
  };

  const handleJoinChallenge = (challengeId: string) => {
    router.push(`/(stack)/join-challenge/${challengeId}`);
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case "GoogleFit":
        return <Ionicons name="fitness-outline" size={22} color="#4f46e5" />;
      case "GitHub":
        return <Ionicons name="logo-github" size={22} color="#4f46e5" />;
      case "Votebased":
        return <Ionicons name="thumbs-up-outline" size={22} color="#4f46e5" />;
      default:
        return (
          <Ionicons name="help-circle-outline" size={22} color="#4f46e5" />
        );
    }
  };

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        year: date.getFullYear(),
      };
    } catch (error) {
      return { date: "Invalid", time: "date", year: "" };
    }
  };

  // Check if private and user is allowed to join
  const canJoinPrivateChallenge = (challenge: Challenge) => {
    if (!challenge.is_private) return true;
    if (!userPublickey) return false;

    // Check if private_group exists and has items before trying to use includes
    return (
      Array.isArray(challenge.private_group) &&
      challenge.private_group.length > 0 &&
      challenge.private_group.includes(userPublickey.toString())
    );
  };

  const renderChallengeItem = ({ item }: { item: Challenge }) => (
    <TouchableOpacity
      style={styles.challengeCard}
      onPress={() => navigateToChallenge(item.id)}
      activeOpacity={0.7}>
      <View style={styles.challengeHeader}>
        <View style={styles.typeContainer}>
          {getChallengeTypeIcon(item.challenge_type)}
          <Text style={styles.challengeType}>{item.challenge_type}</Text>
          {item.is_private && (
            <View style={styles.privateLabel}>
              <Ionicons name="lock-closed" size={14} color="#6b7280" />
              <Text style={styles.privateText}>Private</Text>
            </View>
          )}
        </View>
        {canJoinPrivateChallenge(item) ? (
          <TouchableOpacity
            style={[
              styles.joinButton,
              new Date(item.start_time) <= new Date() &&
                styles.joinButtonDisabled,
            ]}
            onPress={() => handleJoinChallenge(item.id)}
            disabled={new Date(item.start_time) <= new Date()}>
            <Text
              style={[
                styles.joinButtonText,
                new Date(item.start_time) <= new Date() &&
                  styles.joinButtonTextDisabled,
              ]}>
              {new Date(item.start_time) <= new Date() ? "Started" : "Join"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.restrictedButton}>
            <Text style={styles.restrictedButtonText}>Restricted</Text>
          </View>
        )}
      </View>

      <Text style={styles.challengeTitle}>{item.title}</Text>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.challengeDetails}>
        <View style={styles.dateSection}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Start:</Text>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>
                {formatDate(item.start_time).date}
              </Text>
            </View>
            <Text style={styles.timeText}>
              {formatDate(item.start_time).time}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>End:</Text>
            <View style={styles.dateChip}>
              <Text style={styles.dateChipText}>
                {formatDate(item.end_time).date}
              </Text>
            </View>
            <Text style={styles.timeText}>
              {formatDate(item.end_time).time}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {item.total_participants} Participants
            </Text>
          </View>

          {item.challenge_type === "Votebased" && (
            <View style={styles.statItem}>
              <Ionicons name="thumbs-up-outline" size={16} color="#6b7280" />
              <Text style={styles.statText}>{item.total_votes} Votes</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.challengeFooter}>
        <View style={styles.moneyInfoContainer}>
          <Text style={styles.poolAmount}>{item.money_pool} JKCOIN pool</Text>
          <Text style={styles.perParticipantAmount}>
            {item.money_per_participant} JKCOIN per entry
          </Text>
        </View>
        <View style={styles.timerContainer}>
          {new Date(item.start_time) > new Date() ? (
            <View style={styles.timerWrapper}>
              <Text style={styles.timerLabel}>Join in:</Text>
              <CountdownTimer endTime={item.start_time} />
            </View>
          ) : (
            <View style={styles.timerWrapper}>
              <Text style={styles.timerLabel}>Ends in:</Text>
              <CountdownTimer endTime={item.end_time} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyListComponent = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>No challenges found</Text>
        <Text style={styles.emptySubtext}>
          Pull down to refresh or check back later
        </Text>
      </View>
    );
  };

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <FlatList
        data={challenges}
        renderItem={renderChallengeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={["#6366f1"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Active Challenges</Text>
            <Text style={styles.headerSubtitle}>
              Join a challenge to win rewards and showcase your skills
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyListComponent />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  challengeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  challengeType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4f46e5",
    marginLeft: 6,
  },
  privateLabel: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  privateText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  joinButton: {
    backgroundColor: "#f0f9ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0284c7",
  },
  restrictedButton: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  restrictedButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#9ca3af",
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },
  challengeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563",
    marginBottom: 16,
  },
  challengeDetails: {
    flexDirection: "column",
    marginBottom: 16,
  },
  dateSection: {
    marginBottom: 10,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4b5563",
    width: 42,
    marginRight: 4,
  },
  dateChip: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  dateChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#4b5563",
  },
  timeText: {
    fontSize: 13,
    color: "#6b7280",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 6,
  },
  challengeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  moneyInfoContainer: {
    flex: 1,
    paddingRight: 8,
  },
  poolAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  perParticipantAmount: {
    fontSize: 14,
    color: "#6b7280",
  },
  timerContainer: {
    alignItems: "flex-end",
  },
  timerWrapper: {
    alignItems: "flex-end",
  },
  timerLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  joinButtonDisabled: {
    backgroundColor: "#f3f4f6",
    borderColor: "#e5e7eb",
  },
  joinButtonTextDisabled: {
    color: "#9ca3af",
  },
});
