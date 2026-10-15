import { PageHeader } from "@/components/ui";

export default function TermsPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kitchen Profit Calculator"
        title="Terms & Conditions"
        lede="Kitchen Profit Calculator is a kitchen tool that runs in your browser. You decide which prices and recipes go into it."
      />
      <article className="card space-y-4 p-6 text-sm leading-relaxed text-ink-soft">
        <p>By using Kitchen Profit Calculator you agree to these terms for this local copy of the app.</p>
        <h2 className="font-sora text-xl text-cream">Your kitchen data</h2>
        <p>
          You are responsible for the ingredients, recipes, invoices, and prices you enter or upload. Check a supplier invoice before you rely on a price. Uploaded files update matching ingredients and add new names automatically.
        </p>
        <h2 className="font-sora text-xl text-cream">What the numbers are</h2>
        <p>
          Costs and margins are calculated from the figures in your kitchen. They are a working view for the pass, not accounting advice, tax advice, or a guarantee of profit.
        </p>
        <h2 className="font-sora text-xl text-cream">This device</h2>
        <p>
          The account and the kitchen are stored in this browser. Another computer, or a cleared browser, will not have them. Keep your own copy of anything you need to preserve.
        </p>
        <h2 className="font-sora text-xl text-cream">Acceptable use</h2>
        <p>Use the app for your own kitchen. Do not attempt to break the app or use it to store data you do not have the right to keep.</p>
      </article>
    </div>
  );
}
