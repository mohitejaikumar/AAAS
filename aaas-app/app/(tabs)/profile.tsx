import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";

// Mock user data
const USER_DATA = {
  pubkey: "5Yd8...4Ch9",
  name: "Alex",
  totalChallengesJoined: 7,
  totalChallengesCompleted: 5,
  totalRewardsEarned: 485,
  totalLost: 120,
  coinsWonVoting: 75,
};

// Mock challenges data
const MY_CHALLENGES = [
  {
    id: "1",
    title: "Weekly Steps Challenge",
    challenge_type: "GoogleFit",
    status: "active",
    progress: 32500,
    progressTarget: 50000,
    progressUnit: "steps",
    end_time: "2023-06-07T23:59:59Z",
    reward: 0,
  },
  {
    id: "2",
    title: "Open Source Contribution",
    challenge_type: "GitHub",
    status: "active",
    progress: 2,
    progressTarget: 3,
    progressUnit: "PRs",
    end_time: "2023-06-30T23:59:59Z",
    reward: 0,
  },
  {
    id: "3",
    title: "Morning Run",
    challenge_type: "GoogleFit",
    status: "completed",
    progress: 15,
    progressTarget: 15,
    progressUnit: "days",
    end_time: "2023-05-15T23:59:59Z",
    reward: 120,
  },
  {
    id: "4",
    title: "Code Documentation",
    challenge_type: "GitHub",
    status: "completed",
    progress: 5,
    progressTarget: 5,
    progressUnit: "files",
    end_time: "2023-05-20T23:59:59Z",
    reward: 150,
  },
  {
    id: "5",
    title: "UI Design Challenge",
    challenge_type: "Votebased",
    status: "completed",
    votes: {
      positive: 18,
      negative: 3,
    },
    end_time: "2023-05-10T23:59:59Z",
    reward: 215,
  },
];

export default function ProfileScreen() {
  const [user, setUser] = useState(USER_DATA);
  const [myChallenges] = useState(MY_CHALLENGES);
  const router = useRouter();
  const { userPublickey } = useWallet();

  useEffect(() => {
    setUser((prev) => {
      return {
        ...prev,
        pubkey: userPublickey?.toString() ?? "",
      };
    });
  }, [userPublickey]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const navigateToChallenge = (challengeId: string) => {
    router.push(`/(stack)/challenge-details/${challengeId}`);
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case "GoogleFit":
        return <Ionicons name="fitness-outline" size={20} color="#4f46e5" />;
      case "GitHub":
        return <Ionicons name="logo-github" size={20} color="#4f46e5" />;
      case "Votebased":
        return <Ionicons name="thumbs-up-outline" size={20} color="#4f46e5" />;
      default:
        return (
          <Ionicons name="help-circle-outline" size={20} color="#4f46e5" />
        );
    }
  };

  const renderChallengeItem = ({
    item,
  }: {
    item: (typeof MY_CHALLENGES)[0];
  }) => (
    <TouchableOpacity
      style={styles.challengeCard}
      onPress={() => navigateToChallenge(item.id)}
      activeOpacity={0.7}>
      <View style={styles.challengeHeader}>
        <View style={styles.typeContainer}>
          {getChallengeTypeIcon(item.challenge_type)}
          <Text style={styles.challengeType}>{item.challenge_type}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === "completed" ? "#d1fae5" : "#f0f9ff",
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              { color: item.status === "completed" ? "#059669" : "#3b82f6" },
            ]}>
            {item.status === "completed" ? "Completed" : "Active"}
          </Text>
        </View>
      </View>

      <Text style={styles.challengeTitle}>{item.title}</Text>

      {item.status === "active" && "progress" in item && (
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {item.progress} / {item.progressTarget} {item.progressUnit}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round((item.progress / item.progressTarget) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    100,
                    Math.round((item.progress / item.progressTarget) * 100)
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {"votes" in item && (
        <View style={styles.votesContainer}>
          <View style={styles.voteItem}>
            <Ionicons name="thumbs-up" size={16} color="#059669" />
            <Text style={[styles.voteCount, { color: "#059669" }]}>
              {item.votes.positive}
            </Text>
          </View>
          <View style={styles.voteItem}>
            <Ionicons name="thumbs-down" size={16} color="#dc2626" />
            <Text style={[styles.voteCount, { color: "#dc2626" }]}>
              {item.votes.negative}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.challengeFooter}>
        <Text style={styles.endDateText}>
          Ended: {formatDate(item.end_time)}
        </Text>
        {item.reward > 0 && (
          <Text style={styles.rewardText}>+{item.reward} SOL</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <View style={styles.nameContainer}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.walletAddress}>{user.pubkey}</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalChallengesJoined}</Text>
            <Text style={styles.statLabel}>Challenges</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.totalRewardsEarned}</Text>
            <Text style={styles.statLabel}>Rewards (SOL)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.coinsWonVoting}</Text>
            <Text style={styles.statLabel}>Voting Rewards</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Challenges</Text>
          <FlatList
            data={myChallenges}
            renderItem={renderChallengeItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    backgroundColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#ffffff",
  },
  nameContainer: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 14,
    color: "#6b7280",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "#e5e7eb",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  challengeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
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
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  challengeTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressText: {
    fontSize: 14,
    color: "#4b5563",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3b82f6",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  votesContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  voteItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  challengeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  endDateText: {
    fontSize: 14,
    color: "#6b7280",
  },
  rewardText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
});
