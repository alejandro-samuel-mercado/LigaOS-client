/**
 * Publication-related type definitions.
 * Covers team posts, comments, and likes.
 */

export interface PublicationData {
  id: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  teamId: string | null;
  teamName: string | null;
  content: string;
  images: string[];
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  createdAt: string;
}

export interface CommentData {
  id: string;
  publicationId: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  content: string;
  createdAt: string;
}

export interface CreatePublicationRequest {
  content: string;
  teamId?: string;
  images?: string[];
}

export interface CreateCommentRequest {
  content: string;
}
