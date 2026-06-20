import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementBar } from "@/components/landing/AnnouncementBar";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { FeaturedCategories } from "@/components/landing/FeaturedCategories";
import { WhyChoose } from "@/components/landing/WhyChoose";
import { FeaturedProducts } from "@/components/landing/FeaturedProducts";
import { BestSeller } from "@/components/landing/BestSeller";
import { NewArrival } from "@/components/landing/NewArrival";
import { VintageHighlight } from "@/components/landing/VintageHighlight";
import { AuthenticityTimeline } from "@/components/landing/AuthenticityTimeline";
import { Reviews } from "@/components/landing/Reviews";
import { Faq } from "@/components/landing/Faq";
import { Newsletter } from "@/components/landing/Newsletter";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const title = "Sudut Gawang — Jersey Sepak Bola Original";
const description =
  "Toko jersey sepak bola original: koleksi klub, tim nasional, dan vintage dengan dokumentasi lengkap dan pengiriman ke seluruh Indonesia.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: "/" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Sudut Gawang",
          description,
          url: "/",
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <FeaturedCategories />
        <WhyChoose />
        <FeaturedProducts />
        <BestSeller />
        <NewArrival />
        <VintageHighlight />
        <AuthenticityTimeline />
        <Reviews />
        <Faq />
        <Newsletter />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
