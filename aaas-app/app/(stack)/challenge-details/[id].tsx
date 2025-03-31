import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../contexts/WalletContext";
import { useAaasContract } from "../../hooks/useAaasContract";
import * as contractService from "../../services/contractService";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { CountdownTimer } from "../../components/CountdownTimer";

// Challenge status based on dates
enum ChallengeStatus {
  UPCOMING = "Upcoming",
  ACTIVE = "Active",
  COMPLETED = "Completed",
}

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isConnected, userPublickey } = useWallet();
  const { program, joinChallenge, voteForChallenge, claimChallenge } =
    useAaasContract();

  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [userChallengeStatus, setUserChallengeStatus] = useState<any>(null);
  const [status, setStatus] = useState<ChallengeStatus>(ChallengeStatus.ACTIVE);

  // Load challenge details
  const loadChallengeDetails = async () => {
    if (!program || !id) return;

    try {
      setIsLoading(true);

      // Get the challenge account PDA
      const challengeId = parseInt(id as string, 10);
      const challengeAccountPDA = await contractService.getChallengeAccountPDA(
        challengeId
      );

      // Fetch the challenge data
      const challengeData = await program.account.challengeAccount.fetch(
        challengeAccountPDA
      );

      // Format challenge data for display
      const formattedChallenge = {
        id: challengeData.challengeId.toString(),
        title: challengeData.challengeInformation.challengeName || "Challenge",
        description:
          challengeData.challengeInformation.challengeDescription ||
          "No description provided",
        challenge_type: getChallengeTypeString(
          challengeData.challengeInformation.challengeType
        ),
        start_time: new Date(challengeData.startTime * 1000),
        end_time: new Date(challengeData.endTime * 1000),
        total_participants: challengeData.totalParticipants.toNumber(),
        total_votes: challengeData.totalVotes.toNumber(),
        money_pool: challengeData.moneyPool.toNumber() / 1_000_000_000, // Convert from lamports to SOL
        money_per_participant:
          challengeData.moneyPerParticipant.toNumber() / 1_000_000_000,
        treasury_account: challengeData.treasuryAccount.toString(),
        is_private: challengeData.isPrivate,
        private_group: challengeData.privateGroup.map((pubkey: PublicKey) =>
          pubkey.toString()
        ),
        challengeInformation: challengeData.challengeInformation,
      };

      setChallenge(formattedChallenge);

      // Determine challenge status
      const now = new Date();
      if (now < formattedChallenge.start_time) {
        setStatus(ChallengeStatus.UPCOMING);
      } else if (now > formattedChallenge.end_time) {
        setStatus(ChallengeStatus.COMPLETED);
      } else {
        setStatus(ChallengeStatus.ACTIVE);
      }

      // Check if user has joined this challenge
      if (userPublickey) {
        try {
          const userChallengeAccount =
            await contractService.getUserChallengeAccountPDA(
              userPublickey,
              challengeAccountPDA
            );

          const userChallengeData =
            await program.account.userChallengeAccount.fetch(
              userChallengeAccount
            );
          setUserChallengeStatus(userChallengeData);
        } catch (error) {
          console.log("User has not joined this challenge yet");
          setUserChallengeStatus(null);
        }
      }
    } catch (error) {
      console.error("Error loading challenge details:", error);
      Alert.alert(
        "Error",
        "Failed to load challenge details. Please try again later.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Get challenge type as a string
  const getChallengeTypeString = (challengeType: any): string => {
    if (challengeType.googleFit) return "GoogleFit";
    if (challengeType.github) return "GitHub";
    if (challengeType.voteBased) return "Votebased";
    return "Unknown";
  };

  // Load challenge when component mounts
  useEffect(() => {
    if (program && id) {
      loadChallengeDetails();
    }
  }, [program, id]);

  // Join the challenge
  const handleJoinChallenge = async () => {
    if (!userPublickey || !challenge) return;

    try {
      setIsJoining(true);

      // Call the joinChallenge function from wallet context
      const signature = await joinChallenge(
        parseInt(challenge.id, 10),
        "User", // Default username
        "I'm excited to participate!" // Default description
      );

      console.log("Joined challenge with signature:", signature);

      // Reload challenge details
      await loadChallengeDetails();

      Alert.alert("Success", "You have successfully joined the challenge!", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error joining challenge:", error);
      Alert.alert(
        "Error",
        "Failed to join the challenge. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsJoining(false);
    }
  };

  // Vote for a participant
  const handleVoteForParticipant = async (
    participantAddress: string,
    isCompleted: boolean
  ) => {
    if (!userPublickey || !challenge) return;

    try {
      setIsVoting(true);

      // Call the voteForChallenge function from wallet context
      const signature = await voteForChallenge(
        parseInt(challenge.id, 10),
        participantAddress,
        isCompleted
      );

      console.log("Voted for participant with signature:", signature);

      // Reload challenge details
      await loadChallengeDetails();

      Alert.alert("Success", "Your vote has been recorded!", [{ text: "OK" }]);
    } catch (error) {
      console.error("Error voting for participant:", error);
      Alert.alert(
        "Error",
        "Failed to submit your vote. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsVoting(false);
    }
  };

  // Claim rewards
  const handleClaimReward = async () => {
    if (!userPublickey || !challenge) return;

    try {
      setIsClaiming(true);

      // Call the claimChallenge function from wallet context
      const signature = await claimChallenge(parseInt(challenge.id, 10));

      console.log("Claimed reward with signature:", signature);

      // Reload challenge details
      await loadChallengeDetails();

      Alert.alert("Success", "You have successfully claimed your reward!", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error claiming reward:", error);
      Alert.alert(
        "Error",
        "Failed to claim your reward. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsClaiming(false);
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get status badge color
  const getStatusColor = () => {
    switch (status) {
      case ChallengeStatus.UPCOMING:
        return { bg: "#e0f2fe", text: "#0284c7" };
      case ChallengeStatus.ACTIVE:
        return { bg: "#dcfce7", text: "#16a34a" };
      case ChallengeStatus.COMPLETED:
        return { bg: "#f3f4f6", text: "#6b7280" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  // Get challenge type icon
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

  // Check if user has already joined
  const hasUserJoined = () => {
    return userChallengeStatus && userChallengeStatus.isJoined;
  };

  // Check if user can join
  const canUserJoin = () => {
    if (!challenge || !userPublickey) return false;
    if (hasUserJoined()) return false;
    if (status !== ChallengeStatus.ACTIVE) return false;

    // Check if user is in private group for private challenges
    if (challenge.is_private) {
      return challenge.private_group.includes(userPublickey.toString());
    }

    return true;
  };

  // Check if user can claim rewards
  const canUserClaim = () => {
    if (!challenge || !userPublickey || !userChallengeStatus) return false;
    if (!hasUserJoined()) return false;
    if (status !== ChallengeStatus.COMPLETED) return false;

    // Check if challenge is completed by the user
    return userChallengeStatus.isChallengeCompleted;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Challenge not found.</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = getStatusColor();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Challenge Details",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <View style={styles.headerContent}>
              <View style={styles.titleWrapper}>
                <View style={styles.typeContainer}>
                  {getChallengeTypeIcon(challenge.challenge_type)}
                  <Text style={styles.challengeType}>
                    {challenge.challenge_type}
                  </Text>
                  {challenge.is_private && (
                    <View style={styles.privateLabel}>
                      <Ionicons name="lock-closed" size={14} color="#6b7280" />
                      <Text style={styles.privateText}>Private</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.challengeTitle} numberOfLines={2}>
                  {challenge.title}
                </Text>
              </View>

              {status !== ChallengeStatus.COMPLETED && (
                <View style={styles.timerContainer}>
                  <CountdownTimer
                    endTime={challenge.end_time}
                    textStyle={styles.timerText}
                  />
                </View>
              )}
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.bg },
              ]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {status}
              </Text>
            </View>

            <Text style={styles.description}>{challenge.description}</Text>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Start Date</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(challenge.start_time)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <Ionicons name="calendar" size={20} color="#6b7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>End Date</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(challenge.end_time)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={20} color="#6b7280" />
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoLabel}>Participants</Text>
                  <Text style={styles.infoValue}>
                    {challenge.total_participants}
                  </Text>
                </View>
              </View>

              {challenge.challenge_type === "Votebased" && (
                <View style={styles.infoItem}>
                  <Ionicons
                    name="thumbs-up-outline"
                    size={20}
                    color="#6b7280"
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Total Votes</Text>
                    <Text style={styles.infoValue}>
                      {challenge.total_votes}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.poolInfo}>
              <View>
                <Text style={styles.poolLabel}>Reward Pool</Text>
                <Text style={styles.poolAmount}>
                  {challenge.money_pool / LAMPORTS_PER_SOL} JKCOIN
                </Text>
              </View>
              <View>
                <Text style={styles.entryLabel}>Entry Fee</Text>
                <Text style={styles.entryAmount}>
                  {challenge.money_per_participant / LAMPORTS_PER_SOL} JKCOIN
                </Text>
              </View>
            </View>
          </View>

          {/* User participation status */}
          {hasUserJoined() && (
            <View style={styles.participationSection}>
              <Text style={styles.sectionTitle}>Your Participation</Text>

              <View style={styles.participationStatus}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Status</Text>
                  <Text
                    style={[
                      styles.statusValue,
                      {
                        color: userChallengeStatus.isChallengeCompleted
                          ? "#16a34a"
                          : "#0284c7",
                      },
                    ]}>
                    {userChallengeStatus.isChallengeCompleted
                      ? "Completed"
                      : "In Progress"}
                  </Text>
                </View>

                {userChallengeStatus.score > 0 && (
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Your Score</Text>
                    <Text style={styles.statusValue}>
                      {userChallengeStatus.score.toString()}
                    </Text>
                  </View>
                )}

                {challenge.challenge_type === "Votebased" && (
                  <>
                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Positive Votes</Text>
                      <Text style={styles.statusValue}>
                        {userChallengeStatus.voteInPositive.toString()}
                      </Text>
                    </View>

                    <View style={styles.statusItem}>
                      <Text style={styles.statusLabel}>Negative Votes</Text>
                      <Text style={styles.statusValue}>
                        {userChallengeStatus.voteInNegative.toString()}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionSection}>
            {canUserJoin() && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleJoinChallenge}
                disabled={isJoining}>
                {isJoining ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Join Challenge</Text>
                )}
              </TouchableOpacity>
            )}

            {canUserClaim() && (
              <TouchableOpacity
                style={styles.claimButton}
                onPress={handleClaimReward}
                disabled={isClaiming}>
                {isClaiming ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Claim Reward</Text>
                )}
              </TouchableOpacity>
            )}

            {hasUserJoined() && status === ChallengeStatus.ACTIVE && (
              <Text style={styles.actionHint}>
                Complete the challenge requirements to earn rewards.
              </Text>
            )}

            {hasUserJoined() &&
              !canUserClaim() &&
              status === ChallengeStatus.COMPLETED && (
                <Text style={styles.actionHint}>
                  You didn't complete the challenge requirements.
                </Text>
              )}

            {!isConnected && (
              <Text style={styles.actionHint}>
                Connect your wallet to participate in challenges.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#ef4444",
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  headerSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
  challengeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4b5563",
  },
  infoSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginTop: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 16,
  },
  poolInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  poolLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  poolAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#059669",
  },
  entryLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    textAlign: "right",
  },
  entryAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    textAlign: "right",
  },
  participationSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  participationStatus: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statusItem: {
    width: "48%",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  actionSection: {
    padding: 20,
    backgroundColor: "#ffffff",
    marginTop: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  claimButton: {
    backgroundColor: "#059669",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  actionHint: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },
  timerContainer: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
