import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/infrastructure/prisma";
import { getSiteContent } from "@/server/content";

export default async function BlogPage() {
  const [site, articles] = await Promise.all([
    getSiteContent(),
    prisma.article.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <h1 className="text-4xl leading-none sm:text-5xl">{site.copy.footerBlog}</h1>
      {articles.length === 0 ? (
        <p className="mt-6 rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm">هنوز مقاله‌ای منتشر نشده.</p>
      ) : (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Link href={`/blog/${article.id}`} className="block cursor-pointer overflow-hidden rounded-[1.75rem] border-[3px] border-ink bg-card shadow-[5px_5px_0_#1c2430]">
                {article.imagePath ? (
                  <Image src={article.imagePath} alt="" width={640} height={480} className="h-40 w-full object-cover" />
                ) : (
                  <div className="h-40 bg-sky" />
                )}
                <div className="space-y-2 p-4">
                  <h2 className="text-2xl leading-tight">{article.title}</h2>
                  <p className="text-sm leading-7 text-muted">{article.excerpt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
