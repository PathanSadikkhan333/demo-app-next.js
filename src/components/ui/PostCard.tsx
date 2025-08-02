
"use client";

import {
  createComment,
  deletePost,
  getPosts,
  toggleLike,
} from "@/actions/post.action";
import { SignInButton, useUser } from "@clerk/nextjs";
import { AwaitedReactNode, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal, useState } from "react";
import toast from "react-hot-toast";
import { Card, CardContent } from "./card";
import { Button } from "./button";
import {
  HeartIcon,
  LogInIcon,
  MessageCircleIcon,
  SendIcon,
} from "lucide-react";
import { Textarea } from "./textarea";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { DeleteAlertDialog } from "./DeleteAlertDialog";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

type Posts = Awaited<ReturnType<typeof getPosts>>;
type Post = Posts[number];

function PostCard({ post, dbUserId }: { post: Post; dbUserId: string | null }) {
  const { user } = useUser();

  const [newComment, setNewComment] = useState("");
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasLiked, setHasLiked] = useState(
    post.like.some((like: { userId: string | null }) => like.userId === dbUserId)
  );
  const [optimisticLikes, setOptimisticLikes] = useState(post._count.like);
  const [showComments, setShowComments] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      // Optimistic UI update
      setHasLiked((prev: any) => !prev);
      setOptimisticLikes((prev: number) => (hasLiked ? prev - 1 : prev + 1));
      await toggleLike(post.id);
    } catch (error: unknown) {
      // Rollback optimistic update on error
      setOptimisticLikes(post._count.like);
      setHasLiked(post.like.some((like: { userId: string | null; }) => like.userId === dbUserId));
      toast.error("Failed to toggle like");
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isCommenting) return;
    try {
      setIsCommenting(true);
      const result = await createComment(post.id, newComment);
      if (result?.success) {
        toast.success("Comment posted successfully");
        setNewComment("");
      } else {
        toast.error(result?.error ?? "Failed to add comment");
      }
    } catch (error: unknown) {
      toast.error("Failed to add comment");
    } finally {
      setIsCommenting(false);
    }
  };

  const handleDeletePost = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      const result = await deletePost(post.id);

      if (result?.success) {
        toast.success("Post deleted successfully");
      } else {
        // Always throw a proper Error object with message
        throw new Error(result?.error ?? "Unknown error during delete");
      }
    } catch (error: unknown) {
      // Defensive: handle if error is null/undefined or non-Error
      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete post due to unknown error";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* Post Header */}
          <div className="flex space-x-3 sm:space-x-4">
            <Link href={`/profile/${post.author.username}`}>
              <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                <AvatarImage src={post.author.image ?? "/avatar.png"} />
              </Avatar>
            </Link>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 truncate">
                  <Link
                    href={`/profile/${post.author.username}`}
                    className="font-semibold truncate"
                  >
                    {post.author.name ?? post.author.username}
                  </Link>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Link href={`/profile/${post.author.username}`}>
                      @{post.author.username}
                    </Link>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(post.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                {dbUserId === post.author.id && (
                  <DeleteAlertDialog
                    isDeleting={isDeleting}
                    onDelete={handleDeletePost}
                  />
                )}
              </div>
              <p className="mt-2 text-sm text-foreground break-words">
                {post.content}
              </p>
            </div>
          </div>

          {/* Post Image */}
          {post.image && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image}
                alt="Post content"
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          {/* Like & Comment Buttons */}
          <div className="flex items-center pt-2 space-x-4">
            {user ? (
              <Button
                variant="ghost"
                size="sm"
                className={`text-muted-foreground gap-2 ${
                  hasLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500"
                }`}
                onClick={handleLike}
                disabled={isLiking}
              >
                <HeartIcon
                  className={`w-5 h-5 ${hasLiked ? "fill-current" : ""}`}
                />
                <span>{optimisticLikes}</span>
              </Button>
            ) : (
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-2"
                >
                  <HeartIcon className="w-5 h-5" />
                  <span>{optimisticLikes}</span>
                </Button>
              </SignInButton>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground gap-2 hover:text-blue-500"
              onClick={() => setShowComments((prev) => !prev)}
            >
              <MessageCircleIcon
                className={`w-5 h-5 ${showComments ? "fill-blue-500 text-blue-500" : ""}`}
              />
              <span>{post.comments.length}</span>
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-4">
                {post.comments.map((comment: { id: Key | null | undefined; author: { image: any; name: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; username: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }; createdAt: string | number | Date; content: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<AwaitedReactNode> | null | undefined; }) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className="w-8 flex-shrink-0 h-8">
                      <AvatarImage src={comment.author.image ?? "/avatar.png"} />
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-sm">{comment.author.name}</span>
                        <span className="text-sm text-muted-foreground">
                          @{comment.author.username}
                        </span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm break-words">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {user ? (
                <div className="flex space-x-3">
                  <Avatar className="w-8 flex-shrink-0 h-8">
                    <AvatarImage src={user?.imageUrl || "/avatar.png"} />
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px] resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        size="sm"
                        onClick={handleAddComment}
                        className="flex items-center gap-2"
                        disabled={!newComment.trim() || isCommenting}
                      >
                        {isCommenting ? (
                          "Posting..."
                        ) : (
                          <>
                            <SendIcon className="w-4 h-4" />
                            Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center p-4 border rounded-lg bg-muted/50">
                  <SignInButton mode="modal">
                    <Button variant="outline" className="gap-2">
                      <LogInIcon className="w-4 h-4" />
                      Sign in to comment
                    </Button>
                  </SignInButton>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PostCard;
