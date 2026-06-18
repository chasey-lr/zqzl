export interface User {
  _id: string;
  email: string;
  nickname: string;
  avatar: string;
}

export interface PollOption {
  _id?: string;
  text: string;
  votes: number;
  color: string;
}

export interface VoteRecord {
  userId: string | null;
  optionIndex: number;
  votedAt: string;
  user?: User;
}

export interface Poll {
  _id: string;
  title: string;
  description: string;
  options: PollOption[];
  type: 'public' | 'private';
  invitedEmails: string[];
  creator: User | string;
  deadline: string;
  isEnded: boolean;
  status: 'active' | 'ended';
  voteRecords: VoteRecord[];
  userVote: VoteRecord | null;
  totalVotes: number;
  createdAt: string;
}

export interface Comment {
  _id: string;
  pollId: string;
  userId: string;
  user?: User;
  content: string;
  likes: number;
  likedBy: string[];
  isLiked: boolean;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface PollListResponse {
  polls: Poll[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface CommentListResponse {
  comments: Comment[];
  total: number;
  page: number;
  pages: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nickname?: string;
}

export interface CreatePollData {
  title: string;
  description?: string;
  options: string[];
  type: 'public' | 'private';
  invitedEmails?: string[];
  deadline?: string;
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  options?: string[];
}
