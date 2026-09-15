import mongoose, { Schema, Document, Model } from "mongoose";

export interface IParticipantMeta {
  userId: mongoose.Types.ObjectId;
  lastReadAt: Date;
}

export interface ILastMessageSubdoc {
  content: string;
  senderId: mongoose.Types.ObjectId;
  senderPseudonym: string;
  createdAt: Date;
  isDeleted?: boolean;
}

export interface IConversationDocument extends Document {
  participants: mongoose.Types.ObjectId[];
  userA: mongoose.Types.ObjectId;
  userB: mongoose.Types.ObjectId;
  participantMeta: IParticipantMeta[];
  lastMessage?: ILastMessageSubdoc;
  lastMessageAt: Date;
  status: "active" | "blocked";
  createdAt: Date;
  updatedAt: Date;
}

const ParticipantMetaSchema = new Schema<IParticipantMeta>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastReadAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const LastMessageSchema = new Schema<ILastMessageSubdoc>(
  {
    content: {
      type: String,
      maxlength: 1000,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    senderPseudonym: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversationDocument>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    userA: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userB: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participantMeta: {
      type: [ParticipantMetaSchema],
      default: [],
    },
    lastMessage: {
      type: LastMessageSchema,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring pairwise uniqueness between any two students
ConversationSchema.index({ userA: 1, userB: 1 }, { unique: true });

// Query indexes for fast conversation listing and sorting
ConversationSchema.index({ participants: 1, lastMessageAt: -1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });

if (process.env.NODE_ENV !== "production" && mongoose.models.Conversation) {
  delete (mongoose.models as Record<string, unknown>).Conversation;
}

export const Conversation: Model<IConversationDocument> =
  mongoose.models.Conversation ||
  mongoose.model<IConversationDocument>("Conversation", ConversationSchema);
