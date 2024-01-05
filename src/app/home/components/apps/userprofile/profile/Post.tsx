import Grid from "@mui/material/Grid";
import { useEffect } from "react";

import PostItem from "./PostItem";
import { PostTextBox } from "./PostTextBox";
import { PostType } from "../../../../types/apps/userProfile";

const Post = () => {
  const getPosts = [] as PostType[];

  return (
    <Grid container spacing={3}>
      <Grid item sm={12}>
        <PostTextBox />
      </Grid>
      {getPosts.map((posts) => {
        return (
          <Grid item sm={12} key={posts.id}>
            <PostItem post={posts} />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default Post;
