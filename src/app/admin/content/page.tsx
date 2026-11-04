import { ContentForm } from "@/components/content-form";
import { copyFields, getSiteContent } from "@/server/content";

export default async function AdminContentPage() {
  const site = await getSiteContent();
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm leading-7 text-muted">
        نام سایت، لوگو، تصویر هیرو، منو، متن خانه، فوتر، بازی‌ها، کافه‌ها، روش بازی و متن ورود از این‌جا عوض می‌شود. تصویر حداکثر ۲ مگابایت و از نوع jpg، png، webp یا gif است.
      </p>
      <ContentForm copy={site.copy} fields={copyFields} logoPath={site.logoPath} heroImage={site.heroImage} howImage={site.howImage} />
    </div>
  );
}

