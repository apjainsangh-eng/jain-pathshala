import Link from 'next/link';

// Privacy policy and account deletion (linked from the Google Play listing). Keep it in step with what
// the app really stores: lib/server/controllers/profileController.js PROFILE_FIELDS, attendance, gatha,
// Niyam Yatra, Telegram notifications.

export const metadata = {
  title: 'Privacy policy · Jain Pathshala',
  description: 'What the Jain Pathshala app stores, why, and how to delete your account.',
};

const CONTACT_EMAIL = 'mehtamoksh.mm@gmail.com';
const UPDATED = '6 November 2026';

function Section({ id, title, children }) {
  return (
    <section id={id} className="mt-7 scroll-mt-4">
      <h2 className="font-display text-xl font-bold text-kumkum-800">{title}</h2>
      <div className="mt-2 space-y-2 text-gray-800 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-chandan-100 px-4 py-8">
      <article className="mx-auto max-w-2xl bg-white rounded-3xl shadow-temple border border-sona-300/70 p-6 sm:p-8">
        <h1 className="font-display text-3xl font-bold text-kumkum-900">Privacy policy</h1>
        <p className="mt-1 text-sm text-gray-500">Jain Pathshala website and Android app · updated {UPDATED}</p>
        <p className="mt-4 text-gray-800 leading-relaxed">
          Jain Pathshala helps Jain pathshalas record attendance, gatha (scripture) progress and the daily
          Niyam Yatra of their students and families. Each pathshala&apos;s admins manage their own students.
          This page explains what is stored and how to remove it.
        </p>
        <p className="mt-2 text-gray-700 leading-relaxed font-medium">
          ટૂંકમાં: તમારી માહિતી ફક્ત તમારી પાઠશાળાના કામ માટે છે. અમે તે વેચતા નથી, જાહેરાત માટે વાપરતા નથી.
          એકાઉન્ટ કાઢી નાખવા તમારી પાઠશાળાના એડમિનને કહો અથવા નીચેના ઇમેઇલ પર લખો.
        </p>

        <Section title="What we store">
          <ul className="list-disc pl-5 space-y-1">
            <li><b>Login:</b> mobile number and password.</li>
            <li><b>Student details</b> entered by the student, family or pathshala admin: name, date of birth,
              gender, email, WhatsApp number, address, school / college or work, and dharmic study details.</li>
            <li><b>Pathshala activity:</b> attendance, gatha progress, points, achievements and leaderboard positions.</li>
            <li><b>Niyam Yatra:</b> the daily niyams (religious practices) a member records, and the points earned.</li>
            <li><b>Admins:</b> name, mobile number and the pathshalas they manage.</li>
          </ul>
          <p>The app does not use your location, contacts, camera, microphone or photos, and shows no ads.</p>
        </Section>

        <Section title="Why we use it">
          <p>
            Only to run the pathshala: showing students and families their own records, letting admins approve
            attendance and gatha, calculating points and leaderboards, and sending admins a Telegram message when
            a request is waiting for approval (the message contains the student&apos;s name and the request).
          </p>
        </Section>

        <Section title="Who can see it">
          <ul className="list-disc pl-5 space-y-1">
            <li>You and the family members who log in with the same mobile number.</li>
            <li>The admins of your pathshala. Other pathshalas cannot see your data.</li>
            <li>Leaderboards inside your pathshala show names and points to its students.</li>
          </ul>
          <p>
            We do not sell or share personal data. It is kept with the services that run the app: Vercel (website
            hosting and anonymous page-view counts, without cookies), MongoDB Atlas (database) and Telegram (admin
            notifications). Data is sent over encrypted connections (HTTPS).
          </p>
        </Section>

        <Section title="On your phone">
          <p>
            The app remembers your login and your language and text-size choices on your phone, so you don&apos;t
            have to log in every day. Logging out removes the login from the phone.
          </p>
        </Section>

        <Section id="delete" title="Delete your account">
          <p>You can ask for your account and its data to be deleted at any time:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Ask your pathshala admin to delete your student record, or</li>
            <li>Email <a className="text-kumkum-700 underline" href={`mailto:${CONTACT_EMAIL}?subject=Delete%20my%20Jain%20Pathshala%20account`}>{CONTACT_EMAIL}</a> from
              any address with your name, your mobile number and your pathshala&apos;s name.</li>
          </ol>
          <p>
            We delete the login, profile details, attendance, gatha and Niyam Yatra records within 30 days. Totals
            already counted in a pathshala&apos;s past reports may keep the count but not your name.
          </p>
        </Section>

        <Section title="Children">
          <p>
            Many students are children. Their accounts are created by their pathshala and used together with their
            parents, who log in with the family&apos;s mobile number. A parent can ask for a child&apos;s data to be
            deleted as described above.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Moksh Mehta · <a className="text-kumkum-700 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>If this policy changes, the new version will be posted on this page.</p>
        </Section>

        <p className="mt-8 text-center"><Link href="/" className="text-kumkum-700 font-semibold underline">← Jain Pathshala</Link></p>
      </article>
    </main>
  );
}
