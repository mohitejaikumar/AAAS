import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock data for challenge details and participants
const MOCK_CHALLENGES = {
  '1': {
    id: '1',
    title: 'Weekly Steps Challenge',
    description: 'Walk at least 50,000 steps this week to win a share of the pool. The more steps you take, the higher your ranking!',
    challenge_type: 'GoogleFit',
    start_time: '2023-06-01T00:00:00Z',
    end_time: '2023-06-07T23:59:59Z',
    total_participants: 42,
    total_votes: 0,
    money_pool: 1000,
    money_per_participant: 10,
    participants: [
      { id: '1', pubkey: '8Fy7...hP42', user_name: 'StepMaster', current_steps: 45200, description: 'Walking enthusiast from California' },
      { id: '2', pubkey: '3Zx9...mR75', user_name: 'FitQueen', current_steps: 38500, description: 'Fitness instructor and marathon runner' },
      { id: '3', pubkey: '7Jw4...pT63', user_name: 'WalkingDude', current_steps: 36700, description: 'Just a guy who likes to walk' },
      { id: '4', pubkey: '2Ab5...kL98', user_name: 'HealthNut', current_steps: 32100, description: 'Health and wellness advocate' },
      { id: '5', pubkey: '9Cd7...qR24', user_name: 'StepCounter', current_steps: 28900, description: 'Tech enthusiast tracking every step' },
    ]
  },
  '2': {
    id: '2',
    title: 'Open Source Contribution',
    description: 'Submit at least 3 PRs to open source projects. The community will judge the quality and impact of your contributions.',
    challenge_type: 'GitHub',
    start_time: '2023-06-01T00:00:00Z',
    end_time: '2023-06-30T23:59:59Z',
    total_participants: 24,
    total_votes: 15,
    money_pool: 2400,
    money_per_participant: 100,
    participants: [
      { id: '1', pubkey: '5Rt7...bV32', user_name: 'CodeWizard', prs_completed: 4, votes: { positive: 12, negative: 2 }, description: 'Full stack developer passionate about open source' },
      { id: '2', pubkey: '1Qs2...mN87', user_name: 'BugHunter', prs_completed: 3, votes: { positive: 8, negative: 1 }, description: 'Finding and fixing bugs is my superpower' },
      { id: '3', pubkey: '9Wx4...cZ16', user_name: 'DocMaster', prs_completed: 5, votes: { positive: 7, negative: 0 }, description: 'Making documentation better one PR at a time' },
      { id: '4', pubkey: '3Ef8...jK54', user_name: 'FeatureDev', prs_completed: 2, votes: { positive: 4, negative: 3 }, description: 'Building cool new features for open source projects' },
    ]
  },
  '3': {
    id: '3',
    title: 'Best UI Design',
    description: 'Submit your best UI design for a crypto wallet app. Get votes from the community based on creativity, usability, and innovation.',
    challenge_type: 'Votebased',
    start_time: '2023-06-15T00:00:00Z',
    end_time: '2023-06-22T23:59:59Z',
    total_participants: 18,
    total_votes: 35,
    money_pool: 900,
    money_per_participant: 50,
    participants: [
      { id: '1', pubkey: '7Yu2...fP91', user_name: 'DesignPro', votes: { positive: 15, negative: 3 }, description: 'UI/UX designer with 5+ years experience' },
      { id: '2', pubkey: '4Gt6...hD37', user_name: 'CreativeGenius', votes: { positive: 12, negative: 2 }, description: 'Turning complex problems into beautiful interfaces' },
      { id: '3', pubkey: '2Zm8...jL65', user_name: 'ArtisticDev', votes: { positive: 8, negative: 5 }, description: 'Developer with a passion for beautiful design' },
      { id: '4', pubkey: '9Hn3...kT17', user_name: 'MinimalistDesigner', votes: { positive: 7, negative: 1 }, description: 'Less is more. Simplicity is the ultimate sophistication.' },
      { id: '5', pubkey: '1Vb5...qP83', user_name: 'ColorMaster', votes: { positive: 5, negative: 3 }, description: 'Expert in color theory and accessibility' },
    ]
  }
};

export default function ChallengeDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [challenge, setChallenge] = useState<any>(null);

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setChallenge(MOCK_CHALLENGES[id as string]);
      setIsLoading(false);
    }, 500);
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderParticipantItem = ({ item }: { item: any }) => {
    if (challenge.challenge_type === 'GoogleFit') {
      return (
        <View style={styles.participantItem}>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.user_name}</Text>
            <Text style={styles.participantPubkey}>{item.pubkey}</Text>
            <Text style={styles.participantDescription}>{item.description}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusValue}>{item.current_steps.toLocaleString()}</Text>
            <Text style={styles.statusLabel}>steps</Text>
          </View>
        </View>
      );
    } else if (challenge.challenge_type === 'GitHub') {
      return (
        <View style={styles.participantItem}>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.user_name}</Text>
            <Text style={styles.participantPubkey}>{item.pubkey}</Text>
            <Text style={styles.participantDescription}>{item.description}</Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusValue}>{item.prs_completed}</Text>
            <Text style={styles.statusLabel}>PRs</Text>
            
            <View style={styles.votesRow}>
              <View style={styles.voteItem}>
                <Ionicons name="thumbs-up" size={14} color="#059669" />
                <Text style={[styles.voteCount, { color: '#059669' }]}>{item.votes.positive}</Text>
              </View>
              <View style={styles.voteItem}>
                <Ionicons name="thumbs-down" size={14} color="#dc2626" />
                <Text style={[styles.voteCount, { color: '#dc2626' }]}>{item.votes.negative}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    } else { // Votebased
      return (
        <View style={styles.participantItem}>
          <View style={styles.participantInfo}>
            <Text style={styles.participantName}>{item.user_name}</Text>
            <Text style={styles.participantPubkey}>{item.pubkey}</Text>
            <Text style={styles.participantDescription}>{item.description}</Text>
          </View>
          <View style={styles.statusContainer}>
            <View style={styles.votesRow}>
              <View style={styles.voteItem}>
                <Ionicons name="thumbs-up" size={16} color="#059669" />
                <Text style={[styles.voteCount, { color: '#059669' }]}>{item.votes.positive}</Text>
              </View>
              <View style={styles.voteItem}>
                <Ionicons name="thumbs-down" size={16} color="#dc2626" />
                <Text style={[styles.voteCount, { color: '#dc2626' }]}>{item.votes.negative}</Text>
              </View>
            </View>
            <Text style={styles.scoreText}>
              Score: {item.votes.positive - item.votes.negative}
            </Text>
          </View>
        </View>
      );
    }
  };

  const sortParticipants = (participants: any[]) => {
    if (challenge.challenge_type === 'GoogleFit') {
      return [...participants].sort((a, b) => b.current_steps - a.current_steps);
    } else if (challenge.challenge_type === 'GitHub') {
      return [...participants].sort((a, b) => {
        const scoreA = a.prs_completed * 10 + (a.votes.positive - a.votes.negative);
        const scoreB = b.prs_completed * 10 + (b.votes.positive - b.votes.negative);
        return scoreB - scoreA;
      });
    } else { // Votebased
      return [...participants].sort((a, b) => {
        return (b.votes.positive - b.votes.negative) - (a.votes.positive - a.votes.negative);
      });
    }
  };

  if (isLoading || !challenge) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  const sortedParticipants = sortParticipants(challenge.participants);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.challengeTypeContainer}>
            {challenge.challenge_type === 'GoogleFit' && (
              <Ionicons name="fitness-outline" size={22} color="#4f46e5" />
            )}
            {challenge.challenge_type === 'GitHub' && (
              <Ionicons name="logo-github" size={22} color="#4f46e5" />
            )}
            {challenge.challenge_type === 'Votebased' && (
              <Ionicons name="thumbs-up-outline" size={22} color="#4f46e5" />
            )}
            <Text style={styles.challengeType}>{challenge.challenge_type}</Text>
          </View>
          
          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>
          
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Ionicons name="calendar-outline" size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {formatDate(challenge.start_time)} - {formatDate(challenge.end_time)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {challenge.total_participants} Participants
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={18} color="#6b7280" />
              <Text style={styles.detailText}>
                {challenge.money_pool} SOL Pool ({challenge.money_per_participant} SOL per participant)
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.participantsSection}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          
          <FlatList
            data={sortedParticipants}
            renderItem={renderParticipantItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.participantsList}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </ScrollView>
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  challengeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#4b5563',
    lineHeight: 22,
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  participantsSection: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  participantsList: {
    
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  participantInfo: {
    flex: 3,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  participantPubkey: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  participantDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  statusContainer: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'right',
  },
  statusLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'right',
  },
  votesRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  voteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
}); 