const BENEFITS = [
  ['More options for office and data-entry tasks', 'Many office roles involve entering, updating, or organizing information. Typing clearly in the language a document requires can make those tasks easier to handle.'],
  ['A useful foundation for freelance and remote work', 'Freelancers often write proposals, client messages, notes, drafts, and deliverables. Typing supports that work, while clients, income, and opportunities still depend on the service and its quality.'],
  ['Quicker document creation and editing', 'Familiarity with the keyboard helps you draft applications, letters, reports, and notes with fewer pauses to search for keys. Reviewing the wording is still important.'],
  ['Easier emails and messages', 'You can write to a colleague in English, explain something to a family member in Urdu, or choose whichever language fits the reader.'],
  ['Support for study and research', 'Students can prepare assignments, organize notes, and record ideas in the language required for their course or source material.'],
  ['Smoother everyday digital tasks', 'Lists, forms, personal records, and online searches are easier to manage when you can type the words you need in either language.'],
  ['Preparation for relevant typing assessments', 'Some roles or courses may include a typing test. Regular practice helps you get comfortable with timed text entry, but each assessment has its own rules and requirements.'],
  ['More ways to create bilingual content', 'Typing both scripts can help with captions, notices, learning resources, and posts intended for readers who use Urdu and English.'],
  ['Help with customer service and administration', 'A role may require written replies, records, or instructions in one or both languages. Clear typing makes those exchanges easier to prepare and review.'],
  ['More confidence with digital tools', 'When typing feels familiar, you can spend more attention on the task itself, whether you are completing a form, preparing a file, or communicating online.'],
];

export function BilingualTypingBenefits() {
  return (
    <ol className="mt-5 grid gap-3 sm:grid-cols-2">
      {BENEFITS.map(([title, body], index) => (
        <li key={title} className="rounded-xl border p-4" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-card)' }}>
          <h3 className="flex items-start gap-3 text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-extrabold" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent-text)' }}>{index + 1}</span>
            {title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{body}</p>
        </li>
      ))}
    </ol>
  );
}
