import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold">این صفحه پیدا نشد</h1>
      <Link className="mt-4 cursor-pointer text-primary" href="/">
        بازگشت به خانه
      </Link>
    </main>
  );
}
