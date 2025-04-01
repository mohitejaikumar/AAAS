import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWallet } from "../../contexts/WalletContext";
import { useAaasContract } from "../../hooks/useAaasContract";
import * as contractService from "../../services/contractService";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { useConnection } from "@/app/hooks/useConnection";

// Define types for our data
type Participant = {
  id: string;
  pubkey: string;
  user_name: string;
  description: string;
  submission_description: string;
  vote_in_positive: number;
  vote_in_negative: number;
  user_challenge_account_address: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  end_time: Date;
  voting_end_time: Date;
  voting_reward: number;
  participants: Participant[];
};

export default function VotingChallengeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { userPublickey, program, signAndSendAllTransaction } = useWallet();
  const connection = useConnection();
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [votes, setVotes] = useState<Record<string, "yes" | "no" | null>>({});
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  useEffect(() => {
    if (!program || !userPublickey) {
      Alert.alert("Error", "Please connect your wallet first");
      router.back();
      return;
    }

    loadChallengeData();
  }, [id, program, userPublickey]);

  useEffect(() => {
    if (!challenge) return;

    // Update timer every second
    const timer = setInterval(() => {
      const now = new Date();
      const votingEndTime = challenge.voting_end_time;

      if (now > votingEndTime) {
        setTimeRemaining("Voting period has ended");
        clearInterval(timer);
        return;
      }

      const diffMs = votingEndTime.getTime() - now.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${diffHrs.toString().padStart(2, "0")}:${diffMins
          .toString()
          .padStart(2, "0")}:${diffSecs.toString().padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge]);

  const loadChallengeData = async () => {
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

      console.log(challengeData);

      // Check if challenge is vote-based
      if (
        !("voteBased" in challengeData.challengeInformation.challengeType) &&
        !("github" in challengeData.challengeInformation.challengeType)
      ) {
        Alert.alert("Error", "This is not a vote-based challenge");
        router.back();
        return;
      }

      // Get all user challenge accounts for this challenge
      const userChallengeAccounts =
        await program.account.userChallengeAccount.all([
          {
            memcmp: {
              offset: 8, // after discriminator
              bytes: challengeAccountPDA.toBase58(),
            },
          },
        ]);

      // Format participants data
      const participants: Participant[] = await Promise.all(
        userChallengeAccounts.map(async (account) => {
          const userChallengeData = account.account;

          // For each participant, check if the current user has already voted
          const voteAccountAddress = await contractService.getVoteAccountPDA(
            challengeAccountPDA,
            new PublicKey(userChallengeData.userAddress)
          );

          let hasAlreadyVoted = false;
          try {
            const voteAccount = await program.account.voteAccount.fetch(
              voteAccountAddress
            );
            if (voteAccount.isVoted) {
              setHasVoted((prev) => ({
                ...prev,
                [userChallengeData.userAddress.toString()]: true,
              }));
              hasAlreadyVoted = true;
            }
          } catch (error) {
            // Vote account doesn't exist yet, so user hasn't voted
          }

          return {
            id: userChallengeData.userAddress.toString(),
            pubkey:
              userChallengeData.userAddress.toString().slice(0, 4) +
              "..." +
              userChallengeData.userAddress.toString().slice(-4),
            user_name: userChallengeData.description.split(" ")[0], // Using first word of description as username
            description: userChallengeData.description,
            submission_description: userChallengeData.description,
            vote_in_positive: userChallengeData.voteInPositive.toNumber(),
            vote_in_negative: userChallengeData.voteInNegative.toNumber(),
            user_challenge_account_address: account.publicKey.toString(),
          };
        })
      );

      // Calculate voting end time (challenge end time + 30 minutes)
      const challengeEndTime = new Date(
        challengeData.endTime.toNumber() * 1000
      );
      const votingEndTime = new Date(challengeEndTime);
      votingEndTime.setMinutes(votingEndTime.getMinutes() + 30);

      // Format challenge data for display
      const formattedChallenge: Challenge = {
        id: challengeData.challengeId.toString(),
        title: challengeData.challengeInformation.challengeName,
        description: challengeData.challengeInformation.challengeDescription,
        end_time: challengeEndTime,
        voting_end_time: votingEndTime,
        voting_reward: 1000 / LAMPORTS_PER_SOL, // JKCOIN Fixed reward for voting
        participants: participants,
      };

      setChallenge(formattedChallenge);

      // Initialize votes as null (not voted yet)
      const initialVotes: Record<string, "yes" | "no" | null> = {};
      participants.forEach((participant: Participant) => {
        initialVotes[participant.id] = null;
      });
      setVotes(initialVotes);

      setIsLoading(false);
    } catch (error) {
      console.error("Error loading challenge data:", error);
      Alert.alert("Error", "Failed to load challenge data");
      router.back();
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleParticipantExpand = (participantId: string) => {
    if (expandedParticipant === participantId) {
      setExpandedParticipant(null);
    } else {
      setExpandedParticipant(participantId);
    }
  };

  const handleVote = (participantId: string, voteValue: "yes" | "no") => {
    setVotes((prev) => ({
      ...prev,
      [participantId]: voteValue,
    }));
  };

  const isCurrentUser = (participantId: string) => {
    return userPublickey?.toString() === participantId;
  };

  const hasVotedForAll = () => {
    // If there are no participants, there's nothing to vote on
    if (challenge?.participants.length === 0) {
      return false;
    }

    // Count all participants except the current user
    const eligibleParticipants = Object.keys(votes).filter(
      (participantId) => !isCurrentUser(participantId)
    );

    // Check if all eligible participants have votes
    return (
      eligibleParticipants.length > 0 &&
      eligibleParticipants.every(
        (participantId) => votes[participantId] !== null
      )
    );
  };

  const handleSubmitVotes = async () => {
    if (!hasVotedForAll()) {
      Alert.alert(
        "Incomplete Voting",
        "Please vote for all participants before submitting."
      );
      return;
    }

    if (!program || !userPublickey) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    setIsSubmitting(true);

    try {
      let transactions = [];
      // Submit each vote to the blockchain
      for (const [participantId, voteValue] of Object.entries(votes)) {
        // Skip if already voted or if it's the current user
        if (hasVoted[participantId] || isCurrentUser(participantId)) {
          continue;
        }

        if (!voteValue) continue;

        const challengeId = parseInt(id as string, 10);
        const userAddress = new PublicKey(participantId);

        // Create the vote transaction
        const tx = await contractService.voteForChallenge(
          program,
          challengeId,
          userAddress,
          voteValue === "yes", // isCompleted = true for yes votes
          userPublickey
        );
        transactions.push(tx);
      }

      const signature = await signAndSendAllTransaction(transactions);

      console.log(signature);

      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      Alert.alert(
        "Votes Submitted!",
        `You have successfully submitted your votes and earned ${challenge?.voting_reward} JKCOIN.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error submitting votes:", error);
      Alert.alert("Error", "Failed to submit votes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !challenge) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>

          <View style={styles.rewardContainer}>
            <Ionicons name="gift-outline" size={20} color="#4f46e5" />
            <Text style={styles.rewardText}>
              {challenge.voting_reward} JKCOIN reward for voting
            </Text>
          </View>

          <View style={styles.deadlineContainer}>
            <Ionicons name="time-outline" size={20} color="#6b7280" />
            <Text style={styles.deadlineText}>
              Challenge ends: {formatDate(challenge.end_time)}
            </Text>
          </View>

          <View style={styles.deadlineContainer}>
            <Ionicons name="hourglass-outline" size={20} color="#6b7280" />
            <Text style={styles.deadlineText}>
              Voting open until: {formatDate(challenge.voting_end_time)}
            </Text>
          </View>

          <View style={styles.countdownContainer}>
            <Ionicons name="alarm-outline" size={20} color="#4f46e5" />
            <Text style={styles.countdownText}>
              {timeRemaining
                ? `Time remaining: ${timeRemaining}`
                : "Loading timer..."}
            </Text>
          </View>
        </View>

        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Vote on Submissions</Text>
          <Text style={styles.sectionDescription}>
            Review each submission and cast your vote. You must vote on all
            submissions before submitting.
          </Text>

          {challenge.participants.length > 0 ? (
            challenge.participants.map((participant: Participant) => (
              <View key={participant.id} style={styles.participantCard}>
                <TouchableOpacity
                  style={styles.participantHeader}
                  onPress={() => toggleParticipantExpand(participant.id)}>
                  <View>
                    <Text style={styles.participantName}>
                      {participant.user_name}
                    </Text>
                    <Text style={styles.participantPubkey}>
                      {participant.pubkey}
                    </Text>
                  </View>
                  <Ionicons
                    name={
                      expandedParticipant === participant.id
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={20}
                    color="#6b7280"
                  />
                </TouchableOpacity>

                {expandedParticipant === participant.id && (
                  <View style={styles.submissionContainer}>
                    <Text style={styles.aboutHeading}>About</Text>
                    <Text style={styles.aboutText}>
                      {participant.description}
                    </Text>

                    <Text style={styles.submissionHeading}>Current Votes</Text>
                    <Text style={styles.submissionText}>
                      👍 Positive: {participant.vote_in_positive} | 👎 Negative:{" "}
                      {participant.vote_in_negative}
                    </Text>
                  </View>
                )}

                <View style={styles.votingControls}>
                  {hasVoted[participant.id] ? (
                    <View style={styles.alreadyVotedMessage}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#059669"
                      />
                      <Text style={styles.alreadyVotedText}>Already Voted</Text>
                    </View>
                  ) : isCurrentUser(participant.id) ? (
                    <View style={styles.alreadyVotedMessage}>
                      <Ionicons
                        name="information-circle"
                        size={18}
                        color="#6b7280"
                      />
                      <Text style={styles.alreadyVotedText}>
                        Can't vote for yourself
                      </Text>
                    </View>
                  ) : (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.yesButton,
                          votes[participant.id] === "yes" &&
                            styles.voteButtonSelected,
                        ]}
                        onPress={() => handleVote(participant.id, "yes")}>
                        <Ionicons
                          name="thumbs-up"
                          size={18}
                          color={
                            votes[participant.id] === "yes"
                              ? "#ffffff"
                              : "#059669"
                          }
                        />
                        <Text
                          style={[
                            styles.voteButtonText,
                            styles.yesButtonText,
                            votes[participant.id] === "yes" &&
                              styles.voteButtonTextSelected,
                          ]}>
                          Yes
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.voteButton,
                          styles.noButton,
                          votes[participant.id] === "no" &&
                            styles.voteButtonSelected,
                        ]}
                        onPress={() => handleVote(participant.id, "no")}>
                        <Ionicons
                          name="thumbs-down"
                          size={18}
                          color={
                            votes[participant.id] === "no"
                              ? "#ffffff"
                              : "#dc2626"
                          }
                        />
                        <Text
                          style={[
                            styles.voteButtonText,
                            styles.noButtonText,
                            votes[participant.id] === "no" &&
                              styles.voteButtonTextSelected,
                          ]}>
                          No
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="people-outline" size={40} color="#9ca3af" />
              <Text style={styles.emptyStateText}>
                No one has joined this challenge yet
              </Text>
              <Text style={styles.emptyStateSubText}>
                Check back later after participants have joined
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!hasVotedForAll() || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmitVotes}
          disabled={!hasVotedForAll() || isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : challenge.participants.length === 0 ? (
            <>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.submitButtonText}>No Participants Yet</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.submitButtonText}>Submit Votes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4f46e5",
    marginLeft: 8,
  },
  deadlineContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
  },
  deadlineText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  participantsSection: {
    padding: 16,
    paddingBottom: 100, // Extra padding for submit button
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
    lineHeight: 20,
  },
  participantCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  participantHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  participantName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  participantPubkey: {
    fontSize: 14,
    color: "#6b7280",
  },
  submissionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#f9fafb",
  },
  aboutHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  submissionHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 4,
  },
  submissionText: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  votingControls: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    padding: 12,
  },
  voteButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  yesButton: {
    borderColor: "#059669",
    backgroundColor: "#f0fdf4",
  },
  noButton: {
    borderColor: "#dc2626",
    backgroundColor: "#fef2f2",
  },
  voteButtonSelected: {
    borderWidth: 0,
  },
  yesButtonSelected: {
    backgroundColor: "#059669",
  },
  noButtonSelected: {
    backgroundColor: "#dc2626",
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  yesButtonText: {
    color: "#059669",
  },
  noButtonText: {
    color: "#dc2626",
  },
  voteButtonTextSelected: {
    color: "#ffffff",
  },
  submitContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: "#a5b4fc",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
  alreadyVotedMessage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  alreadyVotedText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#6b7280",
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    flexWrap: "wrap",
  },
  countdownText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4f46e5",
    marginLeft: 8,
    flexShrink: 1,
    flexWrap: "wrap",
  },
});
