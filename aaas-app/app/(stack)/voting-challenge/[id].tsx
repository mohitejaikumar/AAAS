import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Define types for our data
type Participant = {
  id: string;
  pubkey: string;
  user_name: string;
  description: string;
  submission_description: string;
};

type Challenge = {
  id: string;
  title: string;
  description: string;
  end_time: string;
  voting_reward: number;
  participants: Participant[];
};

// Mock data for voting on challenges
const VOTABLE_CHALLENGES: Record<string, Challenge> = {
  '1': {
    id: '1',
    title: 'Best UI Design',
    description: 'Vote for the best UI design for a crypto wallet app. Get votes from the community based on creativity, usability, and innovation.',
    end_time: '2023-06-22T23:59:59Z',
    voting_reward: 10,
    participants: [
      { 
        id: '1', 
        pubkey: '7Yu2...fP91', 
        user_name: 'DesignPro', 
        description: 'My design focuses on simplicity and accessibility, with a clean interface that makes crypto transactions intuitive for everyone.',
        submission_description: 'Created a minimalist design with focus on usability and clear information hierarchy. Used a soft color palette for better accessibility.'
      },
      { 
        id: '2', 
        pubkey: '4Gt6...hD37', 
        user_name: 'CreativeGenius', 
        description: 'I believe in beautiful yet functional design. My wallet interface balances aesthetics with ease of use.',
        submission_description: 'Built a feature-rich interface with advanced charts and visualization tools while maintaining an intuitive navigation system.'
      },
      { 
        id: '3', 
        pubkey: '2Zm8...jL65', 
        user_name: 'ArtisticDev', 
        description: 'My background in both development and art helps me create designs that are not only beautiful but also technically sound.',
        submission_description: 'Designed a unique 3D interface with animated transitions and a dark mode that reduces eye strain during night-time usage.'
      },
      { 
        id: '4', 
        pubkey: '9Hn3...kT17', 
        user_name: 'MinimalistDesigner', 
        description: 'Less is more. My design philosophy is all about removing clutter and focusing on what matters.',
        submission_description: 'Created an ultra-minimal interface with gesture-based interactions instead of buttons, and contextual information display.'
      },
    ]
  },
  '2': {
    id: '2',
    title: 'Web3 Portfolio Site Challenge',
    description: 'Select the most impressive web3 developer portfolio site that showcases projects, skills, and contributions to the ecosystem.',
    end_time: '2023-06-30T23:59:59Z',
    voting_reward: 8,
    participants: [
      { 
        id: '1', 
        pubkey: '3Kq7...mV29', 
        user_name: 'WebDevMaster', 
        description: 'Full-stack developer with 5 years of web3 experience.',
        submission_description: 'Created a portfolio that uses smart contracts to verify my contributions to various projects. Includes interactive demos of my dApps.'
      },
      { 
        id: '2', 
        pubkey: '9Lp4...zR83', 
        user_name: 'BlockchainBuilder', 
        description: 'Building the decentralized future one line of code at a time.',
        submission_description: 'My portfolio is itself an NFT collection, where each project is represented as a unique token with on-chain metadata.'
      },
      { 
        id: '3', 
        pubkey: '5Tx6...jN41', 
        user_name: 'CryptoCreator', 
        description: 'Designer and developer focused on creating beautiful and functional dApps.',
        submission_description: 'Developed a gamified portfolio with achievements that unlock as visitors explore my projects and credentials.'
      },
    ]
  }
};

export default function VotingChallengeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [votes, setVotes] = useState<Record<string, 'yes' | 'no' | null>>({});
  const [expandedParticipant, setExpandedParticipant] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const challengeId = typeof id === 'string' ? id : '1';
      const challengeData = VOTABLE_CHALLENGES[challengeId];
      setChallenge(challengeData);
      
      // Initialize votes as null (not voted yet)
      const initialVotes: Record<string, 'yes' | 'no' | null> = {};
      challengeData.participants.forEach((participant: Participant) => {
        initialVotes[participant.id] = null;
      });
      setVotes(initialVotes);
      
      setIsLoading(false);
    }, 500);
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const toggleParticipantExpand = (participantId: string) => {
    if (expandedParticipant === participantId) {
      setExpandedParticipant(null);
    } else {
      setExpandedParticipant(participantId);
    }
  };

  const handleVote = (participantId: string, voteValue: 'yes' | 'no') => {
    setVotes(prev => ({
      ...prev,
      [participantId]: voteValue
    }));
  };

  const hasVotedForAll = () => {
    return Object.values(votes).every(vote => vote !== null);
  };

  const handleSubmitVotes = () => {
    if (!hasVotedForAll()) {
      Alert.alert('Incomplete Voting', 'Please vote for all participants before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    // Mock submission - would connect to Solana in a real app
    setTimeout(() => {
      console.log('Submitting votes:', votes);
      setIsSubmitting(false);
      Alert.alert(
        'Votes Submitted!',
        `You have successfully submitted your votes and earned ${challenge?.voting_reward} SOL.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }, 1500);
  };

  if (isLoading || !challenge) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
          
          <View style={styles.rewardContainer}>
            <Ionicons name="gift-outline" size={20} color="#4f46e5" />
            <Text style={styles.rewardText}>
              {challenge.voting_reward} SOL reward for voting
            </Text>
          </View>
          
          <View style={styles.deadlineContainer}>
            <Ionicons name="time-outline" size={20} color="#6b7280" />
            <Text style={styles.deadlineText}>
              Voting ends: {formatDate(challenge.end_time)}
            </Text>
          </View>
        </View>
        
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Vote on Submissions</Text>
          <Text style={styles.sectionDescription}>
            Review each submission and cast your vote. You must vote on all submissions before submitting.
          </Text>
          
          {challenge.participants.map((participant: Participant) => (
            <View key={participant.id} style={styles.participantCard}>
              <TouchableOpacity 
                style={styles.participantHeader}
                onPress={() => toggleParticipantExpand(participant.id)}
              >
                <View>
                  <Text style={styles.participantName}>{participant.user_name}</Text>
                  <Text style={styles.participantPubkey}>{participant.pubkey}</Text>
                </View>
                <Ionicons 
                  name={expandedParticipant === participant.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#6b7280" 
                />
              </TouchableOpacity>
              
              {expandedParticipant === participant.id && (
                <View style={styles.submissionContainer}>
                  <Text style={styles.aboutHeading}>About</Text>
                  <Text style={styles.aboutText}>{participant.description}</Text>
                  
                  <Text style={styles.submissionHeading}>Submission</Text>
                  <Text style={styles.submissionText}>{participant.submission_description}</Text>
                </View>
              )}
              
              <View style={styles.votingControls}>
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    styles.yesButton,
                    votes[participant.id] === 'yes' && styles.voteButtonSelected
                  ]}
                  onPress={() => handleVote(participant.id, 'yes')}
                >
                  <Ionicons name="thumbs-up" size={18} color={votes[participant.id] === 'yes' ? "#ffffff" : "#059669"} />
                  <Text 
                    style={[
                      styles.voteButtonText, 
                      styles.yesButtonText,
                      votes[participant.id] === 'yes' && styles.voteButtonTextSelected
                    ]}
                  >
                    Yes
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    styles.noButton,
                    votes[participant.id] === 'no' && styles.voteButtonSelected
                  ]}
                  onPress={() => handleVote(participant.id, 'no')}
                >
                  <Ionicons name="thumbs-down" size={18} color={votes[participant.id] === 'no' ? "#ffffff" : "#dc2626"} />
                  <Text 
                    style={[
                      styles.voteButtonText, 
                      styles.noButtonText,
                      votes[participant.id] === 'no' && styles.voteButtonTextSelected
                    ]}
                  >
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton, 
            (!hasVotedForAll() || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleSubmitVotes}
          disabled={!hasVotedForAll() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
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
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 8,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deadlineText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  participantsSection: {
    padding: 16,
    paddingBottom: 100, // Extra padding for submit button
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  participantCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  participantPubkey: {
    fontSize: 14,
    color: '#6b7280',
  },
  submissionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  aboutHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  aboutText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  submissionHeading: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
    marginBottom: 4,
  },
  submissionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  votingControls: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    padding: 12,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
  },
  yesButton: {
    borderColor: '#059669',
    backgroundColor: '#f0fdf4',
  },
  noButton: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  voteButtonSelected: {
    borderWidth: 0,
  },
  yesButtonSelected: {
    backgroundColor: '#059669',
  },
  noButtonSelected: {
    backgroundColor: '#dc2626',
  },
  voteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  yesButtonText: {
    color: '#059669',
  },
  noButtonText: {
    color: '#dc2626',
  },
  voteButtonTextSelected: {
    color: '#ffffff',
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
}); 