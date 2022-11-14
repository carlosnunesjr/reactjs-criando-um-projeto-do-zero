import Head from "next/head";
import { GetStaticPaths, GetStaticProps } from "next";
import { useRouter } from "next/router";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RichText } from "prismic-dom";
import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import Header from "../../components/Header";

import { getPrismicClient } from "../../services/prismic";

import commonStyles from "../../styles/common.module.scss";
import styles from "./post.module.scss";

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const totalWords = post.data.content.reduce((total, contentItem) => {
    const textBody = RichText.asText(contentItem.body);
    const words = textBody.split(" ");

    total += words.length;

    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>

      <Header></Header>

      <main className={`${styles.container}, ${commonStyles.maxWidth}`}>
        <img
          src={post.data.banner?.url ?? "/images/Banner.svg"}
          alt="Banner do Post"
        />

        <article className={styles.post}>
          <h1>{post.data.title}</h1>
          <div className={styles.metrics}>
            <span>
              <FiCalendar></FiCalendar>
              <time>
                {format(new Date(post.first_publication_date), "dd MMM yyyy", {
                  locale: ptBR
                })}
              </time>
            </span>
            <span>
              <FiUser></FiUser>
              {post.data.author}
            </span>
            <span>
              <FiClock></FiClock>
              {readTime} min
            </span>
          </div>
          <div className={styles.postContent}>
            {post.data.content.map(postContent => (
              <div key={postContent.heading}>
                <h2>{postContent.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(postContent.body)
                  }}
                />
              </div>
            ))}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType("posts");

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: String(post.uid)
      }
    };
  });

  return {
    paths,
    fallback: "blocking"
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID("posts", String(slug));

  const content = response.data.content.map(contentData => {
    return {
      heading: contentData.heading,
      body: [...contentData.body]
    };
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      subtitle: response.data.subtitle,
      title: response.data.title,
      banner: {
        url: response.data.banner.url
      },
      author: response.data.author,
      content: content
    }
  };

  return {
    props: {
      post
    }
  };
};
