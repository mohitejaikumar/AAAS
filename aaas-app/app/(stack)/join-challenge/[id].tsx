import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useWallet } from "../../contexts/WalletContext";
import { useAaasContract } from "../../hooks/useAaasContract";
import * as contractService from "../../services/contractService";
import { PublicKey } from "@solana/web3.js";

export default function JoinChallengeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isConnected, userPublickey } = useWallet();
  const { program, joinChallenge } = useAaasContract();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");

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
        is_private: challengeData.isPrivate,
        challengeInformation: challengeData.challengeInformation,
      };

      setChallenge(formattedChallenge);

      // Check if user has already joined this challenge
      if (userPublickey) {
        try {
          const userChallengeAccount =
            await contractService.getUserChallengeAccountPDA(
              userPublickey,
              challengeAccountPDA
            );

          // If we can fetch the user challenge account, they've already joined
          await program.account.userChallengeAccount.fetch(
            userChallengeAccount
          );
          Alert.alert(
            "Already Joined",
            "You have already joined this challenge.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        } catch (error) {
          // User hasn't joined, which is expected
          console.log("User has not joined this challenge yet");
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

  // Handle form submission
  const handleJoinChallenge = async () => {
    if (!isConnected || !userPublickey || !challenge) {
      Alert.alert("Error", "You must be connected to join this challenge.");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Missing Information", "Please enter a username.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Call the joinChallenge function from contract hook
      const signature = await joinChallenge(
        parseInt(challenge.id, 10),
        username.trim(),
        description.trim() || "I'm excited to participate!"
      );

      console.log("Joined challenge with signature:", signature);

      Alert.alert("Success", "You have successfully joined the challenge!", [
        {
          text: "OK",
          onPress: () =>
            router.replace(`/(stack)/challenge-details/${challenge.id}`),
        },
      ]);
    } catch (error) {
      console.error("Error joining challenge:", error);
      Alert.alert(
        "Error",
        "Failed to join the challenge. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format money amount
  const formatMoney = (amount: number) => {
    return amount.toFixed(2) + " SOL";
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

  return (
    <>
      <Stack.Screen
        options={{
          title: "Join Challenge",
          headerTitleStyle: { fontWeight: "600" },
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            <View style={styles.challengeInfo}>
              <Text style={styles.challengeTitle}>{challenge.title}</Text>
              <Text style={styles.challengeType}>
                {challenge.challenge_type}
              </Text>
              <Text style={styles.entryFee}>
                Entry Fee:{" "}
                <Text style={styles.feeAmount}>
                  {formatMoney(challenge.money_per_participant)}
                </Text>
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Your Username</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                maxLength={50}
              />
              <Text style={styles.inputHint}>
                This will be displayed to other participants
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell something about yourself or your goal for this challenge"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.inputHint}>
                {description.length}/200 characters
              </Text>
            </View>

            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                By joining this challenge, you agree to deposit{" "}
                {formatMoney(challenge.money_per_participant)} into the
                challenge pool. This amount will be deducted from your wallet
                when you submit.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleJoinChallenge}
              disabled={isSubmitting || !isConnected}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>
                  Join Challenge for{" "}
                  {formatMoney(challenge.money_per_participant)}
                </Text>
              )}
            </TouchableOpacity>

            {!isConnected && (
              <Text style={styles.connectWalletText}>
                Please connect your wallet first to join the challenge.
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  formContainer: {
    padding: 20,
  },
  challengeInfo: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  challengeType: {
    fontSize: 14,
    color: "#4f46e5",
    fontWeight: "600",
    marginBottom: 12,
  },
  entryFee: {
    fontSize: 14,
    color: "#4b5563",
  },
  feeAmount: {
    fontWeight: "600",
    color: "#059669",
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputHint: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  disclaimer: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  disclaimerText: {
    fontSize: 14,
    color: "#1e40af",
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 16,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  connectWalletText: {
    fontSize: 14,
    color: "#ef4444",
    textAlign: "center",
  },
});
