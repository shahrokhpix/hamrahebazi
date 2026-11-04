import { deleteShopProductAction, fulfillOrderAction, saveShopProductAction } from "@/server/actions";
import { prisma } from "@/infrastructure/prisma";
import { ensureShopCatalog } from "@/server/points";

const kinds = [
  { value: "sticker", label: "استیکر" },
  { value: "notebook", label: "دفتر" },
  { value: "mug", label: "لیوان" },
  { value: "toy", label: "اسباب‌بازی" },
  { value: "other", label: "سایر" },
];

const field = "w-full min-h-12 rounded-2xl border-[3px] border-ink bg-background px-4 text-base";

function ProductFields({
  product,
}: {
  product?: { id: string; name: string; description: string; kind: string; pointCost: number; stock: number; imagePath: string };
}) {
  return (
    <>
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      <label className="block space-y-2 text-sm font-medium">
        نام
        <input name="name" required defaultValue={product?.name} className={field} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        توضیح
        <input name="description" required defaultValue={product?.description} className={field} />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        نوع
        <select name="kind" defaultValue={product?.kind ?? "other"} className={field}>
          {kinds.map((kind) => (
            <option key={kind.value} value={kind.value}>{kind.label}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-2 text-sm font-medium">
          امتیاز
          <input name="pointCost" type="number" min={1} required defaultValue={product?.pointCost ?? 30} dir="ltr" className={field} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          موجودی
          <input name="stock" type="number" min={0} required defaultValue={product?.stock ?? 10} dir="ltr" className={field} />
        </label>
      </div>
      {product?.imagePath ? <img src={product.imagePath} alt="" className="h-28 w-full rounded-2xl border-[3px] border-ink object-cover" /> : null}
      <label className="block space-y-2 text-sm font-medium">
        تصویر
        <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className={field} />
      </label>
    </>
  );
}

export default async function AdminShopPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await ensureShopCatalog();
  const [products, orders] = await Promise.all([
    prisma.shopProduct.findMany({ orderBy: { pointCost: "asc" }, include: { _count: { select: { orders: true } } } }),
    prisma.shopOrder.findMany({ include: { product: true, account: true }, orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const errorText =
    error === "orders" ? "این کالا سفارش دارد و حذف نمی‌شود. موجودی را صفر کنید." : error === "image" ? "تصویر باید jpg، png، webp یا gif و حداکثر ۲ مگابایت باشد." : error === "fields" ? "نام، توضیح، امتیاز و موجودی را کامل کنید." : "";

  return (
    <main className="space-y-6">
      <section className="rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
        <h2 className="mb-4 font-display text-3xl">کالای تازه</h2>
        {errorText ? <p className="mb-3 rounded-2xl border-[3px] border-ink bg-coral px-4 py-3 text-sm">{errorText}</p> : null}
        <form action={saveShopProductAction} className="space-y-3">
          <ProductFields />
          <button className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-[3px] border-ink bg-sun px-4 font-semibold" type="submit">
            افزودن کالا
          </button>
        </form>
      </section>
      <ul className="space-y-4">
        {products.map((product) => (
          <li key={product.id} className="rounded-[1.5rem] border-[3px] border-ink bg-card p-5 shadow-[4px_4px_0_#1c2430]">
            <form action={saveShopProductAction} className="space-y-3">
              <ProductFields product={product} />
              <button className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-[3px] border-ink bg-leaf px-4 font-semibold" type="submit">
                ذخیره تغییرات
              </button>
            </form>
            <form action={deleteShopProductAction} className="mt-3">
              <input type="hidden" name="productId" value={product.id} />
              <button className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-[3px] border-ink bg-coral px-4 font-semibold" type="submit">
                حذف کالا{product._count.orders > 0 ? " (سفارش دارد)" : ""}
              </button>
            </form>
          </li>
        ))}
      </ul>
      <h2 className="font-display text-3xl">سفارش‌ها</h2>
      {orders.length === 0 ? (
        <p className="rounded-[1.5rem] border-[3px] border-ink bg-card p-6 text-sm shadow-[4px_4px_0_#1c2430]">هنوز سفارشی ثبت نشده است.</p>
      ) : (
        orders.map((order) => (
          <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border-[3px] border-ink bg-card p-4 shadow-[4px_4px_0_#1c2430]">
            <div>
              <h3 className="font-display text-2xl">{order.product.name}</h3>
              <p className="text-sm" dir="ltr">{order.account.phone}</p>
              <p className="text-sm">{order.points.toLocaleString("fa-IR")} امتیاز · {order.status === "sent" ? "فرستاده شد" : "در انتظار ارسال"}</p>
            </div>
            {order.status === "placed" ? (
              <form action={fulfillOrderAction}>
                <input type="hidden" name="orderId" value={order.id} />
                <button className="inline-flex min-h-12 cursor-pointer items-center rounded-full border-[3px] border-ink bg-leaf px-4 font-semibold" type="submit">
                  ارسال شد
                </button>
              </form>
            ) : null}
          </article>
        ))
      )}
    </main>
  );
}
