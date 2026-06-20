import { ArrowRight } from "lucide-react";

export function Newsletter() {
  return (
    <section className="bg-grass text-white">
      <div className="container-x py-20 lg:py-24 grid lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Jangan Sampai Kehabisan<br />
            Jersey Favoritmu.
          </h2>
          <p className="mt-4 text-white/85 max-w-xl">
            Dapatkan informasi rilis terbaru, restock, dan promo eksklusif
            langsung ke email Anda.
          </p>
        </div>
        <form
          className="lg:col-span-5"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-md p-2">
            <input
              type="email"
              required
              placeholder="email@anda.com"
              className="flex-1 px-4 py-3 text-foreground placeholder:text-muted-foreground bg-transparent outline-none text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-forest px-6 py-3 text-sm font-bold text-white hover:bg-foreground transition-colors"
            >
              Subscribe <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-3 text-xs text-white/70">
            Dengan subscribe Anda menyetujui kebijakan privasi kami.
          </p>
        </form>
      </div>
    </section>
  );
}
