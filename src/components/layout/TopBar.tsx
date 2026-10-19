const messages = ["Envío 24/48 h a tu obra", "Facturación inmediata", "Envío a toda la República"];

export function TopBar() {
  return (
    <div className="bg-navy text-[#dce3f5]">
      <div className="mx-auto flex max-w-[1600px] items-center justify-center gap-6 px-6 py-2.5 text-sm font-medium">
        {messages.map((m, i) => (
          <span key={m} className={i > 0 ? "hidden items-center gap-6 sm:flex" : "flex items-center gap-6"}>
            {i > 0 && <span className="size-1.5 rounded-full bg-accent" aria-hidden />}
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
