/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/aaas_contract.json`.
 */
export type AaasContract = {
  address: "2qZ14Js1pzXRRDC2CWLYeRCNx7Lge6sEzFmoRSsZz1Cj";
  metadata: {
    name: "aaasContract";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "claimChallenge";
      discriminator: [132, 167, 9, 45, 203, 244, 30, 171];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "challengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "challengeId";
              }
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "treasuryAccount";
          writable: true;
        },
        {
          name: "userAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 97, 99, 99, 111, 117, 110, 116];
              },
              {
                kind: "account";
                path: "signer";
              }
            ];
          };
        },
        {
          name: "userChallengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "account";
                path: "challengeAccount";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        }
      ];
      args: [
        {
          name: "challengeId";
          type: "u64";
        }
      ];
    },
    {
      name: "initialize";
      discriminator: [175, 175, 109, 31, 13, 152, 155, 237];
      accounts: [
        {
          name: "state";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  95,
                  111,
                  119,
                  110,
                  101,
                  114
                ];
              }
            ];
          };
        },
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "initializeChallenge";
      discriminator: [131, 92, 76, 227, 13, 71, 164, 243];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "challengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "challengeId";
              }
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "treasuryAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  116,
                  114,
                  101,
                  97,
                  115,
                  117,
                  114,
                  121,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "challengeId";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        }
      ];
      args: [
        {
          name: "challengeId";
          type: "u64";
        },
        {
          name: "challengeType";
          type: {
            defined: {
              name: "challengeType";
            };
          };
        },
        {
          name: "challengeName";
          type: "string";
        },
        {
          name: "challengeDescription";
          type: "string";
        },
        {
          name: "startTime";
          type: "i64";
        },
        {
          name: "endTime";
          type: "i64";
        },
        {
          name: "moneyPerParticipant";
          type: "u64";
        },
        {
          name: "isPrivate";
          type: "bool";
        },
        {
          name: "privateGroup";
          type: {
            vec: "pubkey";
          };
        }
      ];
    },
    {
      name: "joinChallenge";
      discriminator: [41, 104, 214, 73, 32, 168, 76, 79];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "challengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "challengeId";
              }
            ];
          };
        },
        {
          name: "mint";
        },
        {
          name: "treasuryAccount";
          writable: true;
        },
        {
          name: "userTokenAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "account";
                path: "tokenProgram";
              },
              {
                kind: "account";
                path: "mint";
              }
            ];
            program: {
              kind: "const";
              value: [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ];
            };
          };
        },
        {
          name: "userAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [117, 115, 101, 114, 95, 97, 99, 99, 111, 117, 110, 116];
              },
              {
                kind: "account";
                path: "signer";
              }
            ];
          };
        },
        {
          name: "userChallengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "account";
                path: "challengeAccount";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        },
        {
          name: "tokenProgram";
        }
      ];
      args: [
        {
          name: "challengeId";
          type: "u64";
        },
        {
          name: "userName";
          type: "string";
        },
        {
          name: "description";
          type: "string";
        }
      ];
    },
    {
      name: "updateChallengeStatus";
      discriminator: [193, 81, 19, 183, 19, 104, 28, 125];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "state";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  112,
                  114,
                  111,
                  103,
                  114,
                  97,
                  109,
                  95,
                  111,
                  119,
                  110,
                  101,
                  114
                ];
              }
            ];
          };
        },
        {
          name: "challengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "challengeId";
              }
            ];
          };
        },
        {
          name: "userChallengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "userAddress";
              },
              {
                kind: "account";
                path: "challengeAccount";
              }
            ];
          };
        }
      ];
      args: [
        {
          name: "challengeId";
          type: "u64";
        },
        {
          name: "userAddress";
          type: "pubkey";
        },
        {
          name: "challengeVerification";
          type: {
            defined: {
              name: "challengeVerification";
            };
          };
        }
      ];
    },
    {
      name: "voteForVoteBasedChallenge";
      discriminator: [175, 201, 246, 165, 25, 22, 42, 199];
      accounts: [
        {
          name: "signer";
          writable: true;
          signer: true;
        },
        {
          name: "challengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "challengeId";
              }
            ];
          };
        },
        {
          name: "userChallengeAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [
                  117,
                  115,
                  101,
                  114,
                  95,
                  99,
                  104,
                  97,
                  108,
                  108,
                  101,
                  110,
                  103,
                  101,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ];
              },
              {
                kind: "arg";
                path: "userAddress";
              },
              {
                kind: "account";
                path: "challengeAccount";
              }
            ];
          };
        },
        {
          name: "voteAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [118, 111, 116, 101, 95, 97, 99, 99, 111, 117, 110, 116];
              },
              {
                kind: "account";
                path: "challengeAccount";
              },
              {
                kind: "account";
                path: "signer";
              },
              {
                kind: "arg";
                path: "userAddress";
              }
            ];
          };
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "challengeId";
          type: "u64";
        },
        {
          name: "userAddress";
          type: "pubkey";
        },
        {
          name: "challengeVerification";
          type: {
            defined: {
              name: "challengeVerificationType";
            };
          };
        }
      ];
    }
  ];
  accounts: [
    {
      name: "challengeAccount";
      discriminator: [96, 128, 44, 165, 71, 172, 60, 12];
    },
    {
      name: "programState";
      discriminator: [77, 209, 137, 229, 149, 67, 167, 230];
    },
    {
      name: "userAccount";
      discriminator: [211, 33, 136, 16, 186, 110, 242, 127];
    },
    {
      name: "userChallengeAccount";
      discriminator: [193, 251, 15, 111, 189, 96, 238, 190];
    },
    {
      name: "voteAccount";
      discriminator: [203, 238, 154, 106, 200, 131, 0, 41];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "unAuthorized";
      msg: "User is not in the private group";
    },
    {
      code: 6001;
      name: "alreadyJoined";
      msg: "User has already joined the challenge";
    },
    {
      code: 6002;
      name: "challengeStarted";
      msg: "Challenge has already started";
    },
    {
      code: 6003;
      name: "privateGroupEmpty";
      msg: "Private group is empty";
    },
    {
      code: 6004;
      name: "startTimeInThePast";
      msg: "Start time is in the past";
    },
    {
      code: 6005;
      name: "endTimeBeforeStartTime";
      msg: "End time is before start time";
    },
    {
      code: 6006;
      name: "userDidNotParticipate";
      msg: "User did not participate in the challenge";
    },
    {
      code: 6007;
      name: "challengeNotEnded";
      msg: "Challenge is not ended";
    },
    {
      code: 6008;
      name: "userHasNotCompletedTheChallenge";
      msg: "User has not completed the challenge";
    },
    {
      code: 6009;
      name: "alreadyClaimed";
      msg: "User has already claimed the challenge";
    },
    {
      code: 6010;
      name: "challengeNotStarted";
      msg: "Challenge is not yet started";
    },
    {
      code: 6011;
      name: "challengeEnded";
      msg: "Challenge is ended";
    },
    {
      code: 6012;
      name: "invalidVerificationType";
      msg: "Invalid verification type";
    },
    {
      code: 6013;
      name: "challengeUnderVerification";
      msg: "Challenge is under verification";
    },
    {
      code: 6014;
      name: "challengeVerificationTimeEnded";
      msg: "Challenge verification time ended";
    },
    {
      code: 6015;
      name: "voterIsVotingForHimself";
      msg: "Voter is voting for himself";
    },
    {
      code: 6016;
      name: "unAuthorizedOwner";
      msg: "Unauthorized owner";
    },
    {
      code: 6017;
      name: "userHasAlreadyVoted";
      msg: "User has already voted";
    }
  ];
  types: [
    {
      name: "challengeAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "challengeId";
            type: "u64";
          },
          {
            name: "challengeInformation";
            type: {
              defined: {
                name: "challengeInformation";
              };
            };
          },
          {
            name: "startTime";
            type: "i64";
          },
          {
            name: "endTime";
            type: "i64";
          },
          {
            name: "totalParticipants";
            type: "u64";
          },
          {
            name: "totalVotes";
            type: "u64";
          },
          {
            name: "moneyPool";
            type: "u64";
          },
          {
            name: "moneyPerParticipant";
            type: "u64";
          },
          {
            name: "treasuryAccount";
            type: "pubkey";
          },
          {
            name: "treasuryBump";
            type: "u8";
          },
          {
            name: "isPrivate";
            type: "bool";
          },
          {
            name: "privateGroup";
            type: {
              vec: "pubkey";
            };
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "challengeInformation";
      type: {
        kind: "struct";
        fields: [
          {
            name: "challengeType";
            type: {
              defined: {
                name: "challengeType";
              };
            };
          },
          {
            name: "challengeName";
            type: "string";
          },
          {
            name: "challengeDescription";
            type: "string";
          }
        ];
      };
    },
    {
      name: "challengeType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "googleFit";
            fields: [
              {
                name: "steps";
                type: "u64";
              }
            ];
          },
          {
            name: "github";
            fields: [
              {
                name: "commits";
                type: "u64";
              }
            ];
          },
          {
            name: "voteBased";
          }
        ];
      };
    },
    {
      name: "challengeVerification";
      type: {
        kind: "struct";
        fields: [
          {
            name: "challengeType";
            type: {
              defined: {
                name: "challengeVerificationType";
              };
            };
          }
        ];
      };
    },
    {
      name: "challengeVerificationType";
      type: {
        kind: "enum";
        variants: [
          {
            name: "monitored";
            fields: [
              {
                name: "score";
                type: "u64";
              },
              {
                name: "isCompleted";
                type: "bool";
              }
            ];
          },
          {
            name: "voteBased";
            fields: [
              {
                name: "isCompleted";
                type: "bool";
              }
            ];
          }
        ];
      };
    },
    {
      name: "programState";
      type: {
        kind: "struct";
        fields: [
          {
            name: "owner";
            type: "pubkey";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "userAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "userName";
            type: "string";
          },
          {
            name: "userAddress";
            type: "pubkey";
          },
          {
            name: "totalParticipations";
            type: "u64";
          },
          {
            name: "totalMoneyDeposited";
            type: "u64";
          },
          {
            name: "totalMoneyWithdrawn";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "userChallengeAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "challengeAddress";
            type: "pubkey";
          },
          {
            name: "description";
            type: "string";
          },
          {
            name: "userAddress";
            type: "pubkey";
          },
          {
            name: "isJoined";
            type: "bool";
          },
          {
            name: "moneyDeposited";
            type: "u64";
          },
          {
            name: "isChallengeCompleted";
            type: "bool";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "score";
            type: "u64";
          },
          {
            name: "voteInPositive";
            type: "u64";
          },
          {
            name: "voteInNegative";
            type: "u64";
          }
        ];
      };
    },
    {
      name: "voteAccount";
      type: {
        kind: "struct";
        fields: [
          {
            name: "challengeAddress";
            type: "pubkey";
          },
          {
            name: "userAddress";
            type: "pubkey";
          },
          {
            name: "isVoted";
            type: "bool";
          },
          {
            name: "isCompleted";
            type: "bool";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "voterAddress";
            type: "pubkey";
          }
        ];
      };
    }
  ];
};
