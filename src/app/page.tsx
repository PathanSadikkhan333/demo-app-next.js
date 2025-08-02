import CreatePost from "@/components/ui/CreatePost";
import { currentUser } from "@clerk/nextjs/server";
import WhoToFollow from "@/components/ui/WhoToFollow";
import { getPosts } from "@/actions/post.action";
import PostCard from "@/components/ui/PostCard";
import { getDbUserId } from "@/actions/user.action";

export default async function Home() {
  // Get Clerk logged-in user info (null if not logged in)
  const user = await currentUser();

  // Fetch posts (can be public posts)
  const posts = await getPosts();

  // Initialize dbUserId as null for guests
  let dbUserId: string | null = null;

  // Only call getDbUserId if user is logged in to avoid error throw
  if (user) {
    dbUserId = await getDbUserId();
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
      <div className="lg:col-span-6">
        {/* Show CreatePost component only for logged-in users */}
        {user && <CreatePost />}

        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} dbUserId={dbUserId} />
          ))}
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-4 sticky top-20">
        <WhoToFollow />
      </div>
    </div>
  );
}
