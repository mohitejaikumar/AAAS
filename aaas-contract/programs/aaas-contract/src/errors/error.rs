use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("User is not in the private group")]
    UnAuthorized,
    #[msg("User has already joined the challenge")]
    AlreadyJoined,
    #[msg("Challenge has already started")]
    ChallengeStarted,
    #[msg("Private group is empty")]
    PrivateGroupEmpty,
    #[msg("Start time is in the past")]
    StartTimeInThePast,
    #[msg("End time is before start time")]
    EndTimeBeforeStartTime,
    #[msg("User did not participate in the challenge")]
    UserDidNotParticipate,
    #[msg("Challenge is not ended")]
    ChallengeNotEnded,
    #[msg("User has not completed the challenge")]
    UserHasNotCompletedTheChallenge,
    #[msg("User has already claimed the challenge")]
    AlreadyClaimed,
    #[msg("Challenge is not yet started")]
    ChallengeNotStarted,
    #[msg("Challenge is ended")]
    ChallengeEnded,
    #[msg("Invalid verification type")]
    InvalidVerificationType,
    #[msg("Challenge is under verification")]
    ChallengeUnderVerification,
    #[msg("Challenge verification time ended")]
    ChallengeVerificationTimeEnded,
    #[msg("Voter is voting for himself")]
    VoterIsVotingForHimself,
    #[msg("Unauthorized owner")]
    UnAuthorizedOwner,
    #[msg("User has already voted")]
    UserHasAlreadyVoted,
}
