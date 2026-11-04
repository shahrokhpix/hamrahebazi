import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/infrastructure/prisma";

export default async function ArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article || !article.published) notFound();
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:py-10">
      {article.imagePath ? (
        <Image src={article.imagePath} alt="" width={960} height={640} priority className="h-56 w-full rounded-[1.5rem] border-[3px] border-ink object-cover sm:h-80" />
      ) : null}
      <h1 className="mt-5 text-4xl leading-none sm:text-5xl">{article.title}</h1>
      <p className="mt-3 text-sm leading-7 text-muted">{article.excerpt}</p>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-8">{article.body}</div>
    </main>
  );
}
