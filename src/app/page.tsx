//import  CreatePost from "@/components/ui/CreatePost";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
 const user=await currentUser();

  return ( 

<div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
  <div className="lg:col-span-6">
// {user ? <CreatePost/> :null }   //if user is authenticated the createpost will be opened
  </div>

  <div className="hidden lg:block lg:col-span-4 sticky top-20">
       whotofollow
   </div>
  </div>
);
}
