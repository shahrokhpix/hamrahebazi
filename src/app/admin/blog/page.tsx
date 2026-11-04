import { ArticleForm } from "@/components/article-form";
import { deleteArticleAction } from "@/server/actions";
import { prisma } from "@/infrastructure/prisma";

export default async function AdminBlogPage() {
  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-7 text-muted">مقاله با عکس منتشر می‌شود و در بلاگ دیده می‌شود. عکس اختیاری است و حداکثر ۲ مگابایت.</p>
      <ArticleForm />
      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border-[3px] border-ink bg-card p-4">
            <div>
              <p className="font-display text-2xl">{article.title}</p>
              <p className="text-sm text-muted">{article.published ? "منتشر شده" : "پیش‌نویس"} {article.imagePath ? "· با عکس" : "· بدون عکس"}</p>
            </div>
            <form action={deleteArticleAction}>
              <input type="hidden" name="id" value={article.id} />
              <button className="inline-flex min-h-11 cursor-pointer items-center rounded-full border-[3px] border-ink bg-coral px-4 text-sm font-semibold" type="submit">
                حذف
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
