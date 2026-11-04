import type { Metadata } from "next";
import { Lalezar, Rubik } from "next/font/google";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { Toaster } from "@/components/toaster";
import { currentAccount } from "@/server/auth";
import { getSiteContent } from "@/server/content";
import { getIntegration } from "@/server/integrations";
import "./globals.css";

const body = Rubik({
  subsets: ["arabic", "latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Lalezar({
  subsets: ["arabic", "latin"],
  weight: "400",
  variable: "--font-lalezar",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteContent();
  return { title: site.copy.brandName, description: site.copy.metaDescription };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [account, site, integration] = await Promise.all([currentAccount(), getSiteContent(), getIntegration()]);
  const labels = {
    login: site.copy.loginLabel,
    myGames: site.copy.myGamesLabel,
    profile: site.copy.profileLabel,
    home: site.copy.navHome,
    games: site.copy.navGames,
    cafes: site.copy.navCafes,
    how: site.copy.navHow,
    host: site.copy.navHost,
    organizer: site.copy.navOrganizer,
    admin: site.copy.navAdmin,
  };
  return (
    <html lang="fa" dir="rtl" className={`${body.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <SiteHeader
          account={account ? { role: account.role, host: Boolean(account.host), organizer: Boolean(account.organizer) } : null}
          brandName={site.copy.brandName}
          logoPath={site.logoPath}
          labels={labels}
        />
        <Toaster />
        <div className="flex-1">{children}</div>
        <SiteFooter
          brandName={site.copy.brandName}
          blurb={site.copy.footerBlurb}
          note={site.copy.footerNote}
          games={site.copy.footerGames}
          cafes={site.copy.footerCafes}
          how={site.copy.footerHow}
          about={site.copy.footerAbout}
          contact={site.copy.footerContact}
          blog={site.copy.footerBlog}
          services={site.copy.footerServices}
          terms={site.copy.footerTerms}
          enamadImage={integration.enamadImage}
          enamadLink={integration.enamadLink}
        />
      </body>
    </html>
  );
}
