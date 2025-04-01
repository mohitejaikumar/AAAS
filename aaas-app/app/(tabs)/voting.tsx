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
import { useAaasContract } from "../hooks/useAaasContract";
import { ChallengeType } from "../services/contractService";
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
  category?: string; // Optional derived from challenge_type
  votingEndTime?: string; // Added for voting period end time
}

// Voting period duration in milliseconds (30 minutes)
const VOTING_PERIOD_MS = 30 * 60 * 1000;

export default function VotingScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [votableChallenges, setVotableChallenges] = useState<Challenge[]>([]);
  const { fetchChallenges } = useAaasContract();
  const router = useRouter();

  // Check if a challenge is in voting period
  const isInVotingPeriod = (challenge: Challenge) => {
    const now = new Date().getTime();
    const endTime = new Date(challenge.end_time).getTime();
    const votingEndTime = endTime + VOTING_PERIOD_MS;

    return now >= endTime && now <= votingEndTime;
  };

  // Load voting challenges
  const loadVotingChallenges = async () => {
    try {
      setIsLoading(true);
      const allChallenges = await fetchChallenges();

      // Filter only vote-based challenges that are in voting period
      const filteredChallenges = allChallenges.filter(
        (challenge) =>
          (challenge.challenge_type === ChallengeType.VOTE_BASED ||
            challenge.challenge_type === ChallengeType.GITHUB) &&
          isInVotingPeriod(challenge)
      );

      // Add category and voting end time
      const enhancedChallenges = filteredChallenges.map((challenge) => {
        const endTime = new Date(challenge.end_time).getTime();
        const votingEndTime = new Date(
          endTime + VOTING_PERIOD_MS
        ).toISOString();

        return {
          ...challenge,
          category: challenge.title.toLowerCase().includes("design")
            ? "Design"
            : "Development",
          votingEndTime,
        };
      });

      console.log(enhancedChallenges);

      setVotableChallenges(enhancedChallenges);
    } catch (error) {
      // console.error("Error loading voting challenges:", error);
      Alert.alert(
        "Error",
        "Failed to load voting challenges. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh challenges
  const onRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadVotingChallenges();
    } catch (error) {
      // console.error("Error refreshing challenges:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Load challenges when component mounts
  useEffect(() => {
    loadVotingChallenges();

    // Set up timer to refresh challenges every minute to update voting period status
    const interval = setInterval(() => {
      loadVotingChallenges();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const navigateToVoting = (challengeId: string) => {
    router.push(`/(stack)/voting-challenge/${challengeId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderChallengeItem = ({ item }: { item: Challenge }) => (
    <TouchableOpacity
      style={styles.challengeCard}
      onPress={() => navigateToVoting(item.id)}
      activeOpacity={0.7}>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category || "Challenge"}</Text>
      </View>

      <View style={styles.votingBadge}>
        <Ionicons name="timer-outline" size={14} color="#ffffff" />
        <Text style={styles.votingText}>Voting Period</Text>
      </View>

      <Text style={styles.challengeTitle}>{item.title}</Text>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>
            {item.total_participants} Participants
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={16} color="#6b7280" />
          <Text style={styles.statText}>{item.total_votes} Votes</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color="#6b7280" />
          <CountdownTimer
            endTime={item.votingEndTime || item.end_time}
            showIcon={false}
            textStyle={styles.statText}
            compact={true}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.rewardContainer}>
          <Ionicons name="gift-outline" size={18} color="#4f46e5" />
          <Text style={styles.rewardText}>
            {1000 / LAMPORTS_PER_SOL} JKCOIN
          </Text>
        </View>
        <View style={styles.voteButtonContainer}>
          <TouchableOpacity
            style={styles.voteButton}
            onPress={() => navigateToVoting(item.id)}>
            <Text style={styles.voteButtonText}>Vote Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyListComponent = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color="#9ca3af" />
        <Text style={styles.emptyText}>No active voting challenges</Text>
        <Text style={styles.emptySubtext}>
          Check back soon for challenges in voting period
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
        data={votableChallenges}
        renderItem={renderChallengeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyListComponent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Vote & Earn</Text>
            <Text style={styles.headerSubtitle}>
              Vote for the best submissions during the 30-minute voting period
            </Text>
          </View>
        }
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
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4b5563",
  },
  votingBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: "#ec4899",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  votingText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 4,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
  },
  challengeDescription: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 16,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 16,
    justifyContent: "space-between",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    maxWidth: "32%",
  },
  statText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 4,
    flexShrink: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rewardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4f46e5",
    marginLeft: 4,
  },
  voteButtonContainer: {},
  voteButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
});
