import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../contexts/WalletContext";
import { CountdownTimer } from "../components/CountdownTimer";
import { useAaasContract } from "../hooks/useAaasContract";
import * as Clipboard from "expo-clipboard";
import * as contractService from "../services/contractService";

// Interface for user challenge data
interface UserChallenge {
  id: string;
  title: string;
  challenge_type: string;
  status: "not_started" | "active" | "completed";
  progress?: number;
  progressTarget?: number;
  progressUnit?: string;
  start_time: string;
  end_time: string;
  reward: number;
  votes?: {
    positive: number;
    negative: number;
  };
}

export default function ProfileScreen() {
  const [user, setUser] = useState({
    pubkey: "",
    name: "User",
    totalChallengesJoined: 0,
    totalChallengesCompleted: 0,
    totalRewardsEarned: 0,
    totalLost: 0,
    coinsWonVoting: 0,
  });
  const [myChallenges, setMyChallenges] = useState<UserChallenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { userPublickey, program } = useWallet();
  const { fetchChallenges } = useAaasContract();

  const copyAddressToClipboard = async () => {
    if (userPublickey) {
      await Clipboard.setStringAsync(userPublickey.toString());
      Alert.alert("Copied", "Wallet address copied to clipboard");
    }
  };

  const truncateAddress = (address: string) => {
    if (!address) return "";
    if (address.length <= 11) return address;
    return `${address.substring(0, 5)}...${address.substring(
      address.length - 4
    )}`;
  };

  // Function to load user challenges
  const loadUserChallenges = async () => {
    try {
      setIsLoading(true);
      if (!program || !userPublickey) {
        setMyChallenges([]);
        return;
      }

      // Get all challenges
      const allChallenges = await fetchChallenges();

      // Filter challenges to find the ones the user has joined
      const userChallenges: UserChallenge[] = [];
      let totalRewards = 0;
      let completedChallenges = 0;

      for (const challenge of allChallenges) {
        try {
          // For each challenge, check if the user has joined
          const challengeId = parseInt(challenge.id);
          const challengeAccount = await contractService.getChallengeAccountPDA(
            challengeId
          );
          const userChallengeAccount =
            await contractService.getUserChallengeAccountPDA(
              userPublickey,
              challengeAccount
            );

          // Try to fetch the user challenge account - if it exists, the user has joined
          const userChallengeData =
            await program.account.userChallengeAccount.fetch(
              userChallengeAccount
            );

          if (userChallengeData) {
            const now = new Date();
            const endTime = new Date(challenge.end_time);
            const startTime = new Date(challenge.start_time);

            let status: "not_started" | "active" | "completed";
            if (now > endTime) {
              status = "completed";
            } else if (now < startTime) {
              status = "not_started";
            } else {
              status = "active";
            }

            let reward = 0;

            // If challenge is completed and user completed it, add the reward
            if (
              status === "completed" &&
              userChallengeData.isChallengeCompleted
            ) {
              reward = challenge.money_per_participant;
              totalRewards += reward;
              completedChallenges += 1;
            }

            userChallenges.push({
              id: challenge.id,
              title: challenge.title,
              challenge_type: challenge.challenge_type,
              status: status,
              start_time: challenge.start_time,
              end_time: challenge.end_time,
              reward: reward,
              // Add progress data based on challenge type
              ...(challenge.challenge_type === "GoogleFit" && {
                progress: userChallengeData.score
                  ? userChallengeData.score.toNumber()
                  : 0,
                progressTarget: 50000, // Example target
                progressUnit: "steps",
              }),
              ...(challenge.challenge_type === "GitHub" && {
                progress: userChallengeData.score
                  ? userChallengeData.score.toNumber()
                  : 0,
                progressTarget: 3, // Example target
                progressUnit: "PRs",
              }),
              ...(challenge.challenge_type === "Votebased" && {
                votes: {
                  positive: userChallengeData.voteInPositive
                    ? userChallengeData.voteInPositive.toNumber()
                    : 0,
                  negative: userChallengeData.voteInNegative
                    ? userChallengeData.voteInNegative.toNumber()
                    : 0,
                },
              }),
            });
          }
        } catch (error) {
          // User hasn't joined this challenge, so we skip it
          continue;
        }
      }

      setMyChallenges(userChallenges);
      setUser((prev) => ({
        ...prev,
        pubkey: userPublickey.toString(),
        totalChallengesJoined: userChallenges.length,
        totalChallengesCompleted: completedChallenges,
        totalRewardsEarned: totalRewards,
      }));
    } catch (error) {
      // console.error("Error loading user challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userPublickey && program) {
      loadUserChallenges();
    } else {
      setUser((prev) => ({
        ...prev,
        pubkey: userPublickey?.toString() ?? "",
      }));
      setIsLoading(false);
    }
  }, [userPublickey, program]);

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

  const renderChallengeItem = ({ item }: { item: UserChallenge }) => (
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
                item.status === "completed"
                  ? "#d1fae5"
                  : item.status === "active"
                  ? "#f0f9ff"
                  : "#f5f3ff",
            },
          ]}>
          <Text
            style={[
              styles.statusText,
              {
                color:
                  item.status === "completed"
                    ? "#059669"
                    : item.status === "active"
                    ? "#3b82f6"
                    : "#7c3aed",
              },
            ]}>
            {item.status === "completed"
              ? "Completed"
              : item.status === "active"
              ? "Active"
              : "Not Started"}
          </Text>
        </View>
      </View>

      <Text style={styles.challengeTitle}>{item.title}</Text>

      {item.status === "active" && item.progress !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {item.progress} / {item.progressTarget} {item.progressUnit}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round((item.progress / (item.progressTarget || 1)) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(
                    100,
                    Math.round(
                      (item.progress / (item.progressTarget || 1)) * 100
                    )
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {item.votes && (
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
        {item.status === "not_started" ? (
          <Text style={styles.endDateText}>
            Starts: {formatDate(item.start_time)}
          </Text>
        ) : (
          <Text style={styles.endDateText}>
            {item.status === "active" ? "Ends: " : "Ended: "}
            {formatDate(item.end_time)}
          </Text>
        )}
        {item.status === "active" && (
          <CountdownTimer endTime={item.end_time} compact={true} />
        )}
        {item.status === "not_started" && (
          <CountdownTimer endTime={item.start_time} compact={true} />
        )}
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
              <View style={styles.addressContainer}>
                <Text style={styles.walletAddress}>
                  {truncateAddress(user.pubkey)}
                </Text>
                <TouchableOpacity
                  onPress={copyAddressToClipboard}
                  style={styles.copyButton}>
                  <Ionicons name="copy-outline" size={16} color="#6b7280" />
                </TouchableOpacity>
              </View>
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
            <Text style={styles.statValue}>
              {user.totalChallengesCompleted}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Challenges</Text>
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#6366f1"
              style={styles.loader}
            />
          ) : myChallenges.length > 0 ? (
            <FlatList
              data={myChallenges}
              renderItem={renderChallengeItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No challenges joined yet
              </Text>
              <TouchableOpacity
                style={styles.browseButton}
                onPress={() => router.push("/(tabs)/challenges")}>
                <Text style={styles.browseButtonText}>Browse Challenges</Text>
              </TouchableOpacity>
            </View>
          )}
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
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletAddress: {
    fontSize: 14,
    color: "#6b7280",
  },
  copyButton: {
    marginLeft: 8,
    padding: 4,
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
  loader: {
    marginTop: 20,
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 16,
  },
  browseButton: {
    backgroundColor: "#6366f1",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "#ffffff",
    fontWeight: "600",
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
    alignItems: "center",
    marginTop: 8,
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
