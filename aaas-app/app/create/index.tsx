import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import {
  getProvider,
  getProgram,
  initializeChallenge,
  ChallengeType,
} from "../services/contractService";
import { AnchorProvider, Wallet } from "@coral-xyz/anchor";
import * as crypto from "crypto";
import * as contractService from "../services/contractService";
import { useWallet } from "../contexts/WalletContext";
import { useConnection } from "../hooks/useConnection";

// Define the schema
const challengeFormSchema = z.object({
  title: z.string().min(4, { message: "Title must be at least 4 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  challenge_type: z.nativeEnum(ChallengeType),
  steps_per_day: z
    .number()
    .min(0, { message: "Steps per day must be at least 1000" })
    .optional(),
  commits_per_day: z
    .number()
    .min(1, { message: "Commits per day must be at least 1" })
    .optional(),
  start_time: z.date(),
  end_time: z.date(),
  money_per_participant: z
    .number()
    .min(1, { message: "Amount must be at least 1 SOL" }),
  is_private: z.boolean(),
  private_participants: z.array(z.string()).optional(),
});

type ChallengeFormValues = z.infer<typeof challengeFormSchema>;

export default function CreateChallengeScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privateParticipant, setPrivateParticipant] = useState("");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const { program, userPublickey } = useWallet();
  const connection = useConnection();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ChallengeFormValues>({
    resolver: zodResolver(challengeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      challenge_type: ChallengeType.GOOGLE_FIT,
      steps_per_day: 10000,
      commits_per_day: 3,
      start_time: new Date(),
      end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // One week from now
      money_per_participant: 10,
      is_private: false,
      private_participants: [],
    },
  });

  const isPrivate = watch("is_private");
  const privateParticipants = watch("private_participants") || [];
  const challengeType = watch("challenge_type");

  const addPrivateParticipant = () => {
    if (!privateParticipant.trim()) {
      Alert.alert("Error", "Please enter a valid wallet address");
      return;
    }

    setValue("private_participants", [
      ...privateParticipants,
      privateParticipant.trim(),
    ]);
    setPrivateParticipant("");
  };

  const removePrivateParticipant = (index: number) => {
    const newParticipants = [...privateParticipants];
    newParticipants.splice(index, 1);
    setValue("private_participants", newParticipants);
  };

  const onSubmit = async (data: ChallengeFormValues) => {
    setIsSubmitting(true);

    try {
      // Generate a random challenge ID
      const challengeId = crypto.randomBytes(4).readUInt32LE(0);

      // Define mint address (this should be your token's mint address)
      const mint = new PublicKey("zXrV5XQLxvjFmmPGPF5hARLokViUE33KEg7rDBtqfuT"); // JKCOIN on devnet

      // Initialize challenge on the blockchain
      const txs = await contractService.initializeChallenge(
        program,
        challengeId,
        data.challenge_type,
        data.start_time,
        data.end_time,
        data.money_per_participant,
        data.is_private,
        data.private_participants || [],
        mint,
        userPublickey,
        data.title,
        data.description,
        data.steps_per_day,
        data.commits_per_day
      );

      // Wait for confirmation
      await connection.confirmTransaction(txs, "confirmed");

      console.log("Challenge created with ID:", challengeId);

      setIsSubmitting(false);
      Alert.alert(
        "Challenge Created!",
        "Your challenge has been successfully created on the blockchain.",
        [{ text: "OK", onPress: () => router.replace("/challenges") }]
      );
    } catch (error) {
      console.error("Error creating challenge:", error);
      setIsSubmitting(false);
      Alert.alert(
        "Error",
        "Failed to create challenge. Please try again later."
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create a Challenge</Text>
          <Text style={styles.headerSubtitle}>
            Set up a new challenge for the community
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Challenge Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Title</Text>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.title && styles.inputError]}
                  placeholder="Enter challenge title"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.title && (
              <Text style={styles.errorText}>{errors.title.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.textArea,
                    errors.description && styles.inputError,
                  ]}
                  placeholder="Describe your challenge"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.description && (
              <Text style={styles.errorText}>{errors.description.message}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Challenge Type</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  challengeType === ChallengeType.GOOGLE_FIT &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  setValue("challenge_type", ChallengeType.GOOGLE_FIT)
                }>
                <Ionicons
                  name="fitness-outline"
                  size={24}
                  color={
                    challengeType === ChallengeType.GOOGLE_FIT
                      ? "#ffffff"
                      : "#4f46e5"
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    challengeType === ChallengeType.GOOGLE_FIT &&
                      styles.typeButtonTextActive,
                  ]}>
                  GoogleFit
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  challengeType === ChallengeType.GITHUB &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  setValue("challenge_type", ChallengeType.GITHUB)
                }>
                <Ionicons
                  name="logo-github"
                  size={24}
                  color={
                    challengeType === ChallengeType.GITHUB
                      ? "#ffffff"
                      : "#4f46e5"
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    challengeType === ChallengeType.GITHUB &&
                      styles.typeButtonTextActive,
                  ]}>
                  GitHub
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  challengeType === ChallengeType.VOTE_BASED &&
                    styles.typeButtonActive,
                ]}
                onPress={() =>
                  setValue("challenge_type", ChallengeType.VOTE_BASED)
                }>
                <Ionicons
                  name="thumbs-up-outline"
                  size={24}
                  color={
                    challengeType === ChallengeType.VOTE_BASED
                      ? "#ffffff"
                      : "#4f46e5"
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    challengeType === ChallengeType.VOTE_BASED &&
                      styles.typeButtonTextActive,
                  ]}>
                  Votebased
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Time & Rewards</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Start Date</Text>
            <Controller
              control={control}
              name="start_time"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {value.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <Ionicons name="calendar-outline" size={24} color="#6b7280" />
                </TouchableOpacity>
              )}
            />

            {showStartDatePicker && (
              <Controller
                control={control}
                name="start_time"
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowStartDatePicker(false);
                      if (selectedDate) {
                        onChange(selectedDate);
                      }
                    }}
                  />
                )}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>End Date</Text>
            <Controller
              control={control}
              name="end_time"
              render={({ field: { value } }) => (
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}>
                  <Text style={styles.dateText}>
                    {value.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <Ionicons name="calendar-outline" size={24} color="#6b7280" />
                </TouchableOpacity>
              )}
            />

            {showEndDatePicker && (
              <Controller
                control={control}
                name="end_time"
                render={({ field: { onChange, value } }) => (
                  <DateTimePicker
                    value={value}
                    mode="date"
                    display="default"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowEndDatePicker(false);
                      if (selectedDate) {
                        onChange(selectedDate);
                      }
                    }}
                  />
                )}
              />
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Money per Participant (SOL)</Text>
            <Controller
              control={control}
              name="money_per_participant"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.money_per_participant && styles.inputError,
                  ]}
                  placeholder="10"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(Number(text) || 0)}
                  value={value.toString()}
                  keyboardType="numeric"
                />
              )}
            />
            {errors.money_per_participant && (
              <Text style={styles.errorText}>
                {errors.money_per_participant.message}
              </Text>
            )}
          </View>

          {challengeType === ChallengeType.GOOGLE_FIT && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Steps/Day</Text>
              <Controller
                control={control}
                name="steps_per_day"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      errors.steps_per_day && styles.inputError,
                    ]}
                    placeholder="10000"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? value.toString() : ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.steps_per_day && (
                <Text style={styles.errorText}>
                  {errors.steps_per_day.message}
                </Text>
              )}
            </View>
          )}

          {challengeType === ChallengeType.GITHUB && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Commits/Day</Text>
              <Controller
                control={control}
                name="commits_per_day"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={[
                      styles.input,
                      errors.commits_per_day && styles.inputError,
                    ]}
                    placeholder="3"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(Number(text) || 0)}
                    value={value ? value.toString() : ""}
                    keyboardType="numeric"
                  />
                )}
              />
              {errors.commits_per_day && (
                <Text style={styles.errorText}>
                  {errors.commits_per_day.message}
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <View style={styles.formGroup}>
            <View style={styles.privateToggleContainer}>
              <Text style={styles.label}>Private Challenge</Text>
              <Controller
                control={control}
                name="is_private"
                render={({ field: { onChange, value } }) => (
                  <Switch
                    trackColor={{ false: "#e5e7eb", true: "#a5b4fc" }}
                    thumbColor={value ? "#6366f1" : "#f4f3f4"}
                    onValueChange={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            <Text style={styles.helperText}>
              Private challenges are only visible to invited participants
            </Text>
          </View>

          {isPrivate && (
            <View style={styles.privateParticipantsSection}>
              <Text style={styles.label}>Add Participants</Text>

              <View style={styles.participantInputContainer}>
                <TextInput
                  style={styles.participantInput}
                  placeholder="Enter wallet address"
                  value={privateParticipant}
                  onChangeText={setPrivateParticipant}
                />
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addPrivateParticipant}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {privateParticipants.length > 0 && (
                <View style={styles.participantsList}>
                  {privateParticipants.map((participant, index) => (
                    <View key={index} style={styles.participantItem}>
                      <Text style={styles.participantAddress} numberOfLines={1}>
                        {participant}
                      </Text>
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removePrivateParticipant(index)}>
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#6b7280"
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#ffffff"
              />
              <Text style={styles.submitButtonText}>Create Challenge</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
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
  },
  formSection: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
  },
  inputError: {
    borderColor: "#ef4444",
  },
  textArea: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    height: 100,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  typeButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f7",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  typeButtonActive: {
    backgroundColor: "#6366f1",
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4f46e5",
    marginTop: 8,
  },
  typeButtonTextActive: {
    color: "#ffffff",
  },
  dateInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateText: {
    fontSize: 16,
    color: "#1f2937",
  },
  privateToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  privateParticipantsSection: {
    marginTop: 16,
  },
  participantInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  participantInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1f2937",
    marginRight: 8,
  },
  addButton: {
    backgroundColor: "#6366f1",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  participantsList: {
    marginTop: 12,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  participantAddress: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    marginRight: 8,
  },
  removeButton: {
    padding: 4,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
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
});
