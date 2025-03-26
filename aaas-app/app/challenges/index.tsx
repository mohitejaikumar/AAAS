import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// Temporary mock data for challenges
const MOCK_CHALLENGES = [
  {
    id: '1',
    title: 'Weekly Steps Challenge',
    challenge_type: 'GoogleFit',
    start_time: '2023-06-01T00:00:00Z',
    end_time: '2023-06-07T23:59:59Z',
    total_participants: 42,
    total_votes: 0,
    money_pool: 1000,
    money_per_participant: 10,
    description: 'Walk at least 50,000 steps this week to win a share of the pool.',
  },
  {
    id: '2',
    title: 'Open Source Contribution',
    challenge_type: 'GitHub',
    start_time: '2023-06-01T00:00:00Z',
    end_time: '2023-06-30T23:59:59Z',
    total_participants: 24,
    total_votes: 15,
    money_pool: 2400,
    money_per_participant: 100,
    description: 'Submit at least 3 PRs to open source projects.',
  },
  {
    id: '3',
    title: 'Best UI Design',
    challenge_type: 'Votebased',
    start_time: '2023-06-15T00:00:00Z',
    end_time: '2023-06-22T23:59:59Z',
    total_participants: 18,
    total_votes: 35,
    money_pool: 900,
    money_per_participant: 50,
    description: 'Submit your best UI design for a crypto wallet app.',
  },
  {
    id: '4',
    title: 'Daily Meditation',
    challenge_type: 'GoogleFit',
    start_time: '2023-06-01T00:00:00Z',
    end_time: '2023-06-30T23:59:59Z',
    total_participants: 31,
    total_votes: 0,
    money_pool: 930,
    money_per_participant: 30,
    description: 'Track 20 minutes of meditation daily for 30 days.',
  },
  {
    id: '5',
    title: 'Code Golf Challenge',
    challenge_type: 'GitHub',
    start_time: '2023-06-10T00:00:00Z',
    end_time: '2023-06-17T23:59:59Z',
    total_participants: 12,
    total_votes: 8,
    money_pool: 600,
    money_per_participant: 50,
    description: 'Solve the algorithmic problem with the shortest code possible.',
  },
];

export default function ChallengesScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [challenges, setChallenges] = useState(MOCK_CHALLENGES);
  const router = useRouter();

  const navigateToChallenge = (challengeId: string) => {
    router.push(`/(stack)/challenge-details/${challengeId}`);
  };

  const handleJoinChallenge = (challengeId: string) => {
    router.push(`/(stack)/join-challenge/${challengeId}`);
  };

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'GoogleFit':
        return <Ionicons name="fitness-outline" size={22} color="#4f46e5" />;
      case 'GitHub':
        return <Ionicons name="logo-github" size={22} color="#4f46e5" />;
      case 'Votebased':
        return <Ionicons name="thumbs-up-outline" size={22} color="#4f46e5" />;
      default:
        return <Ionicons name="help-circle-outline" size={22} color="#4f46e5" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderChallengeItem = ({ item }: { item: typeof MOCK_CHALLENGES[0] }) => (
    <TouchableOpacity 
      style={styles.challengeCard}
      onPress={() => navigateToChallenge(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.challengeHeader}>
        <View style={styles.typeContainer}>
          {getChallengeTypeIcon(item.challenge_type)}
          <Text style={styles.challengeType}>{item.challenge_type}</Text>
        </View>
        <TouchableOpacity
          style={styles.joinButton}
          onPress={() => handleJoinChallenge(item.id)}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.challengeTitle}>{item.title}</Text>
      <Text style={styles.challengeDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.challengeDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>
            {formatDate(item.start_time)} - {formatDate(item.end_time)}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={16} color="#6b7280" />
          <Text style={styles.detailText}>{item.total_participants} Participants</Text>
        </View>
        
        {item.challenge_type === 'Votebased' && (
          <View style={styles.detailItem}>
            <Ionicons name="thumbs-up-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{item.total_votes} Votes</Text>
          </View>
        )}
      </View>
      
      <View style={styles.moneyInfo}>
        <Text style={styles.poolAmount}>{item.money_pool} SOL pool</Text>
        <Text style={styles.perParticipantAmount}>{item.money_per_participant} SOL per entry</Text>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={challenges}
        renderItem={renderChallengeItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Active Challenges</Text>
            <Text style={styles.headerSubtitle}>
              Join a challenge to win rewards and showcase your skills
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
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  listContent: {
    padding: 16,
  },
  challengeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4f46e5',
    marginLeft: 6,
  },
  joinButton: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  challengeDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 4,
  },
  moneyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  poolAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  perParticipantAmount: {
    fontSize: 14,
    color: '#6b7280',
  },
}); 