import { GetStaticProps } from "next";
import Head from "next/head";
import { useState } from "react";
import Link from "next/link";

import { format } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { FiCalendar, FiUser } from "react-icons/fi";

import Header from "../components/Header";
import { getPrismicClient } from "../services/prismic";

import commonStyles from "../styles/common.module.scss";
import styles from "./home.module.scss";

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>({ ...postsPagination });

  const loadMoreItens = async () => {
    const response = await fetch(postsPagination.next_page);
    const data = await response.json();

    const postsResponseResults = data.results.map(post => ({
      ...post
    }));

    const newPosts = {
      ...posts,
      next_page: data.next_page,
      results: [...posts.results, ...postsResponseResults]
    };

    setPosts(newPosts);
  };

  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>

      <Header></Header>
      <main className={`${styles.contentContainer}, ${commonStyles.maxWidth}`}>
        <div className={styles.posts}>
          {posts.results.map(post => {
            return (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a key={post.uid}>
                  <strong>{post.data.title}</strong>
                  <p>{post.data.subtitle}</p>
                  <div>
                    <span>
                      <FiCalendar></FiCalendar>
                      <time>
                        {format(
                          new Date(post.first_publication_date),
                          "dd MMM yyyy",
                          {
                            locale: ptBR
                          }
                        )}
                      </time>
                    </span>
                    <span>
                      <FiUser></FiUser>
                      {post.data.author}
                    </span>
                  </div>
                </a>
              </Link>
            );
          })}
        </div>
        {posts.next_page ? (
          <a className={styles.morePosts} onClick={loadMoreItens}>
            Carregar mais posts
          </a>
        ) : null}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType("posts", {
    orderings: [{ field: "document.first_publication_date", direction: "asc" }],
    pageSize: 1,
    page: 1
  });

  const posts = postsResponse.results.map(post => {
    return {
      ...post,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    };
  });

  const postsPagination: PostPagination = {
    next_page: postsResponse.next_page,
    results: posts
  };

  return {
    props: {
      postsPagination
    },
    revalidate: 60 * 60 * 24 //24 horas
  };
};
