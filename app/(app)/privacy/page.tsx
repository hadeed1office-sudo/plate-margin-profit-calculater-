import { PageHeader } from "@/components/ui";

export default function PrivacyPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Kitchen Profit Calculator"
        title="Privacy Policy"
        lede="Your kitchen stays on this device. Kitchen Profit Calculator does not run an account server and does not sell your data."
      />
      <article className="card space-y-4 p-6 text-sm leading-relaxed text-ink-soft">
        <p>This policy describes the copy of Kitchen Profit Calculator you are using in this browser.</p>
        <h2 className="font-sora text-xl text-cream">What stays on this device</h2>
        <p>
          Your name, email, password, kitchen profile, ingredients, recipes, menu, and alerts are saved in this browser’s local storage. They are not uploaded to a Kitchen Profit Calculator server.
        </p>
        <h2 className="font-sora text-xl text-cream">Price files and invoices</h2>
        <p>
          When you upload a rate invoice photo, an Excel file, or a CSV, the file is read in this browser so ingredient prices can be updated. A photo is read on this device to find names and prices. The file is not sent to Kitchen Profit Calculator. Matching names update the existing ingredient. A new name is added once.
        </p>
        <h2 className="font-sora text-xl text-cream">What we do not do</h2>
        <p>Kitchen Profit Calculator does not sell kitchen data, does not use it for advertising, and does not share it with a third party from this app.</p>
        <h2 className="font-sora text-xl text-cream">Removing it</h2>
        <p>Clear this site’s data in your browser settings to remove the kitchen, the account, and the saved prices from this device.</p>
      </article>
    </div>
  );
}
