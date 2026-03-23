export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  url?: string;
  imageUrl?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  branch?: string;
  year?: string;
  skills?: string[];
  bio?: string;
  github?: string;
  portfolio?: string;
  linkedin?: string;
  createdAt?: string;
  experiences?: Experience[];
  portfolioItems?: PortfolioItem[];
  followersCount?: number;
  followingCount?: number;
  isGuest?: boolean;
  role?: 'admin' | 'student';
  isVerified?: boolean;
  savedProjects?: string[];
  savedResources?: string[];
}

export interface WallQuestion {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  type: 'doubt' | 'resource_request';
  createdAt: string;
  answerCount: number;
}

export interface WallAnswer {
  id: string;
  questionId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  text: string;
  createdAt: string;
}

export interface AppStats {
  totalStudents: number;
  totalProjects: number;
  totalResources: number;
}

export interface Project {
  id: string;
  ownerUid: string;
  ownerName: string;
  title: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
  tags: string[];
  createdAt: string;
}

export interface Resource {
  id: string;
  ownerUid: string;
  ownerName: string;
  title: string;
  description?: string;
  type: 'link' | 'roadmap' | 'pdf' | 'other';
  url: string;
  tags: string[];
  createdAt: string;
}

export interface Follow {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt: string;
  isGroup?: boolean;
  name?: string;
  groupImage?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string;
  senderPhoto?: string;
  text: string;
  createdAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  ownerUid: string;
  members: string[];
  requiredSkills: string[];
  createdAt: string;
  chatId?: string;
}

export interface TeamRequest {
  id: string;
  teamId: string;
  teamName: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  type: 'follow' | 'team_invite' | 'message' | 'team_accepted';
  title: string;
  message: string;
  link?: string;
  relatedId?: string;
  read: boolean;
  createdAt: string;
}
