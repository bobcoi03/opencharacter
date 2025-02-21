export interface Media {
  url: string;
  type: string;
}

export interface Entities {
  hashtags: string[];
  mentionedUsers: string[];
  urls: string[];
}

export interface TweetUser {
  id: string;
  userName: string;
  fullName: string;
  createdAt: string;
  description: string;
  isVerified: boolean;
  likeCount: number;
  followersCount: number;
  followingsCount: number;
  statusesCount: number;
  location?: string;
  profileBanner?: string;
  profileImage: string;
  pinnedTweet?: string;
}

export interface Tweet {
  id: string;
  createdAt: string;
  tweetBy: TweetUser;
  entities: Entities;
  media?: Media[];
  fullText: string;
  lang: string;
  quoteCount: number;
  replyCount: number;
  retweetCount: number;
  likeCount: number;
  viewCount: number;
  bookmarkCount: number;
  retweetedTweet?: Tweet;
  replyTo?: string;
}

export interface TwitterResponse {
  success: boolean;
  tweets: Tweet[];
}
